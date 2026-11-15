export type NavItem = { href: string; label: string; curto: string; icon: string; contador?: number };

export function navItems({
  podeGerirMoradores,
  naoLidos = 0,
  pendencias = 0,
}: {
  podeGerirMoradores: boolean;
  naoLidos?: number;
  pendencias?: number;
}): NavItem[] {
  const itens: NavItem[] = [
    { href: "/inicio", label: "Início", curto: "Início", icon: "home" },
    { href: "/comunicados", label: "Comunicados", curto: "Avisos", icon: "megaphone", contador: naoLidos },
    { href: "/reservas", label: "Reservas", curto: "Reservas", icon: "calendar" },
    { href: "/documentos", label: "Documentos", curto: "Docs", icon: "file" },
    { href: "/contas", label: "Prestação de contas", curto: "Contas", icon: "wallet" },
  ];
  if (podeGerirMoradores) itens.push({ href: "/moradores", label: "Moradores", curto: "Moradores", icon: "users", contador: pendencias });
  itens.push({ href: "/perfil", label: "Perfil", curto: "Perfil", icon: "user" });
  return itens;
}
