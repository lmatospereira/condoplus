import type { Metadata } from "next";
import { EmBreve, PageHeader } from "@/components/page-header";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Documentos" };

export default async function Page() {
  await requireTenant();
  return (
    <>
      <PageHeader titulo="Documentos" descricao="Convenção, regimento, atas e contratos." />
      <EmBreve fase={5} texto="Os documentos do condomínio aparecem aqui." />
    </>
  );
}
