import Link from "next/link";
import { Logo, SLOGAN } from "@/components/logo";
import { Button } from "@/components/ui/button";

type UsuarioSite = { isMaster?: boolean | null } | null;

export function SiteHeader({ usuario }: { usuario: UsuarioSite }) {
  const destinoApp = usuario?.isMaster ? "/admin" : "/inicio";
  return (
    <header className="pt-safe border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="Zelora — página inicial">
          <Logo />
        </Link>
        {usuario ? (
          <Button asChild size="sm">
            <Link href={destinoApp}>Abrir o app</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="pb-safe border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Logo reduzida className="opacity-80" />
        <p>
          Zelora — {SLOGAN} ·{" "}
          <Link href="/contato" className="underline underline-offset-4">
            Contato
          </Link>{" "}
          ·{" "}
          <Link href="/termos" className="underline underline-offset-4">
            Termos e privacidade
          </Link>
        </p>
      </div>
    </footer>
  );
}
