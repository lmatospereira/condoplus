import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { tenantDb } from "@/lib/tenant-db";

/**
 * Isolamento entre condomínios na camada de dados: um cliente preso ao
 * condomínio A nunca lê nem altera dados do condomínio B.
 */
let A: string;
let B: string;
let userId: string;
let comunicadoB: string;
let unidadeB: string;
let reservaB: string;
let despesaB: string;

beforeAll(async () => {
  // Proteção: nunca rodar contra o banco de desenvolvimento.
  expect(process.env.DATABASE_URL).toMatch(/_test(\?|$)/);
  userId = randomUUID();
  await prisma.user.create({ data: { id: userId, name: "Teste", email: `t-${userId}@x.com` } });
  const base = { endereco: "R", cidade: "C", uf: "SP" };
  const ca = await prisma.condominio.create({ data: { nome: "A", ...base, unidades: { create: { identificador: "Casa 1" } } } });
  const cb = await prisma.condominio.create({
    data: {
      nome: "B",
      ...base,
      unidades: { create: { identificador: "Casa 1" } },
      espacos: { create: { nome: "Salão" } },
    },
    include: { unidades: true, espacos: true },
  });
  A = ca.id;
  B = cb.id;
  unidadeB = cb.unidades[0].id;
  comunicadoB = (await prisma.comunicado.create({ data: { condominioId: B, autorId: userId, titulo: "B", conteudo: "segredo" } })).id;
  reservaB = (
    await prisma.reserva.create({
      data: { condominioId: B, espacoId: cb.espacos[0].id, unidadeId: unidadeB, data: new Date("2030-01-01"), periodo: "DIA_INTEIRO", criadoPorId: userId },
    })
  ).id;
  despesaB = (
    await prisma.despesa.create({
      data: { condominioId: B, data: new Date("2030-01-01"), categoria: "AGUA", descricao: "x", valorCentavos: 100, lancadoPorId: userId },
    })
  ).id;
  await prisma.vinculo.create({ data: { userId, condominioId: B, unidadeId: unidadeB, papel: "MORADOR", tipo: "TITULAR", status: "ATIVO" } });
});

afterAll(async () => {
  await prisma.condominio.deleteMany({ where: { id: { in: [A, B] } } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("tenantDb", () => {
  it("listagens só trazem o próprio condomínio", async () => {
    const db = tenantDb(A);
    expect(await db.comunicado.findMany()).toHaveLength(0);
    expect(await db.reserva.findMany()).toHaveLength(0);
    expect(await db.despesa.findMany()).toHaveLength(0);
    expect(await db.vinculo.findMany()).toHaveLength(0);
    const unidades = await db.unidade.findMany();
    expect(unidades.every((u) => u.condominioId === A)).toBe(true);
  });

  it("busca por id de outro condomínio não encontra", async () => {
    const db = tenantDb(A);
    expect(await db.comunicado.findUnique({ where: { id: comunicadoB } })).toBeNull();
    expect(await db.reserva.findFirst({ where: { id: reservaB } })).toBeNull();
    expect(await db.unidade.findUnique({ where: { id: unidadeB } })).toBeNull();
  });

  it("filtro explícito por outro condomínio é sobrescrito", async () => {
    const db = tenantDb(A);
    expect(await db.comunicado.findMany({ where: { condominioId: B } })).toHaveLength(0);
    expect(await db.despesa.count({ where: { condominioId: B } })).toBe(0);
  });

  it("não altera nem exclui dados de outro condomínio", async () => {
    const db = tenantDb(A);
    await expect(db.comunicado.update({ where: { id: comunicadoB }, data: { titulo: "hack" } })).rejects.toThrow();
    await expect(db.despesa.delete({ where: { id: despesaB } })).rejects.toThrow();
    expect((await db.reserva.updateMany({ where: { id: reservaB }, data: { excluidoEm: new Date() } })).count).toBe(0);
    expect((await db.comunicado.deleteMany({})).count).toBe(0);

    const intacto = await prisma.comunicado.findUniqueOrThrow({ where: { id: comunicadoB } });
    expect(intacto.titulo).toBe("B");
    expect(await prisma.despesa.count({ where: { id: despesaB } })).toBe(1);
  });

  it("criação força o condomínio do contexto", async () => {
    const db = tenantDb(A);
    const c = await db.comunicado.create({
      data: { condominioId: B, autorId: userId, titulo: "novo", conteudo: "x" } as never,
    });
    expect(c.condominioId).toBe(A);
  });
});
