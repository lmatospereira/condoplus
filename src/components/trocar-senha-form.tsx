import { trocarSenha } from "@/app/actions/senha";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function TrocarSenhaForm({ provisoria = false }: { provisoria?: boolean }) {
  return (
    <ActionForm action={trocarSenha} resetOnSuccess className="flex flex-col gap-4">
      <Field id="senhaAtual" label={provisoria ? "Senha provisória" : "Senha atual"}>
        <Input id="senhaAtual" name="senhaAtual" type="password" autoComplete="current-password" required />
      </Field>
      <Field id="novaSenha" label="Nova senha" dica="Mínimo de 8 caracteres.">
        <Input id="novaSenha" name="novaSenha" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field id="confirmacao" label="Confirme a nova senha">
        <Input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <SubmitButton className="w-full sm:w-auto">Salvar nova senha</SubmitButton>
    </ActionForm>
  );
}
