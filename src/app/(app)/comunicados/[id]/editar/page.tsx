import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { ComunicadoForm } from "../../comunicado-form";

export const metadata: Metadata = { title: "Editar comunicado" };

export default async function EditarComunicadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { ator, db } = await requireTenant();
  const { id } = await params;
  if (!can(ator, "comunicado.gerenciar")) redirect(`/comunicados/${id}`);
  const c = await db.comunicado.findUnique({ where: { id } });
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader titulo="Editar comunicado" />
      <Card>
        <CardContent className="pt-5">
          <ComunicadoForm c={c} />
        </CardContent>
      </Card>
    </div>
  );
}
