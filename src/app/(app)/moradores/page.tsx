import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRightLeft, Home, UserPlus } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { ConfirmAction } from "@/components/confirm-action";
import { CopiarBotao } from "@/components/copiar";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { can } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { conviteAtivo, reservasDeExMoradores } from "@/server/moradores";
import { DIA_INTEIRO } from "@/server/reservas";
import {
  aprovarAction,
  desativarAction,
  excluirReservaExMoradorAction,
  gerarConviteAction,
  recusarAction,
  revogarConviteAction,
} from "./actions";

export const metadata: Metadata = { title: "Moradores" };

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export default async function MoradoresPage() {
  const { ator, condominio, db } = await requireTenant();
  if (!can(ator, "morador.aprovar")) redirect("/");

  const [pendentes, unidades, convite, exMoradores] = await Promise.all([
    db.vinculo.findMany({
      where: { papel: "MORADOR", status: "PENDENTE" },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true, email: true, telefone: true } },
        unidade: { select: { identificador: true } },
      },
    }),
    db.unidade.findMany({
      where: { ativo: true },
      orderBy: { identificador: "asc" },
      include: {
        vinculos: {
          where: { papel: "MORADOR", status: { in: ["ATIVO", "INATIVO"] } },
          orderBy: [{ status: "asc" }, { tipo: "asc" }],
          include: { user: { select: { name: true, email: true, telefone: true } } },
        },
      },
    }),
    conviteAtivo(condominio.id),
    reservasDeExMoradores(ator, condominio.id),
  ]);

  const titularAtual = new Map(
    unidades.map((u) => [u.id, u.vinculos.find((v) => v.status === "ATIVO" && v.tipo === "TITULAR")?.user.name ?? null]),
  );
  const linkConvite = convite ? `${appUrl}/convite/${convite.token}` : null;
  const ativos = unidades.reduce((n, u) => n + u.vinculos.filter((v) => v.status === "ATIVO").length, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Moradores" descricao={`${ativos} moradores ativos em ${unidades.length} casas.`} />

      {/* Pendências ------------------------------------------------------- */}
      <Card id="pendencias">
        <CardHeader>
          <CardTitle className="text-base">Pendências ({pendentes.length})</CardTitle>
          <CardDescription>Cadastros, transferências e mudanças de casa aguardando sua decisão.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada pendente. 🎉</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendentes.map((p) => {
                const titular = p.unidadeId ? titularAtual.get(p.unidadeId) : null;
                const tipo = p.substituiVinculoId
                  ? { Icone: ArrowRightLeft, texto: "Mudança de casa" }
                  : p.ehTransferencia
                    ? { Icone: ArrowRightLeft, texto: "Transferência (casa mudou de morador)" }
                    : { Icone: p.tipo === "TITULAR" ? Home : UserPlus, texto: p.tipo === "TITULAR" ? "Novo titular" : "Co-morador" };
                return (
                  <li key={p.id} className="rounded-md border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">
                          {p.user.name} · {p.unidade?.identificador}
                        </p>
                        <p className="break-all text-muted-foreground">
                          {p.user.email}
                          {p.user.telefone ? ` · ${p.user.telefone}` : ""}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                          <tipo.Icone className="size-3.5" aria-hidden /> {tipo.texto}
                        </p>
                        {p.ehTransferencia && titular ? (
                          <p className="text-xs text-muted-foreground">Ao aprovar, {titular} e os demais moradores da casa serão desativados.</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">Pedido em {formatarDataHora(p.createdAt)}</p>
                      </div>
                      <ConfirmAction
                        titulo={`Aprovar ${p.user.name}?`}
                        descricao={
                          p.ehTransferencia
                            ? `${p.user.name} vira titular da ${p.unidade?.identificador}. Os vínculos atuais da casa serão desativados (o histórico fica guardado).`
                            : `${p.user.name} passa a ter acesso ao condomínio como ${p.tipo === "TITULAR" ? "titular" : "co-morador"} da ${p.unidade?.identificador}.`
                        }
                        confirmar="Aprovar"
                        variant="default"
                        acao={aprovarAction.bind(null, p.id)}
                      >
                        Aprovar
                      </ConfirmAction>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-muted-foreground">Recusar…</summary>
                      <ActionForm action={recusarAction} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <input type="hidden" name="vinculoId" value={p.id} />
                        <Field id={`motivo-${p.id}`} label="Motivo (opcional)" className="flex-1">
                          <Input id={`motivo-${p.id}`} name="motivo" maxLength={500} />
                        </Field>
                        <SubmitButton variant="destructive" pendente="Recusando…">
                          Recusar
                        </SubmitButton>
                      </ActionForm>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Convite ---------------------------------------------------------- */}
      <Card id="convite">
        <CardHeader>
          <CardTitle className="text-base">Link de convite</CardTitle>
          <CardDescription>
            Compartilhe no grupo do condomínio. Quem abrir escolhe a casa e cria a própria senha; o cadastro fica pendente até você aprovar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {linkConvite ? (
            <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
              <code className="break-all text-sm">{linkConvite}</code>
              <p className="text-xs text-muted-foreground">
                {convite?.expiraEm ? `Válido até ${formatarDataHora(convite.expiraEm)}.` : "Sem data de validade."}
              </p>
              <div className="flex flex-wrap gap-2">
                <CopiarBotao texto={linkConvite} rotulo="Copiar link" />
                <ConfirmAction
                  titulo="Revogar o link?"
                  descricao="O link atual deixa de funcionar imediatamente. Cadastros já enviados continuam na fila."
                  confirmar="Revogar"
                  destrutivo
                  variant="ghost"
                  acao={revogarConviteAction}
                >
                  Revogar
                </ConfirmAction>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum link ativo.</p>
          )}
          <ActionForm action={gerarConviteAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field id="validadeDias" label="Validade em dias (opcional)" className="sm:w-56">
              <Input id="validadeDias" name="validadeDias" type="number" min={1} max={365} placeholder="Sem validade" />
            </Field>
            <SubmitButton variant={linkConvite ? "outline" : "default"} pendente="Gerando…">
              {linkConvite ? "Gerar novo link" : "Gerar link"}
            </SubmitButton>
          </ActionForm>
        </CardContent>
      </Card>

      {/* Reservas de ex-moradores ---------------------------------------- */}
      {exMoradores.length > 0 ? (
        <Card id="reservas-ex-moradores" className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">Reservas futuras de ex-moradores</CardTitle>
            <CardDescription>Criadas por quem não mora mais na casa. Mantenha ou exclua.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {exMoradores.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span>
                    {r.espaco.nome} · {formatarData(r.data)}
                    {r.periodo !== DIA_INTEIRO ? ` (${r.periodo})` : ""} · {r.unidade.identificador}
                    <span className="text-muted-foreground"> · criada por {r.criadoPor.name}</span>
                  </span>
                  <ConfirmAction
                    titulo="Excluir esta reserva?"
                    descricao="A data fica livre para outras casas."
                    confirmar="Excluir"
                    destrutivo
                    variant="ghost"
                    acao={excluirReservaExMoradorAction.bind(null, r.id)}
                  >
                    Excluir
                  </ConfirmAction>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Casas ------------------------------------------------------------ */}
      <Card id="casas">
        <CardHeader>
          <CardTitle className="text-base">Casas e moradores</CardTitle>
          <CardDescription>E-mail e telefone aparecem só para o síndico e o Admin Master.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {unidades.map((u) => {
              const ativosCasa = u.vinculos.filter((v) => v.status === "ATIVO");
              const historico = u.vinculos.filter((v) => v.status === "INATIVO");
              return (
                <li key={u.id} className="py-3">
                  <p className="text-sm font-semibold">{u.identificador}</p>
                  {ativosCasa.length === 0 ? <p className="text-sm text-muted-foreground">Sem moradores ativos.</p> : null}
                  <ul className="mt-1 flex flex-col gap-2">
                    {ativosCasa.map((v) => (
                      <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="min-w-0">
                          {v.user.name}{" "}
                          <span className="text-muted-foreground">
                            · {v.tipo === "TITULAR" ? "titular" : "co-morador"} · <span className="break-all">{v.user.email}</span>
                            {v.user.telefone ? ` · ${v.user.telefone}` : ""}
                          </span>
                        </span>
                        <ConfirmAction
                          titulo={`Desativar ${v.user.name}?`}
                          descricao={`${v.user.name} perde o acesso à ${u.identificador}. O histórico (reservas, leituras) é mantido.`}
                          confirmar="Desativar"
                          destrutivo
                          variant="ghost"
                          acao={desativarAction.bind(null, v.id)}
                        >
                          Desativar
                        </ConfirmAction>
                      </li>
                    ))}
                  </ul>
                  {historico.length > 0 ? (
                    <details className="mt-1 text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Histórico ({historico.length})</summary>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {historico.map((v) => (
                          <li key={v.id}>
                            {v.user.name} · {v.tipo === "TITULAR" ? "titular" : "co-morador"}
                            {v.desativadoEm ? ` · até ${formatarData(v.desativadoEm)}` : ""}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
