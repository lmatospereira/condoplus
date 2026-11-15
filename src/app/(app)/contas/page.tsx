import type { Metadata } from "next";
import { EmBreve, PageHeader } from "@/components/page-header";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Prestação de contas" };

export default async function Page() {
  await requireTenant();
  return (
    <>
      <PageHeader titulo="Prestação de contas" descricao="Despesas lançadas pelo síndico." />
      <EmBreve fase={6} texto="O resumo de despesas aparece aqui." />
    </>
  );
}
