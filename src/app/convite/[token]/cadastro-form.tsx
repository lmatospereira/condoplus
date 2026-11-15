"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ResultadoAcao } from "@/lib/acao";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cadastrarAction } from "./actions";

type Unidade = { id: string; identificador: string; temTitular: boolean };

export function CadastroForm({ token, unidades }: { token: string; unidades: Unidade[] }) {
  const [state, action] = useActionState<ResultadoAcao | null, FormData>(cadastrarAction, null);
  const [unidadeId, setUnidadeId] = useState("");
  const temTitular = unidades.find((u) => u.id === unidadeId)?.temTitular ?? false;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Field id="nome" label="Nome completo">
        <Input id="nome" name="nome" autoComplete="name" required minLength={3} maxLength={120} />
      </Field>
      <Field id="email" label="E-mail" dica="Será o seu login.">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="telefone" label="Telefone (opcional)">
        <Input id="telefone" name="telefone" type="tel" autoComplete="tel" maxLength={20} />
      </Field>
      <Field id="senha" label="Senha" dica="Mínimo de 8 caracteres. Se você já tem conta na Zelora, use a senha dela.">
        <Input id="senha" name="senha" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field id="unidadeId" label="Sua casa">
        <Select id="unidadeId" name="unidadeId" required value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)}>
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

      {temTitular ? (
        <fieldset className="flex flex-col gap-2 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium">Esta casa já tem um titular cadastrado.</legend>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="radio" name="situacao" value="comorador" required className="size-5 accent-primary" />
            Vou morar junto com o titular atual
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="radio" name="situacao" value="transferencia" required className="size-5 accent-primary" />
            A casa mudou de morador (venda ou locação)
          </label>
        </fieldset>
      ) : (
        <input type="hidden" name="situacao" value="titular" />
      )}

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="aceite" required className="mt-0.5 size-5 shrink-0 accent-primary" />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="text-primary underline underline-offset-4">
            termos de uso e privacidade
          </Link>
          .
        </span>
      </label>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.erro}
        </p>
      ) : null}
      <SubmitButton pendente="Enviando…" className="w-full">
        Enviar cadastro
      </SubmitButton>
    </form>
  );
}
