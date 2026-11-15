import "server-only";
import type { CategoriaComunicado } from "@/generated/prisma/enums";
import { registrarAuditoria } from "@/lib/auditoria";
import { prisma } from "@/lib/db";
import { ErroNegocio } from "@/lib/erros";
import { assertCan, type Ator } from "@/lib/permissions";
import { tenantDb } from "@/lib/tenant-db";

export const CATEGORIAS_COMUNICADO: Record<CategoriaComunicado, string> = {
  GERAL: "Geral",
  MANUTENCAO: "Manutenção",
  ASSEMBLEIA: "Assembleia",
  SEGURANCA: "Segurança",
  EVENTOS: "Eventos",
};

export type ComunicadoInput = {
  titulo: string;
  conteudo: string;
  categoria: CategoriaComunicado;
  importante: boolean;
  fixado: boolean;
};

/** Lista com fixados primeiro e indicador de não lido para o usuário. */
export async function listarComunicados(
  ator: Ator,
  condominioId: string,
  filtro: { q?: string; categoria?: CategoriaComunicado } = {},
) {
  assertCan(ator, "comunicado.ler");
  const q = filtro.q?.trim();
  const itens = await tenantDb(condominioId).comunicado.findMany({
    where: {
      ...(filtro.categoria ? { categoria: filtro.categoria } : {}),
      ...(q ? { OR: [{ titulo: { contains: q, mode: "insensitive" } }, { conteudo: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: [{ fixado: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      titulo: true,
      conteudo: true,
      categoria: true,
      importante: true,
      fixado: true,
      createdAt: true,
      leituras: { where: { userId: ator.userId }, select: { lidoEm: true } },
    },
  });
  return itens.map(({ leituras, ...c }) => ({ ...c, lido: leituras.length > 0 }));
}

export async function contarNaoLidos(ator: Ator, condominioId: string) {
  return tenantDb(condominioId).comunicado.count({ where: { leituras: { none: { userId: ator.userId } } } });
}

/** Abre o comunicado e registra a leitura do usuário (uma vez). */
export async function abrirComunicado(ator: Ator, condominioId: string, id: string) {
  assertCan(ator, "comunicado.ler");
  const c = await tenantDb(condominioId).comunicado.findUnique({
    where: { id },
    include: { autor: { select: { name: true } } },
  });
  if (!c) return null;
  await prisma.comunicadoLeitura.upsert({
    where: { comunicadoId_userId: { comunicadoId: c.id, userId: ator.userId } },
    create: { comunicadoId: c.id, userId: ator.userId },
    update: {},
  });
  return c;
}

/** Quantas casas (com morador ativo) têm ao menos um morador que leu. Só para o síndico/master. */
export async function leituraPorCasas(condominioId: string, comunicadoIds: string[]) {
  const vinculos = await prisma.vinculo.findMany({
    where: { condominioId, papel: "MORADOR", status: "ATIVO", unidadeId: { not: null } },
    select: { userId: true, unidadeId: true },
  });
  const totalCasas = new Set(vinculos.map((v) => v.unidadeId)).size;
  const casaDo = new Map<string, Set<string>>();
  for (const v of vinculos) casaDo.set(v.userId, (casaDo.get(v.userId) ?? new Set()).add(v.unidadeId!));

  const leituras = await prisma.comunicadoLeitura.findMany({
    where: { comunicadoId: { in: comunicadoIds }, userId: { in: [...casaDo.keys()] } },
    select: { comunicadoId: true, userId: true },
  });
  const resultado = new Map<string, number>(comunicadoIds.map((id) => [id, 0]));
  const casasPorComunicado = new Map<string, Set<string>>();
  for (const l of leituras) {
    const s = casasPorComunicado.get(l.comunicadoId) ?? new Set();
    for (const u of casaDo.get(l.userId) ?? []) s.add(u);
    casasPorComunicado.set(l.comunicadoId, s);
  }
  for (const [id, s] of casasPorComunicado) resultado.set(id, s.size);
  return { totalCasas, casasLeram: resultado };
}

export async function criarComunicado(ator: Ator, condominioId: string, input: ComunicadoInput) {
  assertCan(ator, "comunicado.gerenciar");
  const c = await tenantDb(condominioId).comunicado.create({ data: { ...input, condominioId, autorId: ator.userId } });
  // Quem publica já "leu".
  await prisma.comunicadoLeitura.create({ data: { comunicadoId: c.id, userId: ator.userId } });
  await registrarAuditoria(prisma, { condominioId, userId: ator.userId, acao: "comunicado.criar", entidade: "Comunicado", entidadeId: c.id, dados: { nome: c.titulo } });
  return c;
}

export async function editarComunicado(ator: Ator, condominioId: string, id: string, input: ComunicadoInput) {
  assertCan(ator, "comunicado.gerenciar");
  const db = tenantDb(condominioId);
  if (!(await db.comunicado.findUnique({ where: { id }, select: { id: true } }))) throw new ErroNegocio("Comunicado não encontrado.");
  const c = await db.comunicado.update({ where: { id }, data: input });
  await registrarAuditoria(prisma, { condominioId, userId: ator.userId, acao: "comunicado.editar", entidade: "Comunicado", entidadeId: id, dados: { nome: c.titulo } });
  return c;
}

export async function excluirComunicado(ator: Ator, condominioId: string, id: string) {
  assertCan(ator, "comunicado.gerenciar");
  const db = tenantDb(condominioId);
  const c = await db.comunicado.findUnique({ where: { id }, select: { titulo: true } });
  if (!c) throw new ErroNegocio("Comunicado não encontrado.");
  await db.comunicado.delete({ where: { id } });
  await registrarAuditoria(prisma, { condominioId, userId: ator.userId, acao: "comunicado.excluir", entidade: "Comunicado", entidadeId: id, dados: { nome: c.titulo } });
}
