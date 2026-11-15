import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UFS } from "@/lib/schemas/admin";

type Valores = { nome?: string; endereco?: string; cidade?: string; uf?: string; cnpj?: string | null };

export function CondominioFields({ v = {} }: { v?: Valores }) {
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field id="nome" label="Nome" className="sm:col-span-6">
        <Input id="nome" name="nome" required maxLength={120} defaultValue={v.nome} />
      </Field>
      <Field id="endereco" label="Endereço" className="sm:col-span-6">
        <Input id="endereco" name="endereco" required maxLength={200} defaultValue={v.endereco} />
      </Field>
      <Field id="cidade" label="Cidade" className="sm:col-span-4">
        <Input id="cidade" name="cidade" required maxLength={100} defaultValue={v.cidade} />
      </Field>
      <Field id="uf" label="UF" className="sm:col-span-2">
        <Select id="uf" name="uf" required defaultValue={v.uf ?? ""}>
          <option value="" disabled>
            UF
          </option>
          {UFS.map((uf) => (
            <option key={uf}>{uf}</option>
          ))}
        </Select>
      </Field>
      <Field id="cnpj" label="CNPJ (opcional)" className="sm:col-span-6">
        <Input id="cnpj" name="cnpj" inputMode="numeric" maxLength={18} placeholder="00.000.000/0000-00" defaultValue={v.cnpj ?? ""} />
      </Field>
    </div>
  );
}
