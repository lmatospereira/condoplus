import { AppShell } from "@/components/shell/app-shell";
import { navItems } from "@/components/shell/nav-items";
import { can, ehMorador } from "@/lib/permissions";
import { condominiosDoUsuario, requireTenant } from "@/lib/tenant";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, condominio, ator } = await requireTenant();
  const podeGerirMoradores = can(ator, "morador.aprovar");
  const papel = ator.isMaster
    ? "Admin Master (suporte)"
    : ator.sindico
      ? ehMorador(ator)
        ? "Síndico e morador"
        : "Síndico"
      : "Morador";
  const trocar = ator.isMaster || (await condominiosDoUsuario(usuario.id)).length > 1;

  return (
    <AppShell
      condominio={condominio.nome}
      usuario={usuario.name}
      papel={papel}
      itens={navItems({ podeGerirMoradores })}
      podeGerirMoradores={podeGerirMoradores}
      trocarCondominio={trocar}
      master={ator.isMaster}
    >
      {children}
    </AppShell>
  );
}
