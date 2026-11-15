import type { Metadata } from "next";
import { EmBreve, PageHeader } from "@/components/page-header";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Reservas" };

export default async function Page() {
  await requireTenant();
  return (
    <>
      <PageHeader titulo="Reservas" descricao="Calendário dos espaços do condomínio." />
      <EmBreve fase={4} texto="O calendário de reservas aparece aqui." />
    </>
  );
}
