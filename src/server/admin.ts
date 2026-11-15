import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { registrarAuditoria } from "@/lib/auditoria";
import { dataISO, hojeSP } from "@/lib/datas";
import { prisma } from "@/lib/db";
import { ehViolacaoUnica, ErroNegocio } from "@/lib/erros";
import { assertCan, type Ator } from "@/lib/permissions";
import type {
  adicionarCasasSchema,
  condominioSchema,
  EspacoInput,
  novoCondominioSchema,
} from "@/lib/schemas/admin";
import { definirSenha, gerarSenhaProvisoria } from "@/lib/senha";
import { tenantDb } from "@/lib/tenant-db";

/**
 * Serviços da área do Admin Master (fase 2). Toda função recebe o `ator` já
 * resolvido no servidor e checa a permissão antes de qualquer escrita.
 */

function identificadores(prefixo: string, quantidade: number, inicio = 1) {
  const fim = inicio + quantidade - 1;
  const largura = Math.max(2, String(fim).length);
  const base = prefixo.trim() || "Casa";
  return Array.from({ length: quantidade }, (_, i) => `${base} ${String(inicio + i).padStart(largura, "0")}`);
}

async function exigirCondominio(id: string) {
  const c = await prisma.condominio.findUnique({ where: { id }, select: { id: true } });
  if (!c) throw new ErroNegocio("Condomínio não encontrado.");
  return c;
}

// ---------------------------------------------------------------------------
// Condomínios
// ---------------------------------------------------------------------------

export async function criarCondominio(ator: Ator, input: z.infer<typeof novoCondominioSchema>) {
  assertCan(ator, "condominio.gerenciar");
  const { quantidadeCasas, prefixoCasa, ...dados } = input;
  return prisma.$transaction(async (tx) => {
    const c = await tx.condominio.create({
      data: {
        ...dados,
        unidades: { create: identificadores(prefixoCasa, quantidadeCasas).map((identificador) => ({ identificador })) },
      },
    });
    await registrarAuditoria(tx, {
      condominioId: c.id,
      userId: ator.userId,
      acao: "condominio.criar",
      entidade: "Condominio",
      entidadeId: c.id,
      dados: { nome: c.nome, casas: quantidadeCasas },
    });
    return c;
  });
}

export async function atualizarCondominio(ator: Ator, id: string, input: z.infer<typeof condominioSchema>) {
  assertCan(ator, "condominio.gerenciar");
  await exigirCondominio(id);
  return prisma.$transaction(async (tx) => {
    const c = await tx.condominio.update({ where: { id }, data: input });
    await registrarAuditoria(tx, { condominioId: id, userId: ator.userId, acao: "condominio.editar", entidade: "Condominio", entidadeId: id, dados: input });
    return c;
  });
}

