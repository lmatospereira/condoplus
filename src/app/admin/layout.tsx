import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import { sair } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { requireMaster } from "@/lib/tenant";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireMaster();
  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
          <Link href="/admin">
            <Logo />
          </Link>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Admin Master</span>
          <span className="ml-auto hidden truncate text-sm text-muted-foreground sm:block">{usuario.name}</span>
          <Button asChild variant="ghost" size="icon" aria-label="Minha senha">
            <Link href="/admin/senha">
              <KeyRound aria-hidden />
            </Link>
          </Button>
          <form action={sair}>
            <Button variant="ghost" size="icon" type="submit" aria-label="Sair">
              <LogOut aria-hidden />
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
