import "server-only";
import type { z } from "zod";
import type { ResultadoAcao } from "@/lib/acao";
import { ErroNegocio } from "@/lib/erros";
import { PermissaoNegada } from "@/lib/permissions";

/** Valida um FormData com Zod; erro vira ErroNegocio com a primeira mensagem. */
export function validar<S extends z.ZodType>(schema: S, fd: FormData): z.infer<S> {
  const r = schema.safeParse(Object.fromEntries(fd));
  if (!r.success) throw new ErroNegocio(r.error.issues[0]?.message ?? "Dados inválidos");
  return r.data;
}

/** Executa a ação traduzindo erros conhecidos em mensagens amigáveis. */
export async function executar<T = undefined>(fn: () => Promise<ResultadoAcao<T>>): Promise<ResultadoAcao<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ErroNegocio) return { ok: false, erro: e.message };
    if (e instanceof PermissaoNegada) return { ok: false, erro: "Você não tem permissão para esta ação." };
    // redirect()/notFound() do Next lançam erros especiais que precisam subir.
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[acao] erro inesperado:", e);
    return { ok: false, erro: "Não foi possível concluir. Tente novamente." };
  }
}
