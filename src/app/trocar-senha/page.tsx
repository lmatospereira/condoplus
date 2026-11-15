import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sair } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { TrocarSenhaForm } from "@/components/trocar-senha-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsuario } from "@/lib/tenant";

export const metadata: Metadata = { title: "Defina sua senha" };

/** Troca obrigatória após senha provisória (definida pelo Admin Master). */
export default async function TrocarSenhaPage() {
  const usuario = await getUsuario();
  if (!usuario) redirect("/login");
  if (!usuario.trocarSenha) redirect(usuario.isMaster ? "/admin" : "/");

  return (
    <main className="pt-safe mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <Logo className="self-center text-xl" />
      <Card>
        <CardHeader>
          <CardTitle>Defina sua senha</CardTitle>
          <CardDescription>
            Olá, {usuario.name.split(" ")[0]}! Você entrou com uma senha provisória. Escolha uma senha nova para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrocarSenhaForm provisoria />
        </CardContent>
      </Card>
      <form action={sair} className="self-center">
        <Button variant="ghost" type="submit">
          Sair
        </Button>
      </form>
    </main>
  );
}
