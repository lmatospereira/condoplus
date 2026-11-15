export type NavItem = { href: string; label: string; curto: string; icon: string };

export function navItems({ podeGerirMoradores }: { podeGerirMoradores: boolean }): NavItem[] {
  const itens: NavItem[] = [
    { href: "/", label: "Início", curto: "Início", icon: "home" },
    { href: "/comunicados", label: "Comunicados", curto: "Avisos", icon: "megaphone" },
    { href: "/reservas", label: "Reservas", curto: "Reservas", icon: "calendar" },
    { href: "/documentos", label: "Documentos", curto: "Docs", icon: "file" },
    { href: "/contas", label: "Prestação de contas", curto: "Contas", icon: "wallet" },
  ];
  if (podeGerirMoradores) itens.push({ href: "/moradores", label: "Moradores", curto: "Moradores", icon: "users" });
  itens.push({ href: "/perfil", label: "Perfil", curto: "Perfil", icon: "user" });
  return itens;
}
