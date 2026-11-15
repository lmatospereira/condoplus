import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import {
  adicionarCasasAction,
  atualizarCondominioAction,
  definirCasaAtivaAction,
  definirCondominioAtivoAction,
  removerSindicoAction,
  renomearCasaAction,
} from "@/app/admin/actions";
import { selecionarCondominio } from "@/app/actions/condominio";
import { ActionForm } from "@/components/action-form";
import { ConfirmAction } from "@/components/confirm-action";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ACOES_AUDITORIA } from "@/lib/auditoria";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { prisma } from "@/lib/db";
import { CondominioFields } from "../condominio-fields";
import { DefinirSindicoForm, RedefinirSenhaButton } from "./senha-forms";

export const metadata: Metadata = { title: "Condomínio" };

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export default async function CondominioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.condominio.findUnique({
    where: { id },
    include: {
      unidades: {
        orderBy: { identificador: "asc" },
        include: {
          vinculos: {
            where: { papel: "MORADOR", status: { in: ["ATIVO", "PENDENTE"] } },
            select: { id: true, tipo: true, status: true, user: { select: { id: true, name: true } } },
          },
        },
      },
      espacos: { orderBy: { nome: "asc" } },
      vinculos: {
        where: { papel: "SINDICO" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { id: true, name: true, email: true, telefone: true, trocarSenha: true } } },
      },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { name: true } } } },
    },
  });
  if (!c) notFound();

  const sindico = c.vinculos.find((v) => v.status === "ATIVO");
  const anteriores = c.vinculos.filter((v) => v.status !== "ATIVO");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Condomínios
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              {c.nome}
              {!c.ativo ? <span className="rounded bg-muted px-2 py-0.5 text-sm font-normal">inativo</span> : null}
            </h1>
            <p className="text-sm text-muted-foreground">
              {c.endereco} · {c.cidade}/{c.uf}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={selecionarCondominio}>
              <input type="hidden" name="condominioId" value={c.id} />
              <Button type="submit" variant="outline" size="sm">
                Abrir como suporte
              </Button>
            </form>
            <ConfirmAction
              titulo={c.ativo ? "Desativar condomínio?" : "Ativar condomínio?"}
              descricao={
                c.ativo
                  ? "Síndico e moradores perdem o acesso até o condomínio ser reativado. Nenhum dado é apagado."
                  : "Síndico e moradores voltam a ter acesso."
              }
              confirmar={c.ativo ? "Desativar" : "Ativar"}
              destrutivo={c.ativo}
              acao={definirCondominioAtivoAction.bind(null, c.id, !c.ativo)}
            >
              {c.ativo ? "Desativar" : "Ativar"}
            </ConfirmAction>
          </div>
        </div>
      </div>

      {/* Síndico ------------------------------------------------------------ */}
      <Card id="sindico">
        <CardHeader>
          <CardTitle className="text-base">Síndico</CardTitle>
          <CardDescription>Só o Admin Master define ou troca o síndico. O anterior perde o papel na hora.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {sindico ? (
            <div className="flex flex-col gap-3 rounded-md bg-muted p-4 text-sm">
              <div>
                <p className="font-medium">{sindico.user.name}</p>
                <p className="text-muted-foreground">
                  {sindico.user.email}
                  {sindico.user.telefone ? ` · ${sindico.user.telefone}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Desde {formatarData(sindico.aprovadoEm ?? sindico.createdAt)}
                  {sindico.user.trocarSenha ? " · ainda não trocou a senha provisória" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <RedefinirSenhaButton condominioId={c.id} userId={sindico.user.id} nome={sindico.user.name} appUrl={appUrl} />
                <ConfirmAction
                  titulo="Remover o síndico?"
                  descricao={`${sindico.user.name} deixa de ser síndico agora. Se morar em uma casa do condomínio, continua com acesso de morador.`}
                  confirmar="Remover"
                  destrutivo
                  variant="ghost"
                  acao={removerSindicoAction.bind(null, c.id)}
                >
                  Remover
                </ConfirmAction>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Este condomínio ainda não tem síndico.
            </p>
          )}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{sindico ? "Trocar síndico" : "Cadastrar síndico"}</h3>
            <DefinirSindicoForm condominioId={c.id} temSindico={!!sindico} appUrl={appUrl} />
          </div>
          {anteriores.length > 0 ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">Síndicos anteriores</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {anteriores.map((v) => (
                  <li key={v.id}>
                    {v.user.name} <span className="text-muted-foreground">({v.user.email})</span>
                    {v.desativadoEm ? <span className="text-muted-foreground"> · até {formatarData(v.desativadoEm)}</span> : null}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </CardContent>
      </Card>

      {/* Espaços ------------------------------------------------------------ */}
      <Card id="espacos">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Espaços reserváveis</CardTitle>
            <CardDescription>Salão de festas, churrasqueira etc. Só o Admin Master cadastra.</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href={`/admin/condominios/${c.id}/espacos/novo`}>
              <Plus aria-hidden /> Novo espaço
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {c.espacos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum espaço cadastrado.</p>
          ) : (
            <ul className="divide-y divide-border">
              {c.espacos.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">
                      {e.nome}
                      {!e.ativo ? <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-normal">inativo</span> : null}
                    </p>
                    <p className="text-muted-foreground">
                      {e.modo === "DIA_INTEIRO" ? "Dia inteiro" : e.periodos.join(" / ")}
                      {e.capacidade ? ` · ${e.capacidade} pessoas` : ""}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="icon" aria-label={`Editar ${e.nome}`}>
                    <Link href={`/admin/condominios/${c.id}/espacos/${e.id}`}>
                      <Pencil aria-hidden />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Casas -------------------------------------------------------------- */}
      <Card id="casas">
        <CardHeader>
          <CardTitle className="text-base">Casas ({c.unidades.filter((u) => u.ativo).length} ativas)</CardTitle>
          <CardDescription>Renomeie uma casa editando o identificador. Moradores entram pelo link de convite (fase 3).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionForm action={adicionarCasasAction} resetOnSuccess className="flex items-end gap-2">
              <input type="hidden" name="condominioId" value={c.id} />
              <input type="hidden" name="modo" value="quantidade" />
              <input type="hidden" name="prefixo" value="Casa" />
              <Field id="qtd" label="Adicionar em sequência" className="flex-1">
                <Input id="qtd" name="quantidade" type="number" min={1} max={500} placeholder="Quantidade" required />
              </Field>
              <SubmitButton variant="outline" pendente="…">
                Adicionar
              </SubmitButton>
            </ActionForm>
            <ActionForm action={adicionarCasasAction} resetOnSuccess className="flex items-end gap-2">
              <input type="hidden" name="condominioId" value={c.id} />
              <input type="hidden" name="modo" value="individual" />
              <Field id="ident" label="Adicionar uma casa" className="flex-1">
                <Input id="ident" name="identificador" maxLength={40} placeholder="Ex.: Casa 7A" required />
              </Field>
              <SubmitButton variant="outline" pendente="…">
                Adicionar
              </SubmitButton>
            </ActionForm>
          </div>

          {c.unidades.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma casa cadastrada.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {c.unidades.map((u) => (
                <li key={u.id} className={u.ativo ? "p-3" : "bg-muted/50 p-3"}>
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionForm action={renomearCasaAction} className="flex min-w-0 flex-1 items-center gap-2">
                      <input type="hidden" name="condominioId" value={c.id} />
                      <input type="hidden" name="unidadeId" value={u.id} />
                      <Input
                        name="identificador"
                        defaultValue={u.identificador}
                        maxLength={40}
                        required
                        aria-label={`Identificador da ${u.identificador}`}
                        className="max-w-48"
                      />
                      <SubmitButton variant="ghost" size="sm" pendente="…">
                        Salvar
                      </SubmitButton>
                    </ActionForm>
                    <ConfirmAction
                      titulo={u.ativo ? `Desativar ${u.identificador}?` : `Ativar ${u.identificador}?`}
                      descricao={
                        u.ativo
                          ? "A casa deixa de aparecer no cadastro de moradores e nas reservas. O histórico é mantido."
                          : "A casa volta a aparecer no cadastro e nas reservas."
                      }
                      confirmar={u.ativo ? "Desativar" : "Ativar"}
                      destrutivo={u.ativo}
                      variant="ghost"
                      acao={definirCasaAtivaAction.bind(null, c.id, u.id, !u.ativo)}
                    >
                      {u.ativo ? "Desativar" : "Ativar"}
                    </ConfirmAction>
                  </div>
                  {u.vinculos.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-2 pl-1 text-sm">
                      {u.vinculos.map((v) => (
                        <li key={v.id} className="flex flex-wrap items-start justify-between gap-2">
                          <span>
                            {v.user.name}{" "}
                            <span className="text-muted-foreground">
                              · {v.tipo === "TITULAR" ? "titular" : "co-morador"}
                              {v.status === "PENDENTE" ? " · pendente" : ""}
                            </span>
                          </span>
                          {v.status === "ATIVO" ? (
                            <RedefinirSenhaButton condominioId={c.id} userId={v.user.id} nome={v.user.name} appUrl={appUrl} />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Dados -------------------------------------------------------------- */}
      <Card id="dados">
        <CardHeader>
          <CardTitle className="text-base">Dados do condomínio</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={atualizarCondominioAction} className="flex flex-col gap-4">
            <input type="hidden" name="condominioId" value={c.id} />
            <CondominioFields v={c} />
            <div>
              <SubmitButton>Salvar dados</SubmitButton>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      {/* Auditoria ---------------------------------------------------------- */}
      <Card id="auditoria">
        <CardHeader>
          <CardTitle className="text-base">Auditoria</CardTitle>
          <CardDescription>Últimas 30 ações registradas neste condomínio.</CardDescription>
        </CardHeader>
        <CardContent>
          {c.auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro.</p>
          ) : (
            <ol className="flex flex-col gap-2 text-sm">
              {c.auditLogs.map((a) => (
                <li key={a.id} className="flex flex-col sm:flex-row sm:gap-3">
                  <time className="shrink-0 text-muted-foreground sm:w-36">{formatarDataHora(a.createdAt)}</time>
                  <span>
                    <span className="font-medium">{a.user.name}</span> — {ACOES_AUDITORIA[a.acao] ?? a.acao}
                    {resumo(a.dados)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Complemento curto e seguro para a linha de auditoria (sem dados sensíveis). */
function resumo(dados: unknown) {
  if (!dados || typeof dados !== "object") return null;
  const d = dados as Record<string, unknown>;
  const nome = (o: unknown) => (o && typeof o === "object" && "nome" in o ? String((o as { nome: unknown }).nome) : null);
  const partes: string[] = [];
  if (typeof d.nome === "string") partes.push(d.nome);
  if (nome(d.novo)) partes.push(nome(d.anterior) ? `${nome(d.anterior)} → ${nome(d.novo)}` : nome(d.novo)!);
  if (typeof d.de === "string" && typeof d.para === "string") partes.push(`${d.de} → ${d.para}`);
  if (Array.isArray(d.identificadores)) {
    const ids = d.identificadores as string[];
    partes.push(ids.length > 3 ? `${ids[0]} … ${ids[ids.length - 1]} (${ids.length})` : ids.join(", "));
  }
  return partes.length ? <span className="text-muted-foreground"> ({partes.join("; ")})</span> : null;
}
