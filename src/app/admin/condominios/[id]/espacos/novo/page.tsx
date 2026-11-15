import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { EspacoForm } from "../espaco-form";

export const metadata: Metadata = { title: "Novo espaço" };

export default async function NovoEspacoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.condominio.findUnique({ where: { id }, select: { id: true, nome: true } });
  if (!c) notFound();
  return (
    <>
      <PageHeader titulo="Novo espaço" descricao={c.nome} />
      <EspacoForm condominioId={c.id} />
    </>
  );
}
