"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, Home, Megaphone, User, Users, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-items";

const ICONES: Record<string, LucideIcon> = {
  home: Home,
  megaphone: Megaphone,
  calendar: CalendarDays,
  file: FileText,
  wallet: Wallet,
  users: Users,
  user: User,
};

function Contador({ n, className }: { n?: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={cn("min-w-5 rounded-full bg-destructive px-1.5 text-center text-[11px] font-semibold leading-5 text-white", className)}>
      {n > 99 ? "99+" : n}
      <span className="sr-only"> pendente(s)</span>
    </span>
  );
}

function ativo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ itens }: { itens: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-1">
      {itens.map((item) => {
        const Icone = ICONES[item.icon];
        const on = ativo(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icone className="size-5" aria-hidden />
            {item.label}
            <Contador n={item.contador} className="ml-auto" />
          </Link>
        );
      })}
    </nav>
  );
}

/** Tab bar do celular: os 5 primeiros itens (perfil e moradores ficam no cabeçalho). */
export function BottomNav({ itens }: { itens: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Menu principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {itens.slice(0, 5).map((item) => {
          const Icone = ICONES[item.icon];
          const on = ativo(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  on ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icone className="size-5" aria-hidden />
                  <Contador n={item.contador} className="absolute -right-3 -top-2" />
                </span>
                {item.curto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
