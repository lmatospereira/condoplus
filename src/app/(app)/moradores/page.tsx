import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmBreve, PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Moradores" };

export default async function MoradoresPage() {
  const { ator } = await requireTenant();
  if (!can(ator, "morador.aprovar")) redirect("/");
  return (
    <>
      <PageHeader titulo="Moradores" descricao="Casas, moradores, pendências e link de convite." />
      <EmBreve fase={3} texto="A gestão de moradores e convites aparece aqui." />
    </>
  );
}
