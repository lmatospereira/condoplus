/** Resultado padrão das server actions de formulário (exibido como toast). */
export type ResultadoAcao<T = undefined> =
  | { ok: true; mensagem?: string; dados?: T }
  | { ok: false; erro: string };
