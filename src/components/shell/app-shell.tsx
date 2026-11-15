import Link from "next/link";
import { LogOut, Shield, User, Users } from "lucide-react";
import { sair } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { BottomNav, SideNav } from "./app-nav";
import type { NavItem } from "./nav-items";

type Props = {
  condominio: string;
  usuario: string;
  papel: string;
  itens: NavItem[];
  podeGerirMoradores: boolean;
  trocarCondominio: boolean;
  /** Master em modo suporte: mostra o atalho de volta para /admin. */
  master?: boolean;
  children: React.ReactNode;
};

export function AppShell({ condominio, usuario, papel, itens, podeGerirMoradores, trocarCondominio, master = false, children }: Props) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-border bg-card p-4 md:flex">
        <Logo />
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="truncate text-sm font-semibold">{condominio}</p>
          <p className="truncate text-xs text-muted-foreground">
            {usuario} · {papel}
          </p>
          {trocarCondominio && !master ? (
            <Link href="/selecionar-condominio" className="text-xs text-primary underline underline-offset-4">
              Trocar condomínio
            </Link>
          ) : null}
          {master ? (
            <Link href="/admin" className="mt-1 flex items-center gap-1 text-xs text-primary underline underline-offset-4">
              <Shield className="size-3" aria-hidden /> Voltar ao Admin Master
            </Link>
          ) : null}
        </div>
        <SideNav itens={itens} />
        <form action={sair} className="mt-auto">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" type="submit">
            <LogOut aria-hidden /> Sair
          </Button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="pt-safe sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-2 backdrop-blur md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{condominio}</p>
            <p className="truncate text-xs text-muted-foreground">{papel}</p>
          </div>
          {master ? (
            <Button asChild variant="ghost" size="icon" aria-label="Voltar ao Admin Master">
              <Link href="/admin">
                <Shield aria-hidden />
              </Link>
            </Button>
          ) : null}
          {podeGerirMoradores ? (
            <Button asChild variant="ghost" size="icon" aria-label="Moradores">
              <Link href="/moradores">
                <Users aria-hidden />
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="icon" aria-label="Perfil">
            <Link href="/perfil">
              <User aria-hidden />
            </Link>
          </Button>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-5 md:pb-10 md:pt-8">{children}</main>
      </div>

      <BottomNav itens={itens} />
    </div>
  );
}
