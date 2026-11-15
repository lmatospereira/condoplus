"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { COOKIE_CONDOMINIO, requireUsuario } from "@/lib/tenant";

/** Define o condomínio ativo, validando o vínculo no servidor. */
export async function selecionarCondominio(formData: FormData) {
  const usuario = await requireUsuario();
  const id = String(formData.get("condominioId") ?? "");

  const permitido = usuario.isMaster
    ? await prisma.condominio.count({ where: { id } })
    : await prisma.condominio.count({
        where: { id, ativo: true, vinculos: { some: { userId: usuario.id, status: "ATIVO" } } },
      });
  if (!permitido) redirect("/selecionar-condominio");

  (await cookies()).set(COOKIE_CONDOMINIO, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}
