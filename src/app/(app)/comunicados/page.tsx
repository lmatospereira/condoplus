import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Pin, Plus, Search } from "lucide-react";
import { textoPuro } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatarDataHora } from "@/lib/datas";
import { can } from "@/lib/permissions";
import { CATEGORIAS } from "@/lib/schemas/comunicados";
import { requireTenant } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { CATEGORIAS_COMUNICADO, leituraPorCasas, listarComunicados } from "@/server/comunicados";

export const metadata: Metadata = { title: "Comunicados" };

export default async function ComunicadosPage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string }> }) {
  const { ator, condominio } = await requireTenant();
  const sp = await searchParams;
  const categoria = CATEGORIAS.find((c) => c === sp.categoria);
  const itens = await listarComunicados(ator, condominio.id, { q: sp.q, categoria });
  const gestao = ator.sindico || ator.isMaster;
  const leitura = gestao && itens.length ? await leituraPorCasas(condominio.id, itens.map((c) => c.id)) : null;

  return (
    <>
      <PageHeader titulo="Comunicados" descricao="Avisos do síndico para os moradores.">
        {can(ator, "comunicado.gerenciar") ? (
          <Button asChild>
            <Link href="/comunicados/novo">
              <Plus aria-hidden /> Novo comunicado
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <form role="search" className="mb-5 flex flex-col gap-2 sm:flex-row">
        <Input name="q" defaultValue={sp.q} placeholder="Buscar nos comunicados" aria-label="Buscar" className="sm:flex-1" />
        <div className="flex gap-2">
          <Select name="categoria" defaultValue={categoria ?? ""} aria-label="Categoria" className="sm:w-44">
            <option value="">Todas as categorias</option>
            {Object.entries(CATEGORIAS_COMUNICADO).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="outline" size="icon" aria-label="Filtrar">
            <Search aria-hidden />
          </Button>
        </div>
      </form>

      {itens.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {sp.q || categoria ? "Nenhum comunicado encontrado com esses filtros." : "Nenhum comunicado publicado ainda."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {itens.map((c) => (
            <li key={c.id}>
              <Link href={`/comunicados/${c.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className={cn("p-4 transition-colors hover:border-primary/40", !c.lido && "border-primary/50 bg-primary/[0.03]")}>
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
                    <time className="text-muted-foreground">{formatarDataHora(c.createdAt)}</time>
                    {!c.lido ? (
                      <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">
                        <span className="size-2 rounded-full bg-primary" aria-hidden /> Não lido
                      </span>
                    ) : null}
                  </div>
                  <h2 className={cn("mt-2 text-base", c.lido ? "font-medium" : "font-semibold")}>{c.titulo}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{textoPuro(c.conteudo)}</p>
                  {leitura ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Lido por {leitura.casasLeram.get(c.id) ?? 0} de {leitura.totalCasas} casas
                    </p>
                  ) : null}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
