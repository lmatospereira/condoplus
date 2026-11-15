"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ResultadoAcao } from "@/lib/acao";

type Acao<T> = (prev: ResultadoAcao<T> | null, formData: FormData) => Promise<ResultadoAcao<T>>;

/**
 * Formulário ligado a uma server action: mostra toast de sucesso/erro e,
 * opcionalmente, limpa os campos após o sucesso.
 */
export function ActionForm<T>({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
}: {
  action: Acao<T>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: (dados: T | undefined) => void;
}) {
  const [state, formAction] = useActionState<ResultadoAcao<T> | null, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.mensagem) toast.success(state.mensagem);
      if (resetOnSuccess) ref.current?.reset();
      onSuccessRef.current?.(state.dados);
    } else {
      toast.error(state.erro);
    }
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
    </form>
  );
}
