import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsuario } from "@/lib/tenant";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; perfil?: string; cadastro?: string }> }) {
  const u = await getUsuario();
  if (u) redirect(u.isMaster ? "/admin" : "/inicio");
  const { next, perfil, cadastro } = await searchParams;
  const titulo = perfil === "sindico" ? "Acesso do síndico" : perfil === "morador" ? "Acesso do morador" : "Entrar";

  return (
    <main className="pt-safe mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="self-center" aria-label="Zelora — página inicial">
        <Logo />
      </Link>
      {cadastro === "ok" ? (
        <p role="status" className="rounded-md border border-success/40 bg-success/5 p-3 text-sm">
          Cadastro enviado! Entre com o e-mail e a senha que você escolheu para acompanhar a aprovação.
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>Acesse com o e-mail e a senha cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={next} />
        </CardContent>
      </Card>
      <p className="text-center text-sm text-muted-foreground">
        Para se cadastrar, peça o link de convite ao síndico do seu condomínio.
      </p>
      <Link href="/termos" className="text-center text-xs text-muted-foreground underline underline-offset-4">
        Termos de uso e privacidade
      </Link>
    </main>
  );
}
