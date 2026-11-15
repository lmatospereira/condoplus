import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { registrarAuditoria } from "@/lib/auditoria";
import { hojeSP } from "@/lib/datas";
import { prisma } from "@/lib/db";
import { ErroNegocio } from "@/lib/erros";
import { assertCan, type Ator } from "@/lib/permissions";
import { definirSenha } from "@/lib/senha";
import { tenantDb } from "@/lib/tenant-db";

/**
 * Convites, cadastro de moradores, aprovação, transferência e mudança de casa
 * (seções 5.3 e 5.4). Toda decisão de permissão acontece aqui, no servidor.
 */

export type Situacao = "titular" | "comorador" | "transferencia";

// ---------------------------------------------------------------------------
// Convite
// ---------------------------------------------------------------------------

/** Gera um novo link (o anterior é revogado: há no máximo um convite ativo). */
export async function gerarConvite(ator: Ator, condominioId: string, validadeDias: number | null) {
  assertCan(ator, "convite.gerenciar");
  const token = randomBytes(24).toString("base64url");
  const expiraEm = validadeDias ? new Date(Date.now() + validadeDias * 86400e3) : null;
  return prisma.$transaction(async (tx) => {
    await tx.convite.updateMany({ where: { condominioId, revogadoEm: null }, data: { revogadoEm: new Date() } });
    const c = await tx.convite.create({ data: { condominioId, token, criadoPorId: ator.userId, expiraEm } });
    await registrarAuditoria(tx, { condominioId, userId: ator.userId, acao: "convite.gerar", entidade: "Convite", entidadeId: c.id, dados: { validadeDias } });
    return c;
  });
}

export async function revogarConvite(ator: Ator, condominioId: string) {
  assertCan(ator, "convite.gerenciar");
  const r = await prisma.convite.updateMany({ where: { condominioId, revogadoEm: null }, data: { revogadoEm: new Date() } });
  if (r.count === 0) throw new ErroNegocio("Não há link de convite ativo.");
  await registrarAuditoria(prisma, { condominioId, userId: ator.userId, acao: "convite.revogar", entidade: "Convite" });
}

export async function conviteAtivo(condominioId: string) {
  return prisma.convite.findFirst({
    where: { condominioId, revogadoEm: null, OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }] },
    orderBy: { createdAt: "desc" },
  });
}

/** Dados públicos do convite (para a página /convite/[token]), ou null se inválido. */
export async function abrirConvite(token: string) {
  const convite = await prisma.convite.findUnique({
    where: { token },
    include: { condominio: { select: { id: true, nome: true, cidade: true, uf: true, ativo: true } } },
  });
  if (!convite || convite.revogadoEm || (convite.expiraEm && convite.expiraEm < new Date()) || !convite.condominio.ativo) return null;

  const unidades = await tenantDb(convite.condominioId).unidade.findMany({
    where: { ativo: true },
    orderBy: { identificador: "asc" },
    select: {
      id: true,
      identificador: true,
      _count: { select: { vinculos: { where: { papel: "MORADOR", tipo: "TITULAR", status: "ATIVO" } } } },
    },
  });
  return {
    condominio: convite.condominio,
    // Não expõe quem mora em cada casa: só se já há titular (para perguntar a situação).
    unidades: unidades.map((u) => ({ id: u.id, identificador: u.identificador, temTitular: u._count.vinculos > 0 })),
  };
}

// ---------------------------------------------------------------------------
// Cadastro pelo link
// ---------------------------------------------------------------------------

export type CadastroInput = {
  nome: string;
  email: string;
  telefone: string | null;
  senha: string;
  unidadeId: string;
  situacao: Situacao;
};

/** Tipo e flag de transferência a partir da situação escolhida e da casa. */
async function resolverTipo(condominioId: string, unidadeId: string, situacao: Situacao) {
  const db = tenantDb(condominioId);
  const unidade = await db.unidade.findFirst({ where: { id: unidadeId, ativo: true } });
  if (!unidade) throw new ErroNegocio("Casa inválida.");
  const temTitular = (await db.vinculo.count({ where: { unidadeId, papel: "MORADOR", tipo: "TITULAR", status: "ATIVO" } })) > 0;

  if (!temTitular) return { tipo: "TITULAR" as const, ehTransferencia: false, unidade };
  if (situacao === "comorador") return { tipo: "COMORADOR" as const, ehTransferencia: false, unidade };
  if (situacao === "transferencia") return { tipo: "TITULAR" as const, ehTransferencia: true, unidade };
  throw new ErroNegocio("Esta casa já tem titular. Informe se vai morar junto ou se a casa mudou de morador.");
}

