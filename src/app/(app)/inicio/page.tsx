import Link from "next/link";
import { AlertTriangle, CalendarDays, FileText, Megaphone, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { can } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { listarComunicados } from "@/server/comunicados";
import { DIA_INTEIRO, proximasReservas } from "@/server/reservas";

const ATALHOS = [
  { href: "/reservas", titulo: "Reservar", Icone: CalendarDays },
  { href: "/comunicados", titulo: "Comunicados", Icone: Megaphone },
  { href: "/documentos", titulo: "Documentos", Icone: FileText },
  { href: "/contas", titulo: "Contas", Icone: Wallet },
];

export default async function InicioPage() {
  const { usuario, condominio, ator, db } = await requireTenant();
  const gestao = can(ator, "morador.aprovar");
  const [pendentes, comunicados, reservas] = await Promise.all([
    gestao ? db.vinculo.count({ where: { papel: "MORADOR", status: "PENDENTE" } }) : 0,
    listarComunicados(ator, condominio.id),
    proximasReservas(ator, condominio.id, { todas: gestao, limite: 5 }),
  ]);
  const ultimos = comunicados.slice(0, 4);
  const naoLidos = comunicados.filter((c) => !c.lido).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo={`Olá, ${usuario.name.split(" ")[0]}`} descricao={condominio.nome} />

      {pendentes > 0 ? (
        <Link href="/moradores#pendencias" className="block rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm font-medium text-primary">
          {pendentes} {pendentes === 1 ? "cadastro aguardando" : "cadastros aguardando"} sua aprovação →
        </Link>
      ) : null}

      <nav aria-label="Atalhos" className="grid grid-cols-4 gap-2">
        {ATALHOS.map(({ href, titulo, Icone }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-2 text-center text-xs font-medium hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
              <Icone className="size-5" aria-hidden />
            </span>
            {titulo}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos comunicados</CardTitle>
            {naoLidos > 0 ? <span className="text-xs font-semibold text-primary">{naoLidos} não lido(s)</span> : null}
          </CardHeader>
          <CardContent>
            {ultimos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum comunicado ainda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {ultimos.map((c) => (
                  <li key={c.id}>
                    <Link href={`/comunicados/${c.id}`} className="flex min-h-11 items-start gap-2 py-2 text-sm hover:text-primary">
                      {!c.lido ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Não lido" /> : <span className="w-2 shrink-0" />}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate", !c.lido && "font-semibold")}>
                          {c.importante ? <AlertTriangle className="mr-1 inline size-3.5 text-destructive" aria-label="Importante" /> : null}
                          {c.titulo}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatarDataHora(c.createdAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/comunicados" className="mt-2 inline-block text-sm text-primary underline underline-offset-4">
              Ver todos
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{gestao ? "Próximas reservas" : "Minhas próximas reservas"}</CardTitle>
          </CardHeader>
          <CardContent>
            {reservas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma reserva futura.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {reservas.map((r) => (
                  <li key={r.id} className="py-2 text-sm">
                    <span className="font-medium">{formatarData(r.data)}</span> · {r.espaco.nome}
                    {r.periodo !== DIA_INTEIRO ? ` (${r.periodo})` : ""}
                    <span className="text-muted-foreground"> · {r.unidade.identificador}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/reservas" className="mt-2 inline-block text-sm text-primary underline underline-offset-4">
              Abrir calendário
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