export async function definirCondominioAtivo(ator: Ator, id: string, ativo: boolean) {
  assertCan(ator, "condominio.gerenciar");
  await exigirCondominio(id);
  await prisma.$transaction([
    prisma.condominio.update({ where: { id }, data: { ativo } }),
    prisma.auditLog.create({
      data: { condominioId: id, userId: ator.userId, acao: ativo ? "condominio.ativar" : "condominio.desativar", entidade: "Condominio", entidadeId: id },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Casas (unidades)
// ---------------------------------------------------------------------------

export async function adicionarCasas(ator: Ator, condominioId: string, input: z.infer<typeof adicionarCasasSchema>) {
  assertCan(ator, "unidade.gerenciar");
  await exigirCondominio(condominioId);
  const db = tenantDb(condominioId);

  let novos: string[];
  if (input.modo === "individual") {
    novos = [input.identificador];
  } else {
    // Continua a numeração a partir da maior "<prefixo> NN" existente.
    const existentes = await db.unidade.findMany({ select: { identificador: true } });
    const re = new RegExp(`^${input.prefixo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} (\\d+)$`);
    const maior = Math.max(0, ...existentes.map((u) => Number(re.exec(u.identificador)?.[1] ?? 0)));
    novos = identificadores(input.prefixo, input.quantidade, maior + 1);
  }

  try {
    const r = await db.unidade.createMany({ data: novos.map((identificador) => ({ identificador, condominioId })) });
    await registrarAuditoria(prisma, { condominioId, userId: ator.userId, acao: "unidade.criar", entidade: "Unidade", dados: { identificadores: novos } });
    return r.count;
  } catch (e) {
    if (ehViolacaoUnica(e)) throw new ErroNegocio("Já existe uma casa com esse identificador.");
    throw e;
  }
}

export async function renomearCasa(ator: Ator, condominioId: string, unidadeId: string, identificador: string) {
  assertCan(ator, "unidade.gerenciar");
  const db = tenantDb(condominioId);
  const atual = await db.unidade.findUnique({ where: { id: unidadeId } });
  if (!atual) throw new ErroNegocio("Casa não encontrada.");
  if (atual.identificador === identificador) return;
  try {
    await db.unidade.update({ where: { id: unidadeId }, data: { identificador } });
  } catch (e) {
    if (ehViolacaoUnica(e)) throw new ErroNegocio("Já existe uma casa com esse identificador.");
    throw e;
  }
  await registrarAuditoria(prisma, {
    condominioId,
    userId: ator.userId,
    acao: "unidade.editar",
    entidade: "Unidade",
    entidadeId: unidadeId,
    dados: { de: atual.identificador, para: identificador },
  });
}

export async function definirCasaAtiva(ator: Ator, condominioId: string, unidadeId: string, ativo: boolean) {
  assertCan(ator, "unidade.gerenciar");
  const db = tenantDb(condominioId);
  const r = await db.unidade.updateMany({ where: { id: unidadeId }, data: { ativo } });
  if (r.count === 0) throw new ErroNegocio("Casa não encontrada.");
  await registrarAuditoria(prisma, {
    condominioId,
    userId: ator.userId,
    acao: ativo ? "unidade.ativar" : "unidade.desativar",
    entidade: "Unidade",
    entidadeId: unidadeId,
  });
}

// ---------------------------------------------------------------------------
// Espaços
// ---------------------------------------------------------------------------

export async function salvarEspaco(ator: Ator, condominioId: string, input: EspacoInput, espacoId?: string) {
  assertCan(ator, "espaco.gerenciar");
  await exigirCondominio(condominioId);
  const db = tenantDb(condominioId);

  if (!espacoId) {
    const e = await db.espaco.create({ data: { ...input, condominioId } });
    await registrarAuditoria(prisma, { condominioId, userId: ator.userId, acao: "espaco.criar", entidade: "Espaco", entidadeId: e.id, dados: { nome: e.nome } });
    return e;
  }

  const atual = await db.espaco.findUnique({ where: { id: espacoId } });
  if (!atual) throw new ErroNegocio("Espaço não encontrado.");

  // Seção 6.2: o modo (e os períodos) não podem mudar com reservas futuras ativas,
  // para não misturar "dia inteiro" e períodos no mesmo dia.
  const periodosMudaram =
    atual.modo !== input.modo ||
    atual.periodos.some((p) => !input.periodos.includes(p));
  if (periodosMudaram) {
    const futuras = await db.reserva.findMany({
      where: { espacoId, excluidoEm: null, data: { gte: hojeSP() }, ...(atual.modo === input.modo ? { periodo: { notIn: input.periodos } } : {}) },
      select: { data: true },
      orderBy: { data: "asc" },
      take: 1,
    });
    if (futuras.length > 0) {
      throw new ErroNegocio(
        atual.modo !== input.modo
          ? `Não é possível mudar o modo de reserva: há reservas futuras ativas (a partir de ${dataISO(futuras[0].data).split("-").reverse().join("/")}).`
          : "Não é possível remover um período que tem reservas futuras ativas.",
      );
    }
  }

  const e = await db.espaco.update({ where: { id: espacoId }, data: input });
  await registrarAuditoria(prisma, { condominioId, userId: ator.userId, acao: "espaco.editar", entidade: "Espaco", entidadeId: espacoId, dados: { nome: e.nome } });
  return e;
}

export async function excluirEspaco(ator: Ator, condominioId: string, espacoId: string) {
  assertCan(ator, "espaco.gerenciar");
  const db = tenantDb(condominioId);
  const espaco = await db.espaco.findUnique({ where: { id: espacoId }, select: { nome: true, _count: { select: { reservas: true } } } });
  if (!espaco) throw new ErroNegocio("Espaço não encontrado.");
  if (espaco._count.reservas > 0) {
    throw new ErroNegocio("Este espaço tem histórico de reservas. Desative-o em vez de excluir.");
  }
  await db.espaco.delete({ where: { id: espacoId } });
  await registrarAuditoria(prisma, { condominioId, userId: ator.userId, acao: "espaco.excluir", entidade: "Espaco", entidadeId: espacoId, dados: { nome: espaco.nome } });
}

// ---------------------------------------------------------------------------
// Síndico
// ---------------------------------------------------------------------------

export type ResultadoSindico = {
  nome: string;
  email: string;
  /** Presente só quando a conta foi criada agora: deve ser repassada ao síndico. */
  senhaProvisoria: string | null;
};

/**
 * Define ou troca o síndico (exclusivo do master, seção 4). O síndico anterior
 * perde o papel imediatamente; se tiver vínculo de morador ativo, continua como morador.
 * Sem e-mail: uma conta nova recebe senha provisória, que o master repassa.
 */
export async function definirSindico(ator: Ator, condominioId: string, input: { nome: string; email: string; telefone: string | null }): Promise<ResultadoSindico> {
  assertCan(ator, "sindico.definir");
  await exigirCondominio(condominioId);

  return prisma.$transaction(async (tx) => {
    let usuario = await tx.user.findUnique({ where: { email: input.email } });
    let senhaProvisoria: string | null = null;

    if (usuario?.isMaster) throw new ErroNegocio("O Admin Master não pode ser síndico.");
    if (usuario && !usuario.ativo) throw new ErroNegocio("Esta conta está desativada.");

    if (!usuario) {
      const id = randomUUID();
      usuario = await tx.user.create({
        data: { id, name: input.nome, email: input.email, telefone: input.telefone, emailVerified: true },
      });
      senhaProvisoria = gerarSenhaProvisoria();
      await definirSenha(tx, id, senhaProvisoria, { provisoria: true, encerrarSessoes: false });
    }

    const anterior = await tx.vinculo.findFirst({
      where: { condominioId, papel: "SINDICO", status: "ATIVO" },
      include: { user: { select: { name: true, email: true } } },
    });
    if (anterior?.userId === usuario.id) throw new ErroNegocio("Esta pessoa já é o síndico atual.");

    if (anterior) {
      await tx.vinculo.update({ where: { id: anterior.id }, data: { status: "INATIVO", desativadoEm: new Date() } });
    }
    await tx.vinculo.create({
      data: { userId: usuario.id, condominioId, papel: "SINDICO", status: "ATIVO", aprovadoPorId: ator.userId, aprovadoEm: new Date() },
    });

    await registrarAuditoria(tx, {
      condominioId,
      userId: ator.userId,
      acao: anterior ? "sindico.trocar" : "sindico.definir",
      entidade: "Vinculo",
      entidadeId: usuario.id,
      dados: {
        novo: { nome: usuario.name, email: usuario.email, contaNova: senhaProvisoria !== null },
        ...(anterior ? { anterior: { nome: anterior.user.name, email: anterior.user.email } } : {}),
      },
    });

    return { nome: usuario.name, email: usuario.email, senhaProvisoria };
  });
}

/** Tira o papel de síndico sem nomear outro (o condomínio fica sem síndico). */
export async function removerSindico(ator: Ator, condominioId: string) {
  assertCan(ator, "sindico.definir");
  const atual = await prisma.vinculo.findFirst({
    where: { condominioId, papel: "SINDICO", status: "ATIVO" },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!atual) throw new ErroNegocio("O condomínio não tem síndico ativo.");
  await prisma.$transaction([
    prisma.vinculo.update({ where: { id: atual.id }, data: { status: "INATIVO", desativadoEm: new Date() } }),
    prisma.auditLog.create({
      data: { condominioId, userId: ator.userId, acao: "sindico.remover", entidade: "Vinculo", entidadeId: atual.userId, dados: { nome: atual.user.name, email: atual.user.email } },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Senhas (sem e-mail: o master redefine e repassa)
// ---------------------------------------------------------------------------

/**
 * Gera uma senha provisória nova para um usuário de um condomínio, derruba as
 * sessões dele e obriga a troca no próximo acesso. Exclusivo do master.
 */
export async function redefinirSenhaUsuario(ator: Ator, condominioId: string, userId: string) {
  assertCan(ator, "sindico.definir");
  if (userId === ator.userId) throw new ErroNegocio("Para trocar a sua própria senha, use o Perfil.");

  const usuario = await prisma.user.findFirst({
    where: { id: userId, isMaster: false, vinculos: { some: { condominioId } } },
    select: { id: true, name: true, email: true },
  });
  if (!usuario) throw new ErroNegocio("Usuário não encontrado neste condomínio.");

  const senha = gerarSenhaProvisoria();
  await prisma.$transaction(async (tx) => {
    await definirSenha(tx, usuario.id, senha, { provisoria: true, encerrarSessoes: true });
    await registrarAuditoria(tx, {
      condominioId,
      userId: ator.userId,
      acao: "usuario.redefinirSenha",
      entidade: "User",
      entidadeId: usuario.id,
      dados: { nome: usuario.name, email: usuario.email },
    });
  });
  return { nome: usuario.name, email: usuario.email, senhaProvisoria: senha };
}

/** Ator do Admin Master (a área /admin não depende de condomínio ativo). */
export function atorMaster(userId: string): Ator {
  return { userId, isMaster: true, sindico: false, unidadeIds: [] };
}
