import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * O login do Admin Master fica numa URL escondida: /acesso/<MASTER_LOGIN_PATH>.
 * Sem a variável definida, o login de master fica desligado.
 * (Não é a única proteção: a senha e o rate limit continuam valendo.)
 */
export function chaveMasterValida(chave: string | undefined) {
  const esperada = process.env.MASTER_LOGIN_PATH;
  if (!esperada || !chave) return false;
  const a = Buffer.from(chave);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}
