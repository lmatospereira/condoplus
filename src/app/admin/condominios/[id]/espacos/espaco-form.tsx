import Link from "next/link";
import { salvarEspacoAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dataISO } from "@/lib/datas";

type Espaco = {
  id: string;
  nome: string;
  capacidade: number | null;
  regras: string | null;
  ativo: boolean;
  modo: "DIA_INTEIRO" | "PERIODOS";
  periodos: string[];
  antecedenciaMinDias: number | null;
  antecedenciaMaxDias: number | null;
  limiteMensalPorUnidade: number | null;
  diasBloqueados: Date[];
};

export function EspacoForm({ condominioId, espaco }: { condominioId: string; espaco?: Espaco }) {
  const e = espaco;
  return (
    <ActionForm action={salvarEspacoAction} className="flex flex-col gap-5">
      <input type="hidden" name="condominioId" value={condominioId} />
      {e ? <input type="hidden" name="espacoId" value={e.id} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Espaço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="nome" label="Nome" className="sm:col-span-2">
            <Input id="nome" name="nome" required maxLength={80} placeholder="Ex.: Salão de festas" defaultValue={e?.nome} />
          </Field>
          <Field id="capacidade" label="Capacidade (pessoas)">
            <Input id="capacidade" name="capacidade" type="number" min={0} defaultValue={e?.capacidade ?? ""} />
          </Field>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm font-medium">
            <input type="checkbox" name="ativo" defaultChecked={e?.ativo ?? true} className="size-5 accent-primary" />
            Ativo (disponível para reserva)
          </label>
          <Field id="regras" label="Regras de uso" dica="Exibidas para o morador na hora de reservar." className="sm:col-span-2">
            <Textarea id="regras" name="regras" maxLength={5000} defaultValue={e?.regras ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modo de reserva</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="modo" label="Modo" dica="Não pode mudar enquanto houver reservas futuras.">
            <Select id="modo" name="modo" defaultValue={e?.modo ?? "DIA_INTEIRO"}>
              <option value="DIA_INTEIRO">Dia inteiro</option>
              <option value="PERIODOS">Períodos nomeados</option>
            </Select>
          </Field>
          <Field id="periodos" label="Períodos" dica="Só no modo “Períodos”. Um por linha ou separados por vírgula (ex.: Manhã, Tarde, Noite).">
            <Textarea id="periodos" name="periodos" className="min-h-20" defaultValue={e?.periodos.join("\n") ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regras opcionais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field id="antecedenciaMinDias" label="Antecedência mínima (dias)">
            <Input id="antecedenciaMinDias" name="antecedenciaMinDias" type="number" min={0} defaultValue={e?.antecedenciaMinDias ?? ""} />
          </Field>
          <Field id="antecedenciaMaxDias" label="Antecedência máxima (dias)">
            <Input id="antecedenciaMaxDias" name="antecedenciaMaxDias" type="number" min={0} defaultValue={e?.antecedenciaMaxDias ?? ""} />
          </Field>
          <Field id="limiteMensalPorUnidade" label="Limite por casa/mês">
            <Input id="limiteMensalPorUnidade" name="limiteMensalPorUnidade" type="number" min={0} defaultValue={e?.limiteMensalPorUnidade ?? ""} />
          </Field>
          <Field id="diasBloqueados" label="Dias bloqueados" dica="Datas no formato AAAA-MM-DD, separadas por espaço ou vírgula." className="sm:col-span-3">
            <Textarea id="diasBloqueados" name="diasBloqueados" className="min-h-20" placeholder="2026-12-24, 2026-12-31" defaultValue={e?.diasBloqueados.map(dataISO).join(", ") ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="outline">
          <Link href={`/admin/condominios/${condominioId}#espacos`}>Cancelar</Link>
        </Button>
        <SubmitButton>{e ? "Salvar espaço" : "Cadastrar espaço"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
