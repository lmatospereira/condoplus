"use client";

import { useState } from "react";
import { pedirMudancaAction } from "@/app/(app)/moradores/actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

type Unidade = { id: string; identificador: string; temTitular: boolean };

export function MudancaCasaForm({ unidades }: { unidades: Unidade[] }) {
  const [unidadeId, setUnidadeId] = useState("");
  const temTitular = unidades.find((u) => u.id === unidadeId)?.temTitular ?? false;
  return (
    <ActionForm action={pedirMudancaAction} className="flex flex-col gap-3">
      <Field id="nova-casa" label="Nova casa">
        <Select id="nova-casa" name="unidadeId" required value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)}>
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
        <fieldset className="flex flex-col gap-1 rounded-md border border-border p-3 text-sm">
          <legend className="px-1 font-medium">A casa já tem titular.</legend>
          <label className="flex min-h-11 items-center gap-3">
            <input type="radio" name="situacao" value="comorador" required className="size-5 accent-primary" /> Vou morar junto com o titular
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="radio" name="situacao" value="transferencia" required className="size-5 accent-primary" /> A casa mudou de morador
          </label>
        </fieldset>
      ) : (
        <input type="hidden" name="situacao" value="titular" />
      )}
      <div>
        <SubmitButton variant="outline" pendente="Enviando…">
          Pedir mudança ao síndico
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
