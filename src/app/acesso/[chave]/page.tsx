import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { chaveMasterValida } from "@/lib/master-login";
import { getUsuario } from "@/lib/tenant";

export const metadata: Metadata = { title: "Acesso restrito", robots: { index: false, follow: false } };

/** Login escondido do Admin Master. Chave errada = 404 (a rota "não existe"). */
export default async function AcessoMasterPage({ params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  if (!chaveMasterValida(chave)) notFound();
  const u = await getUsuario();
  if (u?.isMaster) redirect("/admin");

  return (
    <main className="pt-safe mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <Logo className="self-center" />
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>Administração da plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm chaveMaster={chave} />
        </CardContent>
      </Card>
    </main>
  );
}