/**
 * Cria a solicitação PENDENTE. Conta nova: define a senha escolhida pelo morador.
 * E-mail já cadastrado: exige a senha dessa conta (impede pedir vínculo em nome de outra pessoa).
 */
export async function cadastrarPorConvite(token: string, input: CadastroInput) {
  const convite = await abrirConvite(token);
  if (!convite) throw new ErroNegocio("Este link de convite não é mais válido. Peça um novo ao síndico.");
  const condominioId = convite.condominio.id;
  const { tipo, ehTransferencia } = await resolverTipo(condominioId, input.unidadeId, input.situacao);

  const existente = await prisma.user.findUnique({ where: { email: input.email }, include: { accounts: { where: { providerId: "credential" } } } });
  if (existente) {
    const hash = existente.accounts[0]?.password;
    if (!existente.ativo || !hash || !(await verifyPassword({ hash, password: input.senha }))) {
      throw new ErroNegocio("Já existe uma conta com este e-mail. Informe a senha dessa conta para pedir o vínculo.");
    }
    if (existente.isMaster) throw new ErroNegocio("Esta conta não pode ser vinculada como morador.");
    const jaTem = await prisma.vinculo.count({
      where: { userId: existente.id, condominioId, papel: "MORADOR", status: { in: ["PENDENTE", "ATIVO"] } },
    });
    if (jaTem > 0) {
      throw new ErroNegocio("Você já tem um cadastro neste condomínio. Para mudar de casa, use o seu Perfil.");
    }
  }

  return prisma.$transaction(async (tx) => {
    let userId = existente?.id;
    if (!userId) {
      userId = randomUUID();
      await tx.user.create({ data: { id: userId, name: input.nome, email: input.email, telefone: input.telefone, emailVerified: false } });
      await definirSenha(tx, userId, input.senha, { provisoria: false, encerrarSessoes: false });
    }
    const v = await tx.vinculo.create({
      data: { userId, condominioId, unidadeId: input.unidadeId, papel: "MORADOR", tipo, ehTransferencia, status: "PENDENTE" },
    });
    return { vinculoId: v.id, userId, contaNova: !existente };
  });
}

/** Morador ativo pede para mudar de casa no mesmo condomínio (mesmo fluxo de aprovação). */
export async function pedirMudancaDeCasa(ator: Ator, condominioId: string, input: { unidadeId: string; situacao: Situacao }) {
  const atual = await prisma.vinculo.findFirst({
    where: { userId: ator.userId, condominioId, papel: "MORADOR", status: "ATIVO" },
  });
  if (!atual) throw new ErroNegocio("Só moradores ativos podem pedir mudança de casa.");
  if (atual.unidadeId === input.unidadeId) throw new ErroNegocio("Você já mora nesta casa.");
  const pendente = await prisma.vinculo.count({ where: { userId: ator.userId, condominioId, papel: "MORADOR", status: "PENDENTE" } });
  if (pendente > 0) throw new ErroNegocio("Você já tem uma solicitação aguardando o síndico.");

  const { tipo, ehTransferencia } = await resolverTipo(condominioId, input.unidadeId, input.situacao);
  return prisma.vinculo.create({
    data: {
      userId: ator.userId,
      condominioId,
      unidadeId: input.unidadeId,
      papel: "MORADOR",
      tipo,
      ehTransferencia,
      status: "PENDENTE",
      substituiVinculoId: atual.id,
    },
  });
}

// ---------------------------------------------------------------------------
// Aprovação
// ---------------------------------------------------------------------------

async function pendente(condominioId: string, vinculoId: string) {
  const v = await tenantDb(condominioId).vinculo.findFirst({
    where: { id: vinculoId, papel: "MORADOR", status: "PENDENTE" },
    include: { user: { select: { name: true, email: true } }, unidade: { select: { identificador: true } } },
  });
  if (!v) throw new ErroNegocio("Solicitação não encontrada ou já analisada.");
  return v;
}

export type ResultadoAprovacao = {
  /** Reservas futuras de moradores desativados pela transferência (o síndico decide). */
  reservasDeExMoradores: number;
};

