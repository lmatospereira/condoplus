"use server";

import { APIError } from "better-auth/api";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { COOKIE_CONDOMINIO } from "@/lib/tenant";

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
  senha: z.string().min(1, "Informe a senha"),
  next: z.string().optional(),
});

export type LoginState = { erro?: string; email?: string };

export async function entrar(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message, email: String(formData.get("email") ?? "") };
  }
  const { email, senha, next } = parsed.data;

  try {
    await auth.api.signInEmail({ body: { email, password: senha }, headers: await headers() });
  } catch (e) {
    if (e instanceof APIError && e.status === "TOO_MANY_REQUESTS") {
      return { erro: "Muitas tentativas. Aguarde um minuto e tente novamente.", email };
    }
    return { erro: "E-mail ou senha incorretos.", email };
  }

  // Só aceita caminhos internos para evitar open redirect.
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(destino);
}

export async function sair() {
  await auth.api.signOut({ headers: await headers() });
  (await cookies()).delete(COOKIE_CONDOMINIO);
  redirect("/login");
}
