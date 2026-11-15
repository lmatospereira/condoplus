"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultadoAcao } from "@/lib/acao";
import { dataISO } from "@/lib/datas";
import { novaReservaSchema } from "@/lib/schemas/reservas";
import { requireTenant } from "@/lib/tenant";
import { executar, validar } from "@/server/executar";
import { criarReserva, excluirReserva } from "@/server/reservas";

export async function criarReservaAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  const destino: { url?: string } = {};
  const r = await executar(async () => {
    const input = validar(novaReservaSchema, fd);
    const reserva = await criarReserva(ator, condominio.id, input);
    const iso = dataISO(reserva.data);
    destino.url = `/reservas?espaco=${reserva.espacoId}&mes=${iso.slice(0, 7)}&reservado=${iso}`;
    return { ok: true };
  });
  if (r.ok && destino.url) {
    revalidatePath("/reservas");
    revalidatePath("/");
    redirect(destino.url);
  }
  return r;
}

export async function excluirReservaAction(reservaId: string): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  return executar(async () => {
    await excluirReserva(ator, condominio.id, reservaId);
    revalidatePath("/reservas");
    revalidatePath("/");
    return { ok: true, mensagem: "Reserva excluída." };
  });
}
