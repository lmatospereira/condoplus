import type { Metadata } from "next";
import { selecionarCondominio } from "@/app/actions/condominio";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Condomínios" };

export default async function AdminPage() {
  const condominios = await prisma.condominio.findMany({
    orderBy: { nome: "asc" },
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
      <PageHeader titulo="Condomínios" descricao="Cadastro e edição chegam na fase 2." />
      {condominios.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum condomínio cadastrado ainda.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {condominios.map((c) => {
            const sindico = c.vinculos.find((v) => v.papel === "SINDICO" && v.status === "ATIVO");
            const moradores = c.vinculos.filter((v) => v.papel === "MORADOR" && v.status === "ATIVO").length;
            const pendencias = c.vinculos.filter((v) => v.status === "PENDENTE").length;
            return (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {c.nome}
                    {!c.ativo ? <span className="rounded bg-muted px-2 py-0.5 text-xs font-normal">inativo</span> : null}
                  </CardTitle>
                  <CardDescription>
                    {c.cidade}/{c.uf}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Casas</dt>
                    <dd>{c._count.unidades}</dd>
                    <dt className="text-muted-foreground">Síndico</dt>
                    <dd className="truncate">{sindico?.user.name ?? "—"}</dd>
                    <dt className="text-muted-foreground">Moradores ativos</dt>
                    <dd>{moradores}</dd>
                    <dt className="text-muted-foreground">Pendências</dt>
                    <dd>{pendencias}</dd>
                  </dl>
                  <form action={selecionarCondominio}>
                    <input type="hidden" name="condominioId" value={c.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Abrir como suporte
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
