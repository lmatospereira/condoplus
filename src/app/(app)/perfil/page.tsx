import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { sair } from "@/app/actions/auth";
import { PageHeader } from "@/components/page-header";
import { TrocarSenhaForm } from "@/components/trocar-senha-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { MudancaCasaForm } from "./mudanca-form";

export const metadata: Metadata = { title: "Perfil" };

const STATUS: Record<string, string> = { PENDENTE: "Aguardando aprovação", ATIVO: "Ativo", RECUSADO: "Recusado", INATIVO: "Inativo" };

export default async function PerfilPage() {
  const { usuario, condominio, ator, db } = await requireTenant();
  const [dados, vinculos] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: usuario.id }, select: { name: true, email: true, telefone: true } }),
    db.vinculo.findMany({
      where: { userId: usuario.id, status: { in: ["ATIVO", "PENDENTE"] } },
      select: { id: true, papel: true, tipo: true, status: true, unidade: { select: { identificador: true } } },
    }),
  ]);
  const moraAqui = ator.unidadeIds.length > 0;
  const temPedido = vinculos.some((v) => v.status === "PENDENTE");
  const outrasCasas = moraAqui && !temPedido
    ? (
        await db.unidade.findMany({
          where: { ativo: true, id: { notIn: ator.unidadeIds } },
          orderBy: { identificador: "asc" },
          select: {
            id: true,
            identificador: true,
            _count: { select: { vinculos: { where: { papel: "MORADOR", tipo: "TITULAR", status: "ATIVO" } } } },
          },
        })
      ).map((u) => ({ id: u.id, identificador: u.identificador, temTitular: u._count.vinculos > 0 }))
    : [];

  return (
    <>
      <PageHeader titulo="Perfil" />
      <Card>
        <CardHeader>
          <CardTitle>{dados.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd>{dados.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Telefone</dt>
              <dd>{dados.telefone ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{condominio.nome}</dt>
              <dd>
                <ul className="mt-1 flex flex-col gap-1">
                  {vinculos.map((v) => (
                    <li key={v.id}>
                      {v.papel === "SINDICO"
                        ? "Síndico"
                        : `${v.unidade?.identificador ?? ""} · ${v.tipo === "TITULAR" ? "Titular" : "Co-morador"}`}{" "}
                      <span className="text-muted-foreground">({STATUS[v.status]})</span>
                    </li>
                  ))}
                  {vinculos.length === 0 ? <li className="text-muted-foreground">Acesso de suporte (Admin Master)</li> : null}
                </ul>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      {outrasCasas.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Mudar de casa</CardTitle>
          </CardHeader>
          <CardContent className="max-w-md">
            <p className="mb-3 text-sm text-muted-foreground">Mudou para outra casa do condomínio? O síndico precisa aprovar.</p>
            <MudancaCasaForm unidades={outrasCasas} />
          </CardContent>
        </Card>
      ) : null}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Trocar senha</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md">
          <TrocarSenhaForm />
        </CardContent>
      </Card>
      <form action={sair} className="mt-6 md:hidden">
        <Button variant="outline" type="submit" className="w-full">
          <LogOut aria-hidden /> Sair
        </Button>
      </form>
    </>
  );
}