export async function aprovarVinculo(ator: Ator, condominioId: string, vinculoId: string): Promise<ResultadoAprovacao> {
  const v = await pendente(condominioId, vinculoId);
  assertCan(ator, v.ehTransferencia ? "transferencia.aprovar" : "morador.aprovar");

  return prisma.$transaction(async (tx) => {
    const agora = new Date();
    const desativados: string[] = [];

    if (v.ehTransferencia) {
      // A casa mudou de morador: todos os vínculos ativos dela são desativados (não excluídos).
      const antigos = await tx.vinculo.findMany({
        where: { condominioId, unidadeId: v.unidadeId, papel: "MORADOR", status: "ATIVO" },
        select: { id: true, userId: true },
      });
      await tx.vinculo.updateMany({ where: { id: { in: antigos.map((a) => a.id) } }, data: { status: "INATIVO", desativadoEm: agora } });
      desativados.push(...antigos.map((a) => a.userId));
    } else if (v.tipo === "TITULAR") {
      const titular = await tx.vinculo.count({ where: { condominioId, unidadeId: v.unidadeId, papel: "MORADOR", tipo: "TITULAR", status: "ATIVO" } });
      if (titular > 0) throw new ErroNegocio("Esta casa já tem titular ativo. Recuse e peça um novo cadastro como co-morador ou transferência.");
    }

    if (v.substituiVinculoId) {
      await tx.vinculo.updateMany({
        where: { id: v.substituiVinculoId, userId: v.userId, condominioId, status: "ATIVO" },
        data: { status: "INATIVO", desativadoEm: agora },
      });
    }

    await tx.vinculo.update({ where: { id: v.id }, data: { status: "ATIVO", aprovadoPorId: ator.userId, aprovadoEm: agora } });

    await registrarAuditoria(tx, {
      condominioId,
      userId: ator.userId,
      acao: v.substituiVinculoId ? "morador.mudarCasa" : v.ehTransferencia ? "morador.transferir" : "morador.aprovar",
      entidade: "Vinculo",
      entidadeId: v.id,
      dados: { nome: v.user.name, casa: v.unidade?.identificador ?? null, desativados: desativados.length },
    });

    const reservasDeExMoradores = desativados.length
      ? await tx.reserva.count({
          where: { condominioId, excluidoEm: null, data: { gte: hojeSP() }, criadoPorId: { in: desativados }, unidadeId: v.unidadeId! },
        })
      : 0;
    return { reservasDeExMoradores };
  });
}

export async function recusarVinculo(ator: Ator, condominioId: string, vinculoId: string, motivo: string | null) {
  const v = await pendente(condominioId, vinculoId);
  assertCan(ator, v.ehTransferencia ? "transferencia.aprovar" : "morador.aprovar");
  await prisma.$transaction([
    prisma.vinculo.update({ where: { id: v.id }, data: { status: "RECUSADO", motivoRecusa: motivo, aprovadoPorId: ator.userId, aprovadoEm: new Date() } }),
    prisma.auditLog.create({
      data: { condominioId, userId: ator.userId, acao: "morador.recusar", entidade: "Vinculo", entidadeId: v.id, dados: { nome: v.user.name, casa: v.unidade?.identificador ?? null, motivo } },
    }),
  ]);
}

export async function desativarMorador(ator: Ator, condominioId: string, vinculoId: string) {
  assertCan(ator, "morador.desativar");
  const v = await tenantDb(condominioId).vinculo.findFirst({
    where: { id: vinculoId, papel: "MORADOR", status: "ATIVO" },
    include: { user: { select: { name: true } }, unidade: { select: { identificador: true } } },
  });
  if (!v) throw new ErroNegocio("Morador não encontrado.");
  await prisma.$transaction([
    prisma.vinculo.update({ where: { id: v.id }, data: { status: "INATIVO", desativadoEm: new Date() } }),
    prisma.auditLog.create({
      data: { condominioId, userId: ator.userId, acao: "morador.desativar", entidade: "Vinculo", entidadeId: v.id, dados: { nome: v.user.name, casa: v.unidade?.identificador ?? null } },
    }),
  ]);
}

/** Reservas futuras ativas criadas por quem não é mais morador ativo da casa (5.4). */
export async function reservasDeExMoradores(ator: Ator, condominioId: string) {
  assertCan(ator, "morador.aprovar");
  const reservas = await tenantDb(condominioId).reserva.findMany({
    where: { excluidoEm: null, data: { gte: hojeSP() } },
    orderBy: { data: "asc" },
    include: {
      espaco: { select: { nome: true } },
      unidade: { select: { identificador: true } },
      criadoPor: { select: { id: true, name: true, vinculos: { where: { condominioId, status: "ATIVO" }, select: { papel: true, unidadeId: true } } } },
    },
  });
  // Mantém só as criadas por alguém que não é mais morador ativo daquela casa nem síndico.
  return reservas.filter(
    (r) => !r.criadoPor.vinculos.some((v) => v.papel === "SINDICO" || (v.papel === "MORADOR" && v.unidadeId === r.unidadeId)),
  );
}
