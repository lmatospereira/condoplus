import { randomUUID } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hojeSP } from "@/lib/datas";
import { prisma } from "@/lib/db";
import { ErroNegocio } from "@/lib/erros";
import { PermissaoNegada, type Ator } from "@/lib/permissions";
import { atorMaster, criarCondominio, definirSindico, salvarEspaco } from "@/server/admin";
import {
  abrirComunicado,
  contarNaoLidos,
  criarComunicado,
  excluirComunicado,
  leituraPorCasas,
  listarComunicados,
} from "@/server/comunicados";
import {
  abrirConvite,
  aprovarVinculo,
  cadastrarPorConvite,
  desativarMorador,
  gerarConvite,
  pedirMudancaDeCasa,
  recusarVinculo,
  reservasDeExMoradores,
  revogarConvite,
} from "@/server/moradores";
import { criarReserva, DIA_INTEIRO, excluirReserva } from "@/server/reservas";
import { espacoSchema } from "@/lib/schemas/admin";

const sufixo = randomUUID().slice(0, 8);
const email = (n: string) => `${n}-${sufixo}@teste.local`;
const condominios: string[] = [];
let master: Ator;

function dia(n: number) {
  const d = hojeSP();
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/** Condomínio com 4 casas, síndico ativo e um salão (dia inteiro) + churrasqueira (períodos). */
async function cenario() {
  const c = await criarCondominio(master, { nome: "Mod", endereco: "R", cidade: "C", uf: "SP", cnpj: null, quantidadeCasas: 4, prefixoCasa: "Casa" });
  condominios.push(c.id);
  const tag = randomUUID().slice(0, 6);
  await definirSindico(master, c.id, { nome: "Síndica", email: email(`sind-${tag}`), telefone: null });
  const sindicoUser = await prisma.user.findUniqueOrThrow({ where: { email: email(`sind-${tag}`) } });
  const casas = await prisma.unidade.findMany({ where: { condominioId: c.id }, orderBy: { identificador: "asc" } });
  const salao = await salvarEspaco(master, c.id, espacoSchema.parse({ nome: "Salão", modo: "DIA_INTEIRO", ativo: "on" }));
  const churras = await salvarEspaco(master, c.id, espacoSchema.parse({ nome: "Churrasqueira", modo: "PERIODOS", periodos: "Almoço, Jantar", ativo: "on" }));
  const sindico: Ator = { userId: sindicoUser.id, isMaster: false, sindico: true, unidadeIds: [] };
  return { c, casas, salao, churras, sindico, tag };
}

/** Cadastra pelo convite e aprova; devolve o ator do morador. */
async function moradorAtivo(s: Awaited<ReturnType<typeof cenario>>, nome: string, casa: number, situacao: "titular" | "comorador" | "transferencia" = "titular") {
  const convite = (await prisma.convite.findFirst({ where: { condominioId: s.c.id, revogadoEm: null } })) ?? (await gerarConvite(s.sindico, s.c.id, null));
  const r = await cadastrarPorConvite(convite.token, { nome, email: email(`${nome}-${s.tag}`), telefone: null, senha: "senha-forte-1", unidadeId: s.casas[casa].id, situacao });
  await aprovarVinculo(s.sindico, s.c.id, r.vinculoId);
  return { userId: r.userId, isMaster: false, sindico: false, unidadeIds: [s.casas[casa].id] } satisfies Ator;
}

beforeAll(async () => {
  expect(process.env.DATABASE_URL).toMatch(/_test(\?|$)/);
  const id = randomUUID();
  await prisma.user.create({ data: { id, name: "Master", email: email("master"), isMaster: true } });
  master = atorMaster(id);
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { condominioId: { in: condominios } } });
  await prisma.auditLog.deleteMany({ where: { user: { email: { endsWith: `-${sufixo}@teste.local` } } } });
  await prisma.condominio.deleteMany({ where: { id: { in: condominios } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${sufixo}@teste.local` } } });
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
describe("convites e moradores", () => {
  it("convite: gerar novo revoga o anterior; revogado/expirado é inválido", async () => {
    const s = await cenario();
    const a = await gerarConvite(s.sindico, s.c.id, null);
    const b = await gerarConvite(s.sindico, s.c.id, 7);
    expect(await abrirConvite(a.token)).toBeNull();
    const aberto = await abrirConvite(b.token);
    expect(aberto?.unidades).toHaveLength(4);
    await revogarConvite(s.sindico, s.c.id);
    expect(await abrirConvite(b.token)).toBeNull();
    const morador: Ator = { userId: "x", isMaster: false, sindico: false, unidadeIds: ["u"] };
    await expect(gerarConvite(morador, s.c.id, null)).rejects.toBeInstanceOf(PermissaoNegada);
  });

  it("cadastro fica PENDENTE com a senha escolhida; só acessa após aprovação", async () => {
    const s = await cenario();
    const convite = await gerarConvite(s.sindico, s.c.id, null);
    const r = await cadastrarPorConvite(convite.token, { nome: "Ana", email: email(`ana-${s.tag}`), telefone: "19", senha: "minha-senha-1", unidadeId: s.casas[0].id, situacao: "titular" });
    const v = await prisma.vinculo.findUniqueOrThrow({ where: { id: r.vinculoId } });
    expect(v).toMatchObject({ status: "PENDENTE", tipo: "TITULAR", ehTransferencia: false });
    const conta = await prisma.account.findFirstOrThrow({ where: { userId: r.userId } });
    expect(await verifyPassword({ hash: conta.password!, password: "minha-senha-1" })).toBe(true);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: r.userId } })).trocarSenha).toBe(false);

    await aprovarVinculo(s.sindico, s.c.id, r.vinculoId);
    expect((await prisma.vinculo.findUniqueOrThrow({ where: { id: r.vinculoId } })).status).toBe("ATIVO");
  });

  it("casa com titular exige escolher co-morador ou transferência", async () => {
    const s = await cenario();
    await moradorAtivo(s, "titular", 1);
    const convite = (await prisma.convite.findFirstOrThrow({ where: { condominioId: s.c.id, revogadoEm: null } })).token;
    await expect(
      cadastrarPorConvite(convite, { nome: "X", email: email(`x-${s.tag}`), telefone: null, senha: "senha-forte-1", unidadeId: s.casas[1].id, situacao: "titular" }),
    ).rejects.toBeInstanceOf(ErroNegocio);
    const co = await cadastrarPorConvite(convite, { nome: "Co", email: email(`co-${s.tag}`), telefone: null, senha: "senha-forte-1", unidadeId: s.casas[1].id, situacao: "comorador" });
    expect((await prisma.vinculo.findUniqueOrThrow({ where: { id: co.vinculoId } })).tipo).toBe("COMORADOR");
  });

  it("e-mail existente exige a senha da conta (não dá para pedir vínculo em nome de outro)", async () => {
    const s = await cenario();
    const outro = await cenario();
    await moradorAtivo(s, "dono", 0);
    const convite = await gerarConvite(outro.sindico, outro.c.id, null);
    const base = { nome: "Dono", email: email(`dono-${s.tag}`), telefone: null, unidadeId: outro.casas[0].id, situacao: "titular" as const };
    await expect(cadastrarPorConvite(convite.token, { ...base, senha: "senha-errada" })).rejects.toBeInstanceOf(ErroNegocio);
    const r = await cadastrarPorConvite(convite.token, { ...base, senha: "senha-forte-1" });
    expect(r.contaNova).toBe(false);
    // mesmo usuário, agora com pedido em dois condomínios
    expect(await prisma.vinculo.count({ where: { userId: r.userId } })).toBe(2);
    await expect(cadastrarPorConvite(convite.token, { ...base, senha: "senha-forte-1" })).rejects.toBeInstanceOf(ErroNegocio);
  });

  it("transferência aprovada desativa os vínculos da casa, mantém histórico e aponta reservas futuras", async () => {
    const s = await cenario();
    const antigo = await moradorAtivo(s, "antigo", 2);
    const co = await moradorAtivo(s, "co", 2, "comorador");
    await criarReserva(antigo, s.c.id, { espacoId: s.salao.id, data: dia(10), periodo: DIA_INTEIRO, unidadeId: s.casas[2].id });

    const convite = (await prisma.convite.findFirstOrThrow({ where: { condominioId: s.c.id, revogadoEm: null } })).token;
    const novo = await cadastrarPorConvite(convite, { nome: "Novo", email: email(`novo-${s.tag}`), telefone: null, senha: "senha-forte-1", unidadeId: s.casas[2].id, situacao: "transferencia" });
    const r = await aprovarVinculo(s.sindico, s.c.id, novo.vinculoId);
    expect(r.reservasDeExMoradores).toBe(1);

    const vinculos = await prisma.vinculo.findMany({ where: { unidadeId: s.casas[2].id } });
    expect(vinculos).toHaveLength(3); // nada excluído
    expect(vinculos.filter((v) => v.status === "ATIVO").map((v) => v.userId)).toEqual([novo.userId]);
    expect(vinculos.find((v) => v.userId === co.userId)?.status).toBe("INATIVO");
    expect(await reservasDeExMoradores(s.sindico, s.c.id)).toHaveLength(1);
  });

  it("mudança de casa: ao aprovar, a casa antiga é desativada", async () => {
    const s = await cenario();
    const m = await moradorAtivo(s, "muda", 0);
    const pedido = await pedirMudancaDeCasa(m, s.c.id, { unidadeId: s.casas[3].id, situacao: "titular" });
    await expect(pedirMudancaDeCasa(m, s.c.id, { unidadeId: s.casas[3].id, situacao: "titular" })).rejects.toBeInstanceOf(ErroNegocio);
    await aprovarVinculo(s.sindico, s.c.id, pedido.id);
    const ativos = await prisma.vinculo.findMany({ where: { userId: m.userId, condominioId: s.c.id, status: "ATIVO" } });
    expect(ativos.map((v) => v.unidadeId)).toEqual([s.casas[3].id]);
  });

  it("recusa guarda o motivo; morador não aprova nem desativa; síndico de outro condomínio não alcança", async () => {
    const s = await cenario();
    const outro = await cenario();
    const convite = await gerarConvite(s.sindico, s.c.id, null);
    const r = await cadastrarPorConvite(convite.token, { nome: "Rec", email: email(`rec-${s.tag}`), telefone: null, senha: "senha-forte-1", unidadeId: s.casas[0].id, situacao: "titular" });
    const morador = await moradorAtivo(s, "mor", 1);
    await expect(aprovarVinculo(morador, s.c.id, r.vinculoId)).rejects.toBeInstanceOf(PermissaoNegada);
    await expect(aprovarVinculo(outro.sindico, outro.c.id, r.vinculoId)).rejects.toBeInstanceOf(ErroNegocio);

    await recusarVinculo(s.sindico, s.c.id, r.vinculoId, "Não reconhecemos o morador");
    expect(await prisma.vinculo.findUniqueOrThrow({ where: { id: r.vinculoId } })).toMatchObject({ status: "RECUSADO", motivoRecusa: "Não reconhecemos o morador" });

    const vMorador = await prisma.vinculo.findFirstOrThrow({ where: { userId: morador.userId, status: "ATIVO" } });
    await expect(desativarMorador(morador, s.c.id, vMorador.id)).rejects.toBeInstanceOf(PermissaoNegada);
    await desativarMorador(s.sindico, s.c.id, vMorador.id);
    expect((await prisma.vinculo.findUniqueOrThrow({ where: { id: vMorador.id } })).status).toBe("INATIVO");
  });
});

// ---------------------------------------------------------------------------
describe("reservas", () => {
  it("morador reserva só a própria casa; síndico reserva qualquer casa; master não reserva", async () => {
    const s = await cenario();
    const m = await moradorAtivo(s, "res", 0);
    await expect(criarReserva(m, s.c.id, { espacoId: s.salao.id, data: dia(3), periodo: DIA_INTEIRO, unidadeId: s.casas[1].id })).rejects.toBeInstanceOf(PermissaoNegada);
    const r = await criarReserva(m, s.c.id, { espacoId: s.salao.id, data: dia(3), periodo: "ignorado", unidadeId: s.casas[0].id });
    expect(r.periodo).toBe(DIA_INTEIRO);
    await criarReserva(s.sindico, s.c.id, { espacoId: s.salao.id, data: dia(4), periodo: DIA_INTEIRO, unidadeId: s.casas[3].id });
    await expect(criarReserva(master, s.c.id, { espacoId: s.salao.id, data: dia(5), periodo: DIA_INTEIRO, unidadeId: s.casas[0].id })).rejects.toBeInstanceOf(PermissaoNegada);
  });

  it("duas reservas simultâneas no mesmo espaço/data/período: só uma é gravada", async () => {
    const s = await cenario();
    const a = await moradorAtivo(s, "a", 0);
    const b = await moradorAtivo(s, "b", 1);
    const data = dia(6);
    const resultados = await Promise.allSettled([
      criarReserva(a, s.c.id, { espacoId: s.salao.id, data, periodo: DIA_INTEIRO, unidadeId: s.casas[0].id }),
      criarReserva(b, s.c.id, { espacoId: s.salao.id, data, periodo: DIA_INTEIRO, unidadeId: s.casas[1].id }),
    ]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const falha = resultados.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(falha.reason).toBeInstanceOf(ErroNegocio);
    expect(falha.reason.message).toMatch(/já está reservado/);
    expect(await prisma.reserva.count({ where: { espacoId: s.salao.id, data, excluidoEm: null } })).toBe(1);
  });

  it("períodos: dois períodos no mesmo dia; período inválido é recusado", async () => {
    const s = await cenario();
    const m = await moradorAtivo(s, "per", 0);
    await criarReserva(m, s.c.id, { espacoId: s.churras.id, data: dia(2), periodo: "Almoço", unidadeId: s.casas[0].id });
    await criarReserva(s.sindico, s.c.id, { espacoId: s.churras.id, data: dia(2), periodo: "Jantar", unidadeId: s.casas[2].id });
    await expect(criarReserva(m, s.c.id, { espacoId: s.churras.id, data: dia(2), periodo: "Madrugada", unidadeId: s.casas[0].id })).rejects.toBeInstanceOf(ErroNegocio);
  });

  it("datas passadas, dias bloqueados, antecedência e limite mensal (síndico ignora os dois últimos)", async () => {
    const s = await cenario();
    const m = await moradorAtivo(s, "reg", 0);
    const espaco = await salvarEspaco(
      master,
      s.c.id,
      espacoSchema.parse({ nome: "Quadra", modo: "DIA_INTEIRO", ativo: "on", antecedenciaMinDias: "2", antecedenciaMaxDias: "60", limiteMensalPorUnidade: "1", diasBloqueados: dia(20).toISOString().slice(0, 10) }),
    );
    const base = { espacoId: espaco.id, periodo: DIA_INTEIRO, unidadeId: s.casas[0].id };
    await expect(criarReserva(m, s.c.id, { ...base, data: dia(-1) })).rejects.toThrow(/passadas/);
    await expect(criarReserva(m, s.c.id, { ...base, data: dia(1) })).rejects.toThrow(/antecedência/);
    await expect(criarReserva(m, s.c.id, { ...base, data: dia(61) })).rejects.toThrow(/até 60 dias/);
    await expect(criarReserva(m, s.c.id, { ...base, data: dia(20) })).rejects.toThrow(/bloqueado/);
    await expect(criarReserva(s.sindico, s.c.id, { ...base, data: dia(20) })).rejects.toThrow(/bloqueado/);

    // limite mensal: duas datas no mesmo mês
    const d1 = new Date(Date.UTC(dia(40).getUTCFullYear(), dia(40).getUTCMonth(), 10));
    const d2 = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), 11));
    await criarReserva(m, s.c.id, { ...base, data: d1 });
    await expect(criarReserva(m, s.c.id, { ...base, data: d2 })).rejects.toThrow(/Limite/);
    await criarReserva(s.sindico, s.c.id, { ...base, data: d2 }); // síndico ignora
    await criarReserva(s.sindico, s.c.id, { ...base, data: dia(1) }); // e a antecedência
  });

  it("exclusão: morador só as próprias e futuras; síndico qualquer; soft delete libera a data", async () => {
    const s = await cenario();
    const a = await moradorAtivo(s, "ea", 0);
    const co = await moradorAtivo(s, "eco", 0, "comorador");
    const r = await criarReserva(a, s.c.id, { espacoId: s.salao.id, data: dia(8), periodo: DIA_INTEIRO, unidadeId: s.casas[0].id });
    await expect(excluirReserva(co, s.c.id, r.id)).rejects.toThrow(/que você criou/);
    await excluirReserva(a, s.c.id, r.id);
    const excluida = await prisma.reserva.findUniqueOrThrow({ where: { id: r.id } });
    expect(excluida.excluidoEm).not.toBeNull();
    expect(excluida.excluidoPorId).toBe(a.userId);
    await criarReserva(co, s.c.id, { espacoId: s.salao.id, data: dia(8), periodo: DIA_INTEIRO, unidadeId: s.casas[0].id });

    const passada = await prisma.reserva.create({
      data: { condominioId: s.c.id, espacoId: s.salao.id, unidadeId: s.casas[0].id, data: dia(-2), periodo: DIA_INTEIRO, criadoPorId: a.userId },
    });
    await expect(excluirReserva(a, s.c.id, passada.id)).rejects.toThrow(/passadas/);
    await excluirReserva(s.sindico, s.c.id, passada.id);
  });

  it("não reserva espaço de outro condomínio", async () => {
    const s = await cenario();
    const outro = await cenario();
    await expect(
      criarReserva(s.sindico, s.c.id, { espacoId: outro.salao.id, data: dia(3), periodo: DIA_INTEIRO, unidadeId: s.casas[0].id }),
    ).rejects.toThrow(/indisponível/);
  });
});

// ---------------------------------------------------------------------------
describe("comunicados", () => {
  it("só o síndico publica; fixados primeiro; não lido até abrir; leitura por casas", async () => {
    const s = await cenario();
    const a = await moradorAtivo(s, "ca", 0);
    const co = await moradorAtivo(s, "cco", 0, "comorador");
    await moradorAtivo(s, "cb", 1);
    const base = { conteudo: "Texto", categoria: "GERAL" as const, importante: false };

    await expect(criarComunicado(a, s.c.id, { ...base, titulo: "Hack", fixado: false })).rejects.toBeInstanceOf(PermissaoNegada);
    await expect(criarComunicado(master, s.c.id, { ...base, titulo: "Master", fixado: false })).rejects.toBeInstanceOf(PermissaoNegada);

    const antigo = await criarComunicado(s.sindico, s.c.id, { ...base, titulo: "Fixado antigo", fixado: true });
    const novo = await criarComunicado(s.sindico, s.c.id, { ...base, titulo: "Novo", fixado: false });
    const lista = await listarComunicados(a, s.c.id);
    expect(lista.map((c) => c.titulo)).toEqual(["Fixado antigo", "Novo"]);
    expect(lista.every((c) => !c.lido)).toBe(true);
    expect(await contarNaoLidos(a, s.c.id)).toBe(2);

    await abrirComunicado(co, s.c.id, novo.id);
    await abrirComunicado(co, s.c.id, novo.id); // idempotente
    const leitura = await leituraPorCasas(s.c.id, [novo.id, antigo.id]);
    expect(leitura.totalCasas).toBe(2);
    expect(leitura.casasLeram.get(novo.id)).toBe(1); // casa 0 (pelo co-morador)
    expect(leitura.casasLeram.get(antigo.id)).toBe(0);
    expect((await listarComunicados(co, s.c.id)).find((c) => c.id === novo.id)?.lido).toBe(true);
    expect((await listarComunicados(a, s.c.id)).find((c) => c.id === novo.id)?.lido).toBe(false);
  });

  it("busca e categoria; não lê nem exclui de outro condomínio", async () => {
    const s = await cenario();
    const outro = await cenario();
    await criarComunicado(s.sindico, s.c.id, { titulo: "Assembleia de dezembro", conteudo: "Pauta: obras", categoria: "ASSEMBLEIA", importante: true, fixado: false });
    await criarComunicado(s.sindico, s.c.id, { titulo: "Poda", conteudo: "Jardim", categoria: "MANUTENCAO", importante: false, fixado: false });
    expect((await listarComunicados(s.sindico, s.c.id, { q: "obras" })).map((c) => c.titulo)).toEqual(["Assembleia de dezembro"]);
    expect((await listarComunicados(s.sindico, s.c.id, { categoria: "MANUTENCAO" })).map((c) => c.titulo)).toEqual(["Poda"]);

    const deOutro = await criarComunicado(outro.sindico, outro.c.id, { titulo: "Secreto", conteudo: "x", categoria: "GERAL", importante: false, fixado: false });
    expect(await abrirComunicado(s.sindico, s.c.id, deOutro.id)).toBeNull();
    await expect(excluirComunicado(s.sindico, s.c.id, deOutro.id)).rejects.toBeInstanceOf(ErroNegocio);
    expect(await prisma.comunicado.count({ where: { id: deOutro.id } })).toBe(1);
  });
});
