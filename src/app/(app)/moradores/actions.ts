"use server";

import { revalidatePath } from "next/cache";
import type { ResultadoAcao } from "@/lib/acao";
import { conviteSchema, mudancaCasaSchema, recusaSchema } from "@/lib/schemas/moradores";
import { requireTenant } from "@/lib/tenant";
import { executar, validar } from "@/server/executar";
import * as moradores from "@/server/moradores";
import { excluirReserva } from "@/server/reservas";

function atualizar() {
  revalidatePath("/moradores");
  revalidatePath("/", "layout");
}

export async function gerarConviteAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  return executar(async () => {
    await moradores.gerarConvite(ator, condominio.id, validar(conviteSchema, fd).validadeDias);
    atualizar();
    return { ok: true, mensagem: "Novo link gerado. O anterior deixou de funcionar." };
  });
}

export async function revogarConviteAction(): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  return executar(async () => {
    await moradores.revogarConvite(ator, condominio.id);
    atualizar();
    return { ok: true, mensagem: "Link revogado." };
  });
}

export async function aprovarAction(vinculoId: string): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  return executar(async () => {
    const r = await moradores.aprovarVinculo(ator, condominio.id, vinculoId);
    atualizar();
    return {
      ok: true,
      mensagem:
        r.reservasDeExMoradores > 0
          ? `Aprovado. Há ${r.reservasDeExMoradores} reserva(s) futura(s) de ex-moradores para você revisar.`
          : "Cadastro aprovado.",
    };
  });
}

export async function recusarAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  return executar(async () => {
    await moradores.recusarVinculo(ator, condominio.id, String(fd.get("vinculoId")), validar(recusaSchema, fd).motivo);
    atualizar();
    return { ok: true, mensagem: "Cadastro recusado." };
  });
}

export async function desativarAction(vinculoId: string): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  return executar(async () => {
    await moradores.desativarMorador(ator, condominio.id, vinculoId);
    atualizar();
    return { ok: true, mensagem: "Morador desativado." };
  });
}

export async function excluirReservaExMoradorAction(reservaId: string): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  return executar(async () => {
    await excluirReserva(ator, condominio.id, reservaId);
    atualizar();
    return { ok: true, mensagem: "Reserva excluída." };
  });
}

export async function pedirMudancaAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  return executar(async () => {
    await moradores.pedirMudancaDeCasa(ator, condominio.id, validar(mudancaCasaSchema, fd));
    revalidatePath("/perfil");
    return { ok: true, mensagem: "Pedido enviado ao síndico." };
  });
}
