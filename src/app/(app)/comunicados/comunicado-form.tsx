import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIAS_COMUNICADO } from "@/server/comunicados";
import { salvarComunicadoAction } from "./actions";

type Valores = { id: string; titulo: string; conteudo: string; categoria: keyof typeof CATEGORIAS_COMUNICADO; importante: boolean; fixado: boolean };

export function ComunicadoForm({ c }: { c?: Valores }) {
  return (
    <ActionForm action={salvarComunicadoAction} className="flex flex-col gap-4">
      {c ? <input type="hidden" name="id" value={c.id} /> : null}
      <Field id="titulo" label="Título">
        <Input id="titulo" name="titulo" required minLength={3} maxLength={150} defaultValue={c?.titulo} />
      </Field>
      <Field id="categoria" label="Categoria">
        <Select id="categoria" name="categoria" defaultValue={c?.categoria ?? "GERAL"}>
          {Object.entries(CATEGORIAS_COMUNICADO).map(([v, rotulo]) => (
            <option key={v} value={v}>
              {rotulo}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="conteudo" label="Texto" dica="Aceita **negrito**, *itálico*, listas com “- ” e links. Linha em branco separa parágrafos.">
        <Textarea id="conteudo" name="conteudo" required maxLength={20000} className="min-h-48" defaultValue={c?.conteudo} />
      </Field>
      <div className="flex flex-col gap-1">
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="importante" defaultChecked={c?.importante} className="size-5 accent-primary" />
          Marcar como importante
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="fixado" defaultChecked={c?.fixado} className="size-5 accent-primary" />
          Fixar no topo
        </label>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="outline">
          <Link href={c ? `/comunicados/${c.id}` : "/comunicados"}>Cancelar</Link>
        </Button>
        <SubmitButton pendente="Publicando…">{c ? "Salvar alterações" : "Publicar"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
