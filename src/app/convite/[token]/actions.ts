"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ResultadoAcao } from "@/lib/acao";
import { auth } from "@/lib/auth";
import { ipCliente, permitir } from "@/lib/rate-limit";
import { cadastroConviteSchema } from "@/lib/schemas/moradores";
import { executar, validar } from "@/server/executar";
import { cadastrarPorConvite } from "@/server/moradores";

export async function cadastrarAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  const token = String(fd.get("token") ?? "");
  if (!(await permitir(`convite:${await ipCliente()}`, 10, 600))) {
    return { ok: false, erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }
  const conta: { email?: string; senha?: string } = {};
  const r = await executar(async () => {
    const input = validar(cadastroConviteSchema, fd);
    await cadastrarPorConvite(token, input);
    conta.email = input.email;
    conta.senha = input.senha;
    return { ok: true };
  });
  if (!r.ok || !conta.email || !conta.senha) return r;

  const { email, senha } = conta;
  try {
    await auth.api.signInEmail({ body: { email, password: senha }, headers: await headers() });
  } catch {
    redirect("/login?cadastro=ok");
  }
  redirect("/aguardando");
}
