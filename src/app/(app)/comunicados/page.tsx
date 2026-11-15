import type { Metadata } from "next";
import { EmBreve, PageHeader } from "@/components/page-header";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Comunicados" };

export default async function Page() {
  await requireTenant();
  return (
    <>
      <PageHeader titulo="Comunicados" descricao="Avisos do síndico para os moradores." />
      <EmBreve fase={5} texto="Os comunicados aparecem aqui." />
    </>
  );
}
