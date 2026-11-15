"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { novaSenhaSchema } from "@/lib/schemas/admin";
import { getUsuario } from "@/lib/tenant";
import type { ResultadoAcao } from "@/lib/acao";

/** Troca a própria senha (perfil ou troca obrigatória após senha provisória). */
export async function trocarSenha(_prev: ResultadoAcao | null, formData: FormData): Promise<ResultadoAcao> {
  const usuario = await getUsuario();
  if (!usuario) redirect("/login");

  const parsed = novaSenhaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  try {
    await auth.api.changePassword({
      body: { currentPassword: parsed.data.senhaAtual, newPassword: parsed.data.novaSenha, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (e) {
    if (e instanceof APIError && e.status === "TOO_MANY_REQUESTS") return { ok: false, erro: "Muitas tentativas. Aguarde alguns minutos." };
    if (e instanceof APIError && e.status === "BAD_REQUEST") return { ok: false, erro: "Senha atual incorreta." };
    throw e;
  }

  const eraProvisoria = usuario.trocarSenha;
  if (eraProvisoria) await prisma.user.update({ where: { id: usuario.id }, data: { trocarSenha: false } });
  if (eraProvisoria) redirect(usuario.isMaster ? "/admin" : "/inicio");
  return { ok: true, mensagem: "Senha alterada. As outras sessões foram encerradas." };
}
