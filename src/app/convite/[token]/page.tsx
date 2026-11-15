import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { abrirConvite } from "@/server/moradores";
import { CadastroForm } from "./cadastro-form";

export const metadata: Metadata = { title: "Cadastro de morador", robots: { index: false } };

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const convite = await abrirConvite(token);

  return (
    <main className="pt-safe mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Logo className="self-center text-xl" />
      {convite ? (
        <Card>
          <CardHeader>
            <CardTitle>{convite.condominio.nome}</CardTitle>
            <CardDescription>
              {convite.condominio.cidade}/{convite.condominio.uf} · Cadastro de morador. Depois de enviar, o síndico aprova o seu acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CadastroForm token={token} unidades={convite.unidades} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Este link de convite expirou ou foi revogado. Peça um novo ao síndico do condomínio.</CardDescription>
          </CardHeader>
        </Card>
      )}
      <p className="text-center text-sm text-muted-foreground">
        Já tem cadastro aprovado?{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </main>
  );
}
