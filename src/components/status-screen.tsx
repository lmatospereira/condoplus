import Link from "next/link";
import { sair } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function StatusScreen({ titulo, texto, children }: { titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <Logo className="text-xl" />
      <h1 className="text-xl font-semibold">{titulo}</h1>
      <p className="text-sm text-muted-foreground">{texto}</p>
      {children}
      <form action={sair}>
        <Button variant="ghost" type="submit">
          Sair
        </Button>
      </form>
      <Link href="/termos" className="text-xs text-muted-foreground underline underline-offset-4">
        Termos de uso e privacidade
      </Link>
    </main>
  );
}
