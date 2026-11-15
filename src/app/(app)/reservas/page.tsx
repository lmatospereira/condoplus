import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dataISO, formatarData, hojeSP, parseDataISO } from "@/lib/datas";
import { can } from "@/lib/permissions";
import { parseMes } from "@/lib/schemas/reservas";
import { requireTenant } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { DIA_INTEIRO, periodosDoEspaco, proximasReservas, reservasDoMes } from "@/server/reservas";
import { excluirReservaAction } from "./actions";

export const metadata: Metadata = { title: "Reservas" };

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function mesISO(ano: number, mes: number) {
  const d = new Date(Date.UTC(ano, mes - 1, 1));
  return dataISO(d).slice(0, 7);
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ espaco?: string; mes?: string; reservado?: string }>;
}) {
  const { ator, condominio, db } = await requireTenant();
  const sp = await searchParams;
  const hoje = hojeSP();
  const espacos = await db.espaco.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });

  if (espacos.length === 0) {
    return (
      <>
        <PageHeader titulo="Reservas" />
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum espaço disponível para reserva. Os espaços são cadastrados pelo Admin Master.
        </p>
      </>
    );
  }

  const espaco = espacos.find((e) => e.id === sp.espaco) ?? espacos[0];
  const { ano, mes } = parseMes(sp.mes, hoje);
  const periodos = periodosDoEspaco(espaco);
  const podeReservar = ator.sindico || ator.unidadeIds.length > 0;
  const gestao = ator.sindico || ator.isMaster;

  const [reservas, proximas] = await Promise.all([
    reservasDoMes(condominio.id, espaco.id, ano, mes),
    proximasReservas(ator, condominio.id, { todas: gestao }),
  ]);

  const porDia = new Map<string, typeof reservas>();
  for (const r of reservas) {
    const k = dataISO(r.data);
    porDia.set(k, [...(porDia.get(k) ?? []), r]);
  }
  const bloqueados = new Set(espaco.diasBloqueados.map(dataISO));

  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const vazios = primeiro.getUTCDay();
  const anterior = mesISO(ano, mes - 1);
  const proximo = mesISO(ano, mes + 1);
  const reservado = sp.reservado ? parseDataISO(sp.reservado) : null;
  const q = (m: string) => `/reservas?espaco=${espaco.id}&mes=${m}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Reservas" descricao="Escolha o espaço e toque em um dia livre para reservar." />

      {reservado ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/5 p-3 text-sm font-medium">
          <CalendarCheck className="size-5 text-success" aria-hidden /> Reserva confirmada para {formatarData(reservado)}.
        </p>
      ) : null}

      {espacos.length > 1 ? (
        <nav aria-label="Espaços" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {espacos.map((e) => (
            <Button key={e.id} asChild size="sm" variant={e.id === espaco.id ? "default" : "outline"}>
              <Link href={`/reservas?espaco=${e.id}&mes=${mesISO(ano, mes)}`} aria-current={e.id === espaco.id ? "page" : undefined}>
                {e.nome}
              </Link>
            </Button>
          ))}
        </nav>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Mês anterior">
            <Link href={q(anterior)}>
              <ChevronLeft aria-hidden />
            </Link>
          </Button>
          <div className="text-center">
            <CardTitle className="text-base capitalize">
              {MESES[mes - 1]} de {ano}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{espaco.nome}</p>
          </div>
          <Button asChild variant="ghost" size="icon" aria-label="Próximo mês">
            <Link href={q(proximo)}>
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-2 sm:px-5">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground" aria-hidden>
            {SEMANA.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <ol className="grid grid-cols-7 gap-1">
            {Array.from({ length: vazios }, (_, i) => (
              <li key={`v${i}`} aria-hidden />
            ))}
            {Array.from({ length: diasNoMes }, (_, i) => {
              const dia = new Date(Date.UTC(ano, mes - 1, i + 1));
              const iso = dataISO(dia);
              const ocup = porDia.get(iso) ?? [];
              const passado = dia < hoje;
              const bloqueado = bloqueados.has(iso);
              const cheio = ocup.length >= periodos.length;
              const livre = !passado && !bloqueado && !cheio && podeReservar;
              const rotulo = `${formatarData(dia)}: ${
                bloqueado ? "bloqueado" : ocup.length ? `reservado por ${ocup.map((r) => r.unidade.identificador).join(", ")}` : passado ? "passado" : "livre"
              }`;
              const conteudo = (
                <>
                  <span className={cn("text-sm font-medium", dia.getTime() === hoje.getTime() && "rounded-full bg-primary px-1.5 text-primary-foreground")}>
                    {i + 1}
                  </span>
                  {bloqueado ? <span className="text-[10px] leading-tight">bloqueado</span> : null}
                  {ocup.map((r) => (
                    <span key={r.id} className="w-full truncate rounded bg-primary/15 px-0.5 text-[10px] leading-tight text-primary">
                      {r.periodo === DIA_INTEIRO ? "" : `${r.periodo.slice(0, 5)} · `}
                      {r.unidade.identificador.replace(/^Casa\s*/i, "C")}
                    </span>
                  ))}
                </>
              );
              const base = "flex min-h-16 flex-col items-center gap-0.5 rounded-md border p-1 sm:min-h-20";
              return (
                <li key={iso}>
                  {livre ? (
                    <Link
                      href={`/reservas/nova?espaco=${espaco.id}&data=${iso}`}
                      aria-label={`${rotulo}. Reservar`}
                      className={cn(base, "border-border bg-card hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                    >
                      {conteudo}
                    </Link>
                  ) : (
                    <div
                      aria-label={rotulo}
                      className={cn(base, "border-transparent", passado || bloqueado ? "bg-muted/40 text-muted-foreground" : "bg-muted")}
                    >
                      {conteudo}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {espaco.regras ? (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-medium">Regras de uso</summary>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{espaco.regras}</p>
            </details>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{gestao ? "Próximas reservas do condomínio" : "Minhas reservas"}</CardTitle>
        </CardHeader>
        <CardContent>
          {proximas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma reserva futura.</p>
          ) : (
            <ul className="divide-y divide-border">
              {proximas.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    <span className="font-medium">{formatarData(r.data)}</span> · {r.espaco.nome}
                    {r.periodo !== DIA_INTEIRO ? ` (${r.periodo})` : ""} · {r.unidade.identificador}
                  </span>
                  {can(ator, "reserva.excluir", { criadoPorId: r.criadoPorId, passada: false }) ? (
                    <ConfirmAction
                      titulo="Excluir esta reserva?"
                      descricao={`${r.espaco.nome} em ${formatarData(r.data)} fica livre para outras casas.`}
                      confirmar="Excluir"
                      destrutivo
                      variant="ghost"
                      acao={excluirReservaAction.bind(null, r.id)}
                    >
                      Excluir
                    </ConfirmAction>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
