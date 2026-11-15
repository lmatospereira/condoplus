import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsuario } from "@/lib/tenant";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getUsuario()) redirect("/");
  const { next } = await searchParams;

  return (
    <main className="pt-safe mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <Logo className="self-center text-xl" />
      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
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
