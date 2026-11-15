import type { Metadata } from "next";
import Link from "next/link";
import { criarCondominioAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CondominioFields } from "../condominio-fields";

export const metadata: Metadata = { title: "Novo condomínio" };

export default function NovoCondominioPage() {
  return (
    <>
      <PageHeader titulo="Novo condomínio" descricao="Depois de criar, você cadastra os espaços e o síndico." />
      <ActionForm action={criarCondominioAction} className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <CondominioFields />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Casas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="quantidadeCasas" label="Quantidade" dica="Ex.: 18 gera Casa 01 a Casa 18. Dá para renomear cada uma depois.">
              <Input id="quantidadeCasas" name="quantidadeCasas" type="number" min={0} max={500} required defaultValue={18} />
            </Field>
            <Field id="prefixoCasa" label="Prefixo">
              <Input id="prefixoCasa" name="prefixoCasa" maxLength={30} defaultValue="Casa" />
            </Field>
          </CardContent>
        </Card>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <Link href="/admin">Cancelar</Link>
          </Button>
          <SubmitButton pendente="Criando…">Criar condomínio</SubmitButton>
            </div>
      </ActionForm>
    </>
  );
}
