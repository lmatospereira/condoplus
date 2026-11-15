import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { ComunicadoForm } from "../comunicado-form";

export const metadata: Metadata = { title: "Novo comunicado" };

export default async function NovoComunicadoPage() {
  const { ator } = await requireTenant();
  if (!can(ator, "comunicado.gerenciar")) redirect("/comunicados");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader titulo="Novo comunicado" />
      <Card>
        <CardContent className="pt-5">
          <ComunicadoForm />
        </CardContent>
      </Card>
    </div>
  );
}
