import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { excluirEspacoAction } from "@/app/admin/actions";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { tenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/db";
import { EspacoForm } from "../espaco-form";

export const metadata: Metadata = { title: "Editar espaço" };

export default async function EditarEspacoPage({ params }: { params: Promise<{ id: string; espacoId: string }> }) {
  const { id, espacoId } = await params;
  const c = await prisma.condominio.findUnique({ where: { id }, select: { id: true, nome: true } });
  if (!c) notFound();
  const espaco = await tenantDb(c.id).espaco.findUnique({ where: { id: espacoId } });
  if (!espaco) notFound();

  return (
    <>
      <PageHeader titulo={espaco.nome} descricao={c.nome}>
        <ConfirmAction
          titulo={`Excluir “${espaco.nome}”?`}
          descricao="Só é possível excluir espaços sem nenhuma reserva. Se já houve reservas, desative o espaço."
          confirmar="Excluir"
          destrutivo
          variant="ghost"
          acao={excluirEspacoAction.bind(null, c.id, espaco.id)}
        >
          <Trash2 aria-hidden /> Excluir
        </ConfirmAction>
      </PageHeader>
      <EspacoForm condominioId={c.id} espaco={espaco} />
    </>
  );
}
