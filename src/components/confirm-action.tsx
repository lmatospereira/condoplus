"use client";

import { AlertDialog } from "radix-ui";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ResultadoAcao } from "@/lib/acao";

/** Botão que pede confirmação antes de executar uma ação (excluir, desativar, trocar…). */
export function ConfirmAction<T = undefined>({
  titulo,
  descricao,
  confirmar = "Confirmar",
  variant = "outline",
  destrutivo = false,
  size = "sm",
  acao,
  onSuccess,
  children,
}: {
  titulo: string;
  descricao: string;
  confirmar?: string;
  variant?: "outline" | "ghost" | "destructive" | "secondary" | "default";
  destrutivo?: boolean;
  size?: "sm" | "default" | "icon";
  acao: () => Promise<ResultadoAcao<T>>;
  onSuccess?: (dados: T | undefined) => void;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();

  function executar() {
    startTransition(async () => {
      const r = await acao();
      if (r.ok) {
        if (r.mensagem) toast.success(r.mensagem);
        setAberto(false);
        onSuccess?.(r.dados);
      } else {
        toast.error(r.erro);
      }
    });
  }

  return (
    <AlertDialog.Root open={aberto} onOpenChange={setAberto}>
      <AlertDialog.Trigger asChild>
        <Button variant={variant} size={size} type="button">
          {children}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5 shadow-lg">
          <AlertDialog.Title className="text-lg font-semibold">{titulo}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">{descricao}</AlertDialog.Description>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={pending}>
                Cancelar
              </Button>
            </AlertDialog.Cancel>
            <Button variant={destrutivo ? "destructive" : "default"} onClick={executar} disabled={pending}>
              {pending ? "Aguarde…" : confirmar}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
