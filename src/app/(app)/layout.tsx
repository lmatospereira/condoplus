import { AppShell } from "@/components/shell/app-shell";
import { navItems } from "@/components/shell/nav-items";
import { can, ehMorador } from "@/lib/permissions";
import { condominiosDoUsuario, requireTenant } from "@/lib/tenant";
import { contarNaoLidos } from "@/server/comunicados";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, condominio, ator, db } = await requireTenant();
  const podeGerirMoradores = can(ator, "morador.aprovar");
  const papel = ator.isMaster
    ? "Admin Master (suporte)"
    : ator.sindico
      ? ehMorador(ator)
        ? "Síndico e morador"
        : "Síndico"
      : "Morador";
  const [condominios, naoLidos, pendencias] = await Promise.all([
    condominiosDoUsuario(usuario.id),
    contarNaoLidos(ator, condominio.id),
    podeGerirMoradores ? db.vinculo.count({ where: { papel: "MORADOR", status: "PENDENTE" } }) : 0,
  ]);
  const trocar = ator.isMaster || condominios.length > 1;

  return (
    <AppShell
      condominio={condominio.nome}
      usuario={usuario.name}
      papel={papel}
      itens={navItems({ podeGerirMoradores, naoLidos, pendencias })}
      podeGerirMoradores={podeGerirMoradores}
      pendencias={pendencias}
      trocarCondominio={trocar}
      master={ator.isMaster}
    >
      {children}
    </AppShell>
  );
}
