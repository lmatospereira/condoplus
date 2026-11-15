"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ResultadoAcao } from "@/lib/acao";
import { comunicadoSchema } from "@/lib/schemas/comunicados";
import { requireTenant } from "@/lib/tenant";
import { criarComunicado, editarComunicado, excluirComunicado } from "@/server/comunicados";
import { executar, validar } from "@/server/executar";

function atualizar() {
  revalidatePath("/comunicados");
  revalidatePath("/", "layout");
}

export async function salvarComunicadoAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  const destino: { id?: string } = {};
  const r = await executar(async () => {
    const input = validar(comunicadoSchema, fd);
    const id = fd.get("id") ? String(fd.get("id")) : null;
    destino.id = id ? (await editarComunicado(ator, condominio.id, id, input)).id : (await criarComunicado(ator, condominio.id, input)).id;
    return { ok: true };
  });
  if (r.ok && destino.id) {
    atualizar();
    redirect(`/comunicados/${destino.id}`);
  }
  return r;
}

export async function excluirComunicadoAction(id: string): Promise<ResultadoAcao> {
  const { ator, condominio } = await requireTenant();
  const r = await executar(async () => {
    await excluirComunicado(ator, condominio.id, id);
    return { ok: true };
  });
  if (r.ok) {
    atualizar();
    redirect("/comunicados");
  }
  return r;
}
