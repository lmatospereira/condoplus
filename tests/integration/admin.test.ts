import { randomUUID } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dataISO, hojeSP } from "@/lib/datas";
import { prisma } from "@/lib/db";
import { ErroNegocio } from "@/lib/erros";
import { PermissaoNegada, type Ator } from "@/lib/permissions";
import { espacoSchema } from "@/lib/schemas/admin";
import {
  adicionarCasas,
  atorMaster,
  criarCondominio,
  definirSindico,
  excluirEspaco,
  redefinirSenhaUsuario,
  removerSindico,
  renomearCasa,
  salvarEspaco,
} from "@/server/admin";

const sufixo = randomUUID().slice(0, 8);
const email = (n: string) => `${n}-${sufixo}@teste.local`;
let master: Ator;
const condominios: string[] = [];

const dadosCond = { nome: "Teste", endereco: "Rua X", cidade: "Campinas", uf: "SP" as const, cnpj: null };

function diasAPartirDeHoje(n: number) {
  const d = hojeSP();
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function espaco(over: Record<string, string> = {}) {
  return espacoSchema.parse({ nome: "Salão", modo: "DIA_INTEIRO", ativo: "on", ...over });
}

async function novoCondominio(casas = 3) {
  const c = await criarCondominio(master, { ...dadosCond, quantidadeCasas: casas, prefixoCasa: "Casa" });
  condominios.push(c.id);
  return c;
}

beforeAll(async () => {
  expect(process.env.DATABASE_URL).toMatch(/_test(\?|$)/);
  const id = randomUUID();
  await prisma.user.create({ data: { id, name: "Master", email: email("master"), isMaster: true } });
  master = atorMaster(id);
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { OR: [{ condominioId: { in: condominios } }, { userId: master.userId }] } });
  await prisma.condominio.deleteMany({ where: { id: { in: condominios } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${sufixo}@teste.local` } } });
  await prisma.$disconnect();
});

describe("condomínios e casas", () => {
  it("cria o condomínio com as casas numeradas e registra auditoria", async () => {
    const c = await novoCondominio(12);
    const casas = await prisma.unidade.findMany({ where: { condominioId: c.id }, orderBy: { identificador: "asc" } });
    expect(casas.map((u) => u.identificador)).toEqual(Array.from({ length: 12 }, (_, i) => `Casa ${String(i + 1).padStart(2, "0")}`));
    expect(await prisma.auditLog.count({ where: { condominioId: c.id, acao: "condominio.criar" } })).toBe(1);
  });

  it("só o master cria condomínios (síndico e morador recebem PermissaoNegada)", async () => {
    const sindico: Ator = { userId: "x", isMaster: false, sindico: true, unidadeIds: [] };
    await expect(criarCondominio(sindico, { ...dadosCond, quantidadeCasas: 1, prefixoCasa: "Casa" })).rejects.toBeInstanceOf(PermissaoNegada);
  });

  it("adicionar em sequência continua a numeração; duplicado gera erro amigável", async () => {
    const c = await novoCondominio(3);
    expect(await adicionarCasas(master, c.id, { modo: "quantidade", quantidade: 2, prefixo: "Casa" })).toBe(2);
    const ids = (await prisma.unidade.findMany({ where: { condominioId: c.id } })).map((u) => u.identificador).sort();
    expect(ids).toEqual(["Casa 01", "Casa 02", "Casa 03", "Casa 04", "Casa 05"]);
    await expect(adicionarCasas(master, c.id, { modo: "individual", identificador: "Casa 02" })).rejects.toBeInstanceOf(ErroNegocio);
  });

  it("renomear não alcança casa de outro condomínio", async () => {
    const a = await novoCondominio(1);
    const b = await novoCondominio(1);
    const casaB = await prisma.unidade.findFirstOrThrow({ where: { condominioId: b.id } });
    await expect(renomearCasa(master, a.id, casaB.id, "Hack")).rejects.toBeInstanceOf(ErroNegocio);
    expect((await prisma.unidade.findUniqueOrThrow({ where: { id: casaB.id } })).identificador).toBe("Casa 01");
  });
});

describe("síndico (sem e-mail: senha provisória)", () => {
  it("conta nova recebe senha provisória válida e é obrigada a trocar", async () => {
    const c = await novoCondominio();
    const r = await definirSindico(master, c.id, { nome: "Sílvia", email: email("silvia"), telefone: null });
    expect(r.senhaProvisoria).toMatch(/^[\w]{4}-[\w]{4}-[\w]{4}$/);

    const u = await prisma.user.findUniqueOrThrow({ where: { email: email("silvia") }, include: { accounts: true } });
    expect(u.trocarSenha).toBe(true);
    expect(await verifyPassword({ hash: u.accounts[0].password!, password: r.senhaProvisoria! })).toBe(true);
    expect(await prisma.vinculo.count({ where: { condominioId: c.id, papel: "SINDICO", status: "ATIVO", userId: u.id } })).toBe(1);
  });

  it("trocar inativa o anterior; e-mail existente é vinculado sem mexer na senha", async () => {
    const c = await novoCondominio();
    await definirSindico(master, c.id, { nome: "Primeiro", email: email("primeiro"), telefone: null });

    const outro = await novoCondominio();
    const existente = await definirSindico(master, outro.id, { nome: "Já existe", email: email("existente"), telefone: null });
    const antes = await prisma.account.findFirstOrThrow({ where: { user: { email: email("existente") } } });

    const r = await definirSindico(master, c.id, { nome: "Ignorado", email: email("existente"), telefone: null });
    expect(r.senhaProvisoria).toBeNull();
    expect(r.nome).toBe(existente.nome);
    expect((await prisma.account.findFirstOrThrow({ where: { id: antes.id } })).password).toBe(antes.password);

    const vinculos = await prisma.vinculo.findMany({ where: { condominioId: c.id, papel: "SINDICO" }, include: { user: true } });
    expect(vinculos.filter((v) => v.status === "ATIVO").map((v) => v.user.email)).toEqual([email("existente")]);
    expect(vinculos.find((v) => v.user.email === email("primeiro"))?.status).toBe("INATIVO");
    expect(await prisma.auditLog.count({ where: { condominioId: c.id, acao: "sindico.trocar" } })).toBe(1);
  });

  it("síndico anterior que mora no condomínio continua como morador", async () => {
    const c = await novoCondominio();
    await definirSindico(master, c.id, { nome: "Mora aqui", email: email("mora"), telefone: null });
    const u = await prisma.user.findUniqueOrThrow({ where: { email: email("mora") } });
    const casa = await prisma.unidade.findFirstOrThrow({ where: { condominioId: c.id } });
    await prisma.vinculo.create({ data: { userId: u.id, condominioId: c.id, unidadeId: casa.id, papel: "MORADOR", tipo: "TITULAR", status: "ATIVO" } });

    await definirSindico(master, c.id, { nome: "Novo", email: email("novo"), telefone: null });
    const ativos = await prisma.vinculo.findMany({ where: { userId: u.id, condominioId: c.id, status: "ATIVO" } });
    expect(ativos.map((v) => v.papel)).toEqual(["MORADOR"]);
  });

  it("recusa o master como síndico e a mesma pessoa duas vezes", async () => {
    const c = await novoCondominio();
    await expect(definirSindico(master, c.id, { nome: "M", email: email("master"), telefone: null })).rejects.toBeInstanceOf(ErroNegocio);
    await definirSindico(master, c.id, { nome: "Duas", email: email("duas"), telefone: null });
    await expect(definirSindico(master, c.id, { nome: "Duas", email: email("duas"), telefone: null })).rejects.toBeInstanceOf(ErroNegocio);
  });

  it("o síndico não consegue promover ninguém", async () => {
    const c = await novoCondominio();
    const sindico: Ator = { userId: "s", isMaster: false, sindico: true, unidadeIds: [] };
    await expect(definirSindico(sindico, c.id, { nome: "X", email: email("x"), telefone: null })).rejects.toBeInstanceOf(PermissaoNegada);
    await expect(removerSindico(sindico, c.id)).rejects.toBeInstanceOf(PermissaoNegada);
  });

  it("o banco garante um único síndico ativo por condomínio", async () => {
    const c = await novoCondominio();
    await definirSindico(master, c.id, { nome: "A", email: email("unico-a"), telefone: null });
    const outro = randomUUID();
    await prisma.user.create({ data: { id: outro, name: "B", email: email("unico-b") } });
    await expect(
      prisma.vinculo.create({ data: { userId: outro, condominioId: c.id, papel: "SINDICO", status: "ATIVO" } }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});

describe("redefinir senha", () => {
  it("gera senha provisória, encerra sessões e não alcança outro condomínio", async () => {
    const c = await novoCondominio();
    const outro = await novoCondominio();
    await definirSindico(master, c.id, { nome: "Reset", email: email("reset"), telefone: null });
    const u = await prisma.user.findUniqueOrThrow({ where: { email: email("reset") } });
    await prisma.user.update({ where: { id: u.id }, data: { trocarSenha: false } });
    await prisma.session.create({ data: { id: randomUUID(), token: randomUUID(), userId: u.id, expiresAt: new Date(Date.now() + 3600e3) } });

    await expect(redefinirSenhaUsuario(master, outro.id, u.id)).rejects.toBeInstanceOf(ErroNegocio);

    const r = await redefinirSenhaUsuario(master, c.id, u.id);
    const depois = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, include: { accounts: true, sessions: true } });
    expect(depois.trocarSenha).toBe(true);
    expect(depois.sessions).toHaveLength(0);
    expect(await verifyPassword({ hash: depois.accounts[0].password!, password: r.senhaProvisoria })).toBe(true);
  });
});

describe("espaços", () => {
  it("valida períodos e antecedência", () => {
    expect(() => espaco({ modo: "PERIODOS" })).toThrow();
    expect(() => espaco({ antecedenciaMinDias: "10", antecedenciaMaxDias: "5" })).toThrow();
    expect(espaco({ modo: "PERIODOS", periodos: "Manhã, Tarde\nManhã" }).periodos).toEqual(["Manhã", "Tarde"]);
    expect(espaco({ periodos: "Manhã" }).periodos).toEqual([]); // dia inteiro descarta períodos
    expect(espaco({ diasBloqueados: "2030-12-31 2030-12-24" }).diasBloqueados.map(dataISO)).toEqual(["2030-12-24", "2030-12-31"]);
    expect(() => espaco({ diasBloqueados: "31/12/2030" })).toThrow();
  });

  it("não muda o modo com reservas futuras ativas; com só reservas passadas, muda", async () => {
    const c = await novoCondominio(1);
    const e = await salvarEspaco(master, c.id, espaco());
    const casa = await prisma.unidade.findFirstOrThrow({ where: { condominioId: c.id } });
    const base = { condominioId: c.id, espacoId: e.id, unidadeId: casa.id, periodo: "DIA_INTEIRO", criadoPorId: master.userId };

    const futura = await prisma.reserva.create({ data: { ...base, data: diasAPartirDeHoje(5) } });
    await expect(salvarEspaco(master, c.id, espaco({ modo: "PERIODOS", periodos: "Manhã" }), e.id)).rejects.toBeInstanceOf(ErroNegocio);

    await prisma.reserva.update({ where: { id: futura.id }, data: { excluidoEm: new Date() } });
    await prisma.reserva.create({ data: { ...base, data: diasAPartirDeHoje(-3) } });
    const salvo = await salvarEspaco(master, c.id, espaco({ modo: "PERIODOS", periodos: "Manhã, Noite" }), e.id);
    expect(salvo.modo).toBe("PERIODOS");
  });

  it("não remove período com reserva futura, mas pode adicionar", async () => {
    const c = await novoCondominio(1);
    const e = await salvarEspaco(master, c.id, espaco({ modo: "PERIODOS", periodos: "Manhã, Noite" }));
    const casa = await prisma.unidade.findFirstOrThrow({ where: { condominioId: c.id } });
    await prisma.reserva.create({
      data: { condominioId: c.id, espacoId: e.id, unidadeId: casa.id, periodo: "Noite", data: diasAPartirDeHoje(2), criadoPorId: master.userId },
    });
    await expect(salvarEspaco(master, c.id, espaco({ modo: "PERIODOS", periodos: "Manhã" }), e.id)).rejects.toBeInstanceOf(ErroNegocio);
    const ok = await salvarEspaco(master, c.id, espaco({ modo: "PERIODOS", periodos: "Manhã, Tarde, Noite" }), e.id);
    expect(ok.periodos).toEqual(["Manhã", "Tarde", "Noite"]);
  });

  it("exclui espaço sem reservas; com histórico, pede para desativar", async () => {
    const c = await novoCondominio(1);
    const livre = await salvarEspaco(master, c.id, espaco({ nome: "Livre" }));
    await excluirEspaco(master, c.id, livre.id);
    expect(await prisma.espaco.count({ where: { id: livre.id } })).toBe(0);

    const usado = await salvarEspaco(master, c.id, espaco({ nome: "Usado" }));
    const casa = await prisma.unidade.findFirstOrThrow({ where: { condominioId: c.id } });
    await prisma.reserva.create({
      data: { condominioId: c.id, espacoId: usado.id, unidadeId: casa.id, periodo: "DIA_INTEIRO", data: diasAPartirDeHoje(-10), criadoPorId: master.userId },
    });
    await expect(excluirEspaco(master, c.id, usado.id)).rejects.toBeInstanceOf(ErroNegocio);
  });

  it("síndico não altera espaços (testado no servidor)", async () => {
    const c = await novoCondominio(1);
    const sindico: Ator = { userId: "s", isMaster: false, sindico: true, unidadeIds: [] };
    await expect(salvarEspaco(sindico, c.id, espaco())).rejects.toBeInstanceOf(PermissaoNegada);
  });
});
