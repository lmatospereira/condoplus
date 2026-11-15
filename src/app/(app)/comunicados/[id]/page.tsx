import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Pencil, Pin, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatarDataHora } from "@/lib/datas";
import { can } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { abrirComunicado, CATEGORIAS_COMUNICADO, leituraPorCasas } from "@/server/comunicados";
import { excluirComunicadoAction } from "../actions";

export const metadata: Metadata = { title: "Comunicado" };

export default async function ComunicadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { ator, condominio } = await requireTenant();
  const { id } = await params;
  const c = await abrirComunicado(ator, condominio.id, id);
  if (!c) notFound();
  const gerencia = can(ator, "comunicado.gerenciar");
  const leitura = ator.sindico || ator.isMaster ? await leituraPorCasas(condominio.id, [c.id]) : null;

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/comunicados" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Comunicados
      </Link>
      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {c.fixado ? (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <Pin className="size-3.5" aria-hidden /> Fixado
            </span>
          ) : null}
          {c.importante ? (
            <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
              <AlertTriangle className="size-3.5" aria-hidden /> Importante
            </span>
          ) : null}
          <span className="rounded bg-muted px-1.5 py-0.5">{CATEGORIAS_COMUNICADO[c.categoria]}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{c.titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {c.autor.name} · {formatarDataHora(c.createdAt)}
          {c.updatedAt.getTime() - c.createdAt.getTime() > 60e3 ? ` · editado em ${formatarDataHora(c.updatedAt)}` : ""}
        </p>
      </header>
      <Card>
        <CardContent className="pt-5 text-[15px]">
          <Markdown texto={c.conteudo} />
        </CardContent>
      </Card>
      {leitura ? (
        <p className="text-sm text-muted-foreground">
          Lido por {leitura.casasLeram.get(c.id) ?? 0} de {leitura.totalCasas} casas com moradores ativos.
        </p>
      ) : null}
      {gerencia ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/comunicados/${c.id}/editar`}>
              <Pencil aria-hidden /> Editar
            </Link>
          </Button>
          <ConfirmAction
            titulo="Excluir este comunicado?"
            descricao="Ele some para todos os moradores. A exclusão fica registrada na auditoria."
            confirmar="Excluir"
            destrutivo
            variant="ghost"
            acao={excluirComunicadoAction.bind(null, c.id)}
          >
            <Trash2 aria-hidden /> Excluir
          </ConfirmAction>
        </div>
      ) : null}
    </article>
  );
}
