import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Condomínios" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? "";
  const condominios = await prisma.condominio.findMany({
    where: q
      ? { OR: [{ nome: { contains: q, mode: "insensitive" } }, { cidade: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      cidade: true,
      uf: true,
      ativo: true,
      _count: { select: { unidades: true } },
      vinculos: {
        where: { status: { in: ["ATIVO", "PENDENTE"] } },
        select: { papel: true, status: true, user: { select: { name: true } } },
      },
    },
  });

  return (
    <>
      <PageHeader titulo="Condomínios" descricao="Cadastre condomínios, casas, espaços e o síndico.">
        <Button asChild>
          <Link href="/admin/condominios/novo">
            <Plus aria-hidden /> Novo condomínio
          </Link>
        </Button>
      </PageHeader>

      <form className="mb-5 flex gap-2" role="search">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome ou cidade" aria-label="Buscar condomínio" />
        <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
          <Search aria-hidden />
        </Button>
      </form>

      {condominios.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {q ? `Nenhum condomínio encontrado para “${q}”.` : "Nenhum condomínio cadastrado ainda. Comece em “Novo condomínio”."}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {condominios.map((c) => {
            const sindico = c.vinculos.find((v) => v.papel === "SINDICO" && v.status === "ATIVO");
            const moradores = c.vinculos.filter((v) => v.papel === "MORADOR" && v.status === "ATIVO").length;
            const pendencias = c.vinculos.filter((v) => v.status === "PENDENTE").length;
            return (
              <Link
                key={c.id}
                href={`/admin/condominios/${c.id}`}
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {c.nome}
                      {!c.ativo ? <span className="rounded bg-muted px-2 py-0.5 text-xs font-normal">inativo</span> : null}
                    </CardTitle>
                    <CardDescription>
                      {c.cidade}/{c.uf}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-muted-foreground">Casas</dt>
                      <dd>{c._count.unidades}</dd>
                      <dt className="text-muted-foreground">Síndico</dt>
                      <dd className={sindico ? "truncate" : "text-destructive"}>{sindico?.user.name ?? "Sem síndico"}</dd>
                      <dt className="text-muted-foreground">Moradores ativos</dt>
                      <dd>{moradores}</dd>
                      <dt className="text-muted-foreground">Pendências</dt>
                      <dd>{pendencias}</dd>
                    </dl>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
