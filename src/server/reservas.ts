import "server-only";
import { registrarAuditoria } from "@/lib/auditoria";
import { dataISO, formatarData, hojeSP } from "@/lib/datas";
import { prisma } from "@/lib/db";
import { ehViolacaoUnica, ErroNegocio } from "@/lib/erros";
import { assertCan, can, type Ator } from "@/lib/permissions";
import { tenantDb } from "@/lib/tenant-db";

/** Valor fixo de `periodo` no modo dia inteiro (NOT NULL — ver DECISOES.md). */
export const DIA_INTEIRO = "DIA_INTEIRO";

const DIA_MS = 86400e3;

function diasEntre(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / DIA_MS);
}

/** Primeiro dia do mês e primeiro dia do mês seguinte (datas UTC à meia-noite). */
export function limitesDoMes(ano: number, mes: number) {
  return { inicio: new Date(Date.UTC(ano, mes - 1, 1)), fim: new Date(Date.UTC(ano, mes, 1)) };
}

export function periodosDoEspaco(espaco: { modo: "DIA_INTEIRO" | "PERIODOS"; periodos: string[] }) {
  return espaco.modo === "DIA_INTEIRO" ? [DIA_INTEIRO] : espaco.periodos;
}

export type NovaReserva = { espacoId: string; data: Date; periodo: string; unidadeId: string };

/**
 * Cria uma reserva confirmada na hora (sem descrição, sem aprovação).
 * Regras: data não passada (fuso SP), dia não bloqueado, período válido,
 * antecedência e limite mensal (o síndico pode ignorar estes dois).
 * Conflito garantido pelo índice único parcial; P2002 vira mensagem amigável.
 */
export async function criarReserva(ator: Ator, condominioId: string, input: NovaReserva) {
  assertCan(ator, "reserva.criar", { unidadeId: input.unidadeId });
  const db = tenantDb(condominioId);

  const [espaco, unidade] = await Promise.all([
    db.espaco.findFirst({ where: { id: input.espacoId, ativo: true } }),
    db.unidade.findFirst({ where: { id: input.unidadeId, ativo: true } }),
  ]);
  if (!espaco) throw new ErroNegocio("Espaço indisponível.");
  if (!unidade) throw new ErroNegocio("Casa inválida.");

  const periodo = espaco.modo === "DIA_INTEIRO" ? DIA_INTEIRO : input.periodo;
  if (!periodosDoEspaco(espaco).includes(periodo)) throw new ErroNegocio("Período inválido para este espaço.");

  const hoje = hojeSP();
  if (input.data < hoje) throw new ErroNegocio("Não é possível reservar datas passadas.");
  if (espaco.diasBloqueados.some((d) => d.getTime() === input.data.getTime())) {
    throw new ErroNegocio("Este dia está bloqueado para reservas.");
  }

  if (!ator.sindico) {
    const antecedencia = diasEntre(hoje, input.data);
    if (espaco.antecedenciaMinDias !== null && antecedencia < espaco.antecedenciaMinDias) {
      throw new ErroNegocio(`Reserve com pelo menos ${espaco.antecedenciaMinDias} dia(s) de antecedência.`);
    }
    if (espaco.antecedenciaMaxDias !== null && antecedencia > espaco.antecedenciaMaxDias) {
      throw new ErroNegocio(`Só é possível reservar com até ${espaco.antecedenciaMaxDias} dias de antecedência.`);
    }
    if (espaco.limiteMensalPorUnidade !== null) {
      const { inicio, fim } = limitesDoMes(input.data.getUTCFullYear(), input.data.getUTCMonth() + 1);
      const noMes = await db.reserva.count({
        where: { espacoId: espaco.id, unidadeId: unidade.id, excluidoEm: null, data: { gte: inicio, lt: fim } },
      });
      if (noMes >= espaco.limiteMensalPorUnidade) {
        throw new ErroNegocio(`Limite de ${espaco.limiteMensalPorUnidade} reserva(s) por mês para a sua casa neste espaço.`);
      }
    }
  }

  try {
    const r = await db.reserva.create({
      data: { condominioId, espacoId: espaco.id, unidadeId: unidade.id, data: input.data, periodo, criadoPorId: ator.userId },
    });
    await registrarAuditoria(prisma, {
      condominioId,
      userId: ator.userId,
      acao: "reserva.criar",
      entidade: "Reserva",
      entidadeId: r.id,
      dados: { nome: espaco.nome, data: dataISO(r.data), periodo, casa: unidade.identificador },
    });
    return r;
  } catch (e) {
    if (ehViolacaoUnica(e)) {
      throw new ErroNegocio(
        `${espaco.nome} já está reservado em ${formatarData(input.data)}${periodo === DIA_INTEIRO ? "" : ` (${periodo})`}.`,
      );
    }
    throw e;
  }
}

/** Exclusão lógica, com registro de quem excluiu. Morador: só as próprias e futuras. */
export async function excluirReserva(ator: Ator, condominioId: string, reservaId: string) {
  const db = tenantDb(condominioId);
  const r = await db.reserva.findFirst({
    where: { id: reservaId, excluidoEm: null },
    include: { espaco: { select: { nome: true } }, unidade: { select: { identificador: true } } },
  });
  if (!r) throw new ErroNegocio("Reserva não encontrada.");
  const passada = r.data < hojeSP();
  if (!can(ator, "reserva.excluir", { criadoPorId: r.criadoPorId, passada })) {
    throw new ErroNegocio(passada ? "Reservas de datas passadas não podem ser excluídas." : "Você só pode excluir as reservas que você criou.");
  }
  await db.reserva.update({ where: { id: r.id }, data: { excluidoEm: new Date(), excluidoPorId: ator.userId } });
  await registrarAuditoria(prisma, {
    condominioId,
    userId: ator.userId,
    acao: "reserva.excluir",
    entidade: "Reserva",
    entidadeId: r.id,
    dados: { nome: r.espaco.nome, data: dataISO(r.data), periodo: r.periodo, casa: r.unidade.identificador },
  });
}

/** Reservas ativas de um espaço num mês (calendário visível a todo o condomínio). */
export async function reservasDoMes(condominioId: string, espacoId: string, ano: number, mes: number) {
  const { inicio, fim } = limitesDoMes(ano, mes);
  return tenantDb(condominioId).reserva.findMany({
    where: { espacoId, excluidoEm: null, data: { gte: inicio, lt: fim } },
    orderBy: [{ data: "asc" }, { periodo: "asc" }],
    select: { id: true, data: true, periodo: true, criadoPorId: true, unidade: { select: { identificador: true } } },
  });
}

/** Próximas reservas ativas (das casas do morador, ou todas para o síndico). */
export async function proximasReservas(ator: Ator, condominioId: string, { todas = false, limite = 50 } = {}) {
  return tenantDb(condominioId).reserva.findMany({
    where: {
      excluidoEm: null,
      data: { gte: hojeSP() },
      ...(todas && (ator.sindico || ator.isMaster) ? {} : { unidadeId: { in: ator.unidadeIds } }),
    },
    orderBy: [{ data: "asc" }, { periodo: "asc" }],
    take: limite,
    select: {
      id: true,
      data: true,
      periodo: true,
      criadoPorId: true,
      espaco: { select: { nome: true } },
      unidade: { select: { identificador: true } },
    },
  });
}
