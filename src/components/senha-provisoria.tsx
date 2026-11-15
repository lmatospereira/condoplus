"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Mostra uma senha provisória UMA vez, com botão de copiar a mensagem pronta para enviar. */
export function SenhaProvisoria({ nome, email, senha, url }: { nome: string; email: string; senha: string; url: string }) {
  const [copiado, setCopiado] = useState(false);
  const mensagem = `Olá, ${nome.split(" ")[0]}! Seu acesso à Zelora:\n${url}\nE-mail: ${email}\nSenha provisória: ${senha}\nNo primeiro acesso você vai definir uma senha nova.`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div role="status" className="rounded-lg border border-success/40 bg-success/5 p-4 text-sm">
      <p className="font-medium">Senha provisória de {nome}</p>
      <p className="mt-1 text-muted-foreground">Ela aparece só agora. Repasse ao usuário; no primeiro acesso ele define uma senha nova.</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">E-mail</dt>
        <dd className="break-all">{email}</dd>
        <dt className="text-muted-foreground">Senha</dt>
        <dd className="font-mono text-base tracking-wide">{senha}</dd>
      </dl>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={copiar}>
        {copiado ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copiado ? "Copiado" : "Copiar mensagem para enviar"}
      </Button>
    </div>
  );
}
