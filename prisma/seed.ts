/**
 * Seed de desenvolvimento (seção 12). Idempotente para o master; os dados de
 * exemplo são recriados do zero a cada execução (apenas em desenvolvimento).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { ensureMaster } from "../src/lib/bootstrap";

if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
  console.error("Seed de exemplo bloqueado em produção (defina SEED_FORCE=1 para forçar).");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const SENHA = "senha12345";

async function criarUsuario(nome: string, email: string, telefone?: string) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      name: nome,
      email,
      telefone,
      emailVerified: true,
      accounts: {
        create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(SENHA) },
      },
    },
  });
  return id;
}

function dataISO(diasAPartirDeHoje: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + diasAPartirDeHoje);
  return d;
}

async function main() {
  const masterId = await ensureMaster(prisma);
  if (!masterId) throw new Error("Defina MASTER_EMAIL e MASTER_PASSWORD no .env");

  // Limpa os dados de exemplo (mantém o master).
  await prisma.auditLog.deleteMany();
  await prisma.condominio.deleteMany();
  await prisma.user.deleteMany({ where: { isMaster: false } });

  // --- Condomínio principal --------------------------------------------------
  const cond = await prisma.condominio.create({
    data: {
      nome: "Residencial Exemplo",
      endereco: "Rua das Palmeiras, 100",
      cidade: "Campinas",
      uf: "SP",
      unidades: {
        create: Array.from({ length: 18 }, (_, i) => ({ identificador: `Casa ${String(i + 1).padStart(2, "0")}` })),
      },
      espacos: {
        create: {
          nome: "Salão de festas",
          capacidade: 60,
          modo: "DIA_INTEIRO",
          regras: "Uso até as 23h. Deixar o salão limpo e entregar a chave na portaria no dia seguinte.",
          antecedenciaMaxDias: 120,
          limiteMensalPorUnidade: 2,
        },
      },
    },
    include: { unidades: { orderBy: { identificador: "asc" } }, espacos: true },
  });
  const casa = (n: number) => cond.unidades[n - 1].id;

  const sindicoId = await criarUsuario("Sílvia Síndica", "sindico@exemplo.com", "(19) 99999-0001");
  await prisma.vinculo.createMany({
    data: [
      { userId: sindicoId, condominioId: cond.id, papel: "SINDICO", status: "ATIVO", aprovadoPorId: masterId, aprovadoEm: new Date() },
      { userId: sindicoId, condominioId: cond.id, unidadeId: casa(1), papel: "MORADOR", tipo: "TITULAR", status: "ATIVO", aprovadoPorId: masterId, aprovadoEm: new Date() },
    ],
  });

  const moradores = [
    ["Ana Souza", "ana@exemplo.com", 3],
    ["Bruno Lima", "bruno@exemplo.com", 5],
    ["Carla Mendes", "carla@exemplo.com", 7],
    ["Diego Rocha", "diego@exemplo.com", 9],
    ["Elisa Prado", "elisa@exemplo.com", 12],
  ] as const;
  const moradorIds: string[] = [];
  for (const [nome, email, n] of moradores) {
    const id = await criarUsuario(nome, email);
    moradorIds.push(id);
    await prisma.vinculo.create({
      data: { userId: id, condominioId: cond.id, unidadeId: casa(n), papel: "MORADOR", tipo: "TITULAR", status: "ATIVO", aprovadoPorId: sindicoId, aprovadoEm: new Date() },
    });
  }

  // Cadastro pendente (casa sem titular) e transferência pendente (casa 05 já tem titular).
  const pendenteId = await criarUsuario("Fábio Pendente", "pendente@exemplo.com");
  await prisma.vinculo.create({
    data: { userId: pendenteId, condominioId: cond.id, unidadeId: casa(14), papel: "MORADOR", tipo: "TITULAR", status: "PENDENTE" },
  });
  const transfId = await criarUsuario("Gabriela Nova", "transferencia@exemplo.com");
  await prisma.vinculo.create({
    data: { userId: transfId, condominioId: cond.id, unidadeId: casa(5), papel: "MORADOR", tipo: "TITULAR", status: "PENDENTE", ehTransferencia: true },
  });

  await prisma.convite.create({ data: { condominioId: cond.id, token: "convite-exemplo-dev-0000000000000000", criadoPorId: sindicoId } });

  // Comunicados
  await prisma.comunicado.createMany({
    data: [
      { condominioId: cond.id, autorId: sindicoId, titulo: "Assembleia geral ordinária", conteudo: "Convocamos todos para a assembleia no dia 30, às 19h, no salão de festas.", categoria: "ASSEMBLEIA", importante: true, fixado: true },
      { condominioId: cond.id, autorId: sindicoId, titulo: "Manutenção do portão", conteudo: "O portão principal passará por manutenção na próxima terça, das 8h às 12h.", categoria: "MANUTENCAO" },
      { condominioId: cond.id, autorId: sindicoId, titulo: "Boas-vindas ao condoplus", conteudo: "A partir de agora, comunicados, reservas e a prestação de contas ficam por aqui.", categoria: "GERAL" },
    ],
  });

  // Despesas dos últimos 3 meses
  const categorias = ["AGUA", "ENERGIA", "LIMPEZA", "JARDINAGEM", "SEGURANCA", "ADMINISTRACAO"] as const;
  const despesas = [];
  for (let m = 0; m < 3; m++) {
    for (const [i, categoria] of categorias.entries()) {
      const data = new Date();
      data.setUTCHours(0, 0, 0, 0);
      data.setUTCDate(5 + i);
      data.setUTCMonth(data.getUTCMonth() - m);
      despesas.push({
        condominioId: cond.id,
        lancadoPorId: sindicoId,
        data,
        categoria,
        descricao: `${categoria.charAt(0)}${categoria.slice(1).toLowerCase()} — mês ${m + 1}`,
        valorCentavos: 25000 + i * 13700 + m * 2100,
      });
    }
  }
  await prisma.despesa.createMany({ data: despesas });

  // Reservas futuras
  const salao = cond.espacos[0];
  await prisma.reserva.createMany({
    data: [
      { condominioId: cond.id, espacoId: salao.id, unidadeId: casa(3), data: dataISO(7), periodo: "DIA_INTEIRO", criadoPorId: moradorIds[0] },
      { condominioId: cond.id, espacoId: salao.id, unidadeId: casa(7), data: dataISO(14), periodo: "DIA_INTEIRO", criadoPorId: moradorIds[2] },
      { condominioId: cond.id, espacoId: salao.id, unidadeId: casa(1), data: dataISO(21), periodo: "DIA_INTEIRO", criadoPorId: sindicoId },
    ],
  });

  // Documentos de exemplo ficam para a fase 5 (dependem do storage).

  // --- Segundo condomínio (teste de isolamento) ------------------------------
  const cond2 = await prisma.condominio.create({
    data: {
      nome: "Vila Pequena",
      endereco: "Rua B, 20",
      cidade: "Valinhos",
      uf: "SP",
      unidades: { create: [{ identificador: "Casa 1" }, { identificador: "Casa 2" }, { identificador: "Casa 3" }] },
      espacos: { create: { nome: "Churrasqueira", modo: "PERIODOS", periodos: ["Almoço", "Jantar"] } },
    },
    include: { unidades: true },
  });
  const sindico2 = await criarUsuario("Otávio Outro", "sindico2@exemplo.com");
  await prisma.vinculo.create({
    data: { userId: sindico2, condominioId: cond2.id, papel: "SINDICO", status: "ATIVO", aprovadoPorId: masterId, aprovadoEm: new Date() },
  });
  await prisma.comunicado.create({
    data: { condominioId: cond2.id, autorId: sindico2, titulo: "Comunicado da Vila Pequena", conteudo: "Visível só para a Vila Pequena." },
  });

  // Ana também mora na Vila Pequena (usuário em dois condomínios).
  await prisma.vinculo.create({
    data: { userId: moradorIds[0], condominioId: cond2.id, unidadeId: cond2.unidades[0].id, papel: "MORADOR", tipo: "TITULAR", status: "ATIVO", aprovadoPorId: sindico2, aprovadoEm: new Date() },
  });

  console.log("Seed concluído. Senha de todos os usuários de exemplo:", SENHA);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
