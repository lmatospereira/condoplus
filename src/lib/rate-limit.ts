import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/** IP real do cliente (o Caddy define X-Forwarded-For). */
export async function ipCliente() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
}

/**
 * Janela fixa no Postgres (tabela `rate_limit`, a mesma do Better Auth, com chave
 * prefixada). Retorna false quando o limite estourou. Sem Redis: instância única.
 */
export async function permitir(chave: string, max: number, janelaSeg: number) {
  const key = `app:${chave}`;
  const agora = Date.now();
  const atual = await prisma.rateLimit.findUnique({ where: { key } });
  if (!atual || agora - Number(atual.lastRequest) > janelaSeg * 1000) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { id: randomUUID(), key, count: 1, lastRequest: BigInt(agora) },
      update: { count: 1, lastRequest: BigInt(agora) },
    });
    return true;
  }
  if (atual.count >= max) return false;
  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
