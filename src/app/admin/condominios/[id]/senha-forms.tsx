"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import { definirSindicoAction, redefinirSenhaAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/action-form";
import { ConfirmAction } from "@/components/confirm-action";
import { SenhaProvisoria } from "@/components/senha-provisoria";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Senha = { nome: string; email: string; senhaProvisoria: string | null };

export function DefinirSindicoForm({ condominioId, temSindico, appUrl }: { condominioId: string; temSindico: boolean; appUrl: string }) {
  const [resultado, setResultado] = useState<Senha | null>(null);
  return (
    <div className="flex flex-col gap-4">
      {resultado?.senhaProvisoria ? (
        <SenhaProvisoria nome={resultado.nome} email={resultado.email} senha={resultado.senhaProvisoria} url={appUrl} />
      ) : null}
      <ActionForm action={definirSindicoAction} resetOnSuccess onSuccess={(d) => setResultado(d ?? null)} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="condominioId" value={condominioId} />
        <Field id="sindico-nome" label="Nome" className="sm:col-span-2">
          <Input id="sindico-nome" name="nome" required maxLength={120} autoComplete="off" />
        </Field>
        <Field id="sindico-email" label="E-mail (login)" dica="Se já existir uma conta com este e-mail, ela é vinculada e mantém a senha.">
          <Input id="sindico-email" name="email" type="email" required autoComplete="off" />
        </Field>
        <Field id="sindico-telefone" label="Telefone (opcional)">
          <Input id="sindico-telefone" name="telefone" type="tel" maxLength={20} autoComplete="off" />
        </Field>
        <div className="sm:col-span-2">
          <SubmitButton pendente="Salvando…">{temSindico ? "Trocar síndico" : "Cadastrar síndico"}</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}

export function RedefinirSenhaButton({ condominioId, userId, nome, appUrl }: { condominioId: string; userId: string; nome: string; appUrl: string }) {
  const [resultado, setResultado] = useState<Senha | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <ConfirmAction<Senha>
          titulo={`Redefinir a senha de ${nome}?`}
          descricao="Uma senha provisória nova será gerada, as sessões abertas dessa pessoa serão encerradas e ela terá de definir uma senha nova no próximo acesso."
          confirmar="Gerar senha provisória"
          acao={redefinirSenhaAction.bind(null, condominioId, userId)}
          onSuccess={(d) => setResultado(d ?? null)}
        >
          <KeyRound aria-hidden /> Redefinir senha
        </ConfirmAction>
      </div>
      {resultado?.senhaProvisoria ? (
        <SenhaProvisoria nome={resultado.nome} email={resultado.email} senha={resultado.senhaProvisoria} url={appUrl} />
      ) : null}
    </div>
  );
}
