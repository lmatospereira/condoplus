import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { dataISO, formatarData, hojeSP, parseDataISO } from "@/lib/datas";
import { requireTenant } from "@/lib/tenant";
import { DIA_INTEIRO, periodosDoEspaco } from "@/server/reservas";
import { criarReservaAction } from "../actions";

export const metadata: Metadata = { title: "Nova reserva" };

const SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

export default async function NovaReservaPage({ searchParams }: { searchParams: Promise<{ espaco?: string; data?: string }> }) {
  const { ator, db } = await requireTenant();
  const sp = await searchParams;
  const data = sp.data ? parseDataISO(sp.data) : null;
  if (!data || !sp.espaco) notFound();
  if (!ator.sindico && ator.unidadeIds.length === 0) redirect("/reservas");

  const espaco = await db.espaco.findFirst({ where: { id: sp.espaco, ativo: true } });
  if (!espaco) notFound();
  const voltar = `/reservas?espaco=${espaco.id}&mes=${dataISO(data).slice(0, 7)}`;

  const [ocupadas, unidades] = await Promise.all([
    db.reserva.findMany({ where: { espacoId: espaco.id, data, excluidoEm: null }, select: { periodo: true } }),
    db.unidade.findMany({
      where: { ativo: true, ...(ator.sindico ? {} : { id: { in: ator.unidadeIds } }) },
      orderBy: { identificador: "asc" },
      select: { id: true, identificador: true },
    }),
  ]);
  const livres = periodosDoEspaco(espaco).filter((p) => !ocupadas.some((o) => o.periodo === p));
  const indisponivel = data < hojeSP() || livres.length === 0;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <PageHeader titulo="Confirmar reserva" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{espaco.nome}</CardTitle>
          <p className="text-sm">
            <span className="font-medium">{formatarData(data)}</span>{" "}
            <span className="text-muted-foreground">({SEMANA[data.getUTCDay()]})</span>
            {espaco.capacidade ? <span className="text-muted-foreground"> · até {espaco.capacidade} pessoas</span> : null}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {espaco.regras ? (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="mb-1 font-medium">Regras de uso</p>
              <p className="whitespace-pre-line text-muted-foreground">{espaco.regras}</p>
            </div>
          ) : null}

          {indisponivel ? (
            <p className="text-sm text-destructive">Este dia não está mais disponível.</p>
          ) : (
            <ActionForm action={criarReservaAction} className="flex flex-col gap-4">
              <input type="hidden" name="espacoId" value={espaco.id} />
              <input type="hidden" name="data" value={dataISO(data)} />
              {espaco.modo === "DIA_INTEIRO" ? (
                <input type="hidden" name="periodo" value={DIA_INTEIRO} />
              ) : (
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-medium">Período</legend>
                  {livres.map((p, i) => (
                    <label key={p} className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm">
                      <input type="radio" name="periodo" value={p} defaultChecked={i === 0} required className="size-5 accent-primary" />
                      {p}
                    </label>
                  ))}
                </fieldset>
              )}
              {unidades.length === 1 ? (
                <>
                  <input type="hidden" name="unidadeId" value={unidades[0].id} />
                  <p className="text-sm text-muted-foreground">Reserva para a {unidades[0].identificador}.</p>
                </>
              ) : (
                <Field id="unidadeId" label={ator.sindico ? "Reservar para a casa" : "Casa"}>
                  <Select id="unidadeId" name="unidadeId" required defaultValue="">
                    <option value="" disabled>
                      Selecione
                    </option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.identificador}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link href={voltar}>Voltar</Link>
                </Button>
                <SubmitButton pendente="Reservando…">Confirmar reserva</SubmitButton>
              </div>
            </ActionForm>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
