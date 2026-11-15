import { randomInt, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

// Sem caracteres ambíguos (0/O, 1/l/I), fácil de ditar por telefone ou WhatsApp.
const ALFABETO = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Senha provisória legível: 3 blocos de 4 (ex.: "k7Pq-xM3a-9vTz"), ~70 bits. */
export function gerarSenhaProvisoria() {
  const bloco = () => Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  return `${bloco()}-${bloco()}-${bloco()}`;
}

/**
 * Grava a senha (credencial e-mail/senha do Better Auth) de um usuário.
 * `provisoria` obriga a troca no próximo acesso; `encerrarSessoes` derruba os logins atuais.
 */
export async function definirSenha(
  db: Db,
  userId: string,
  senha: string,
  { provisoria, encerrarSessoes }: { provisoria: boolean; encerrarSessoes: boolean },
) {
  const hash = await hashPassword(senha);
  const conta = await db.account.findFirst({ where: { userId, providerId: "credential" }, select: { id: true } });
  if (conta) {
    await db.account.update({ where: { id: conta.id }, data: { password: hash } });
  } else {
    await db.account.create({ data: { id: randomUUID(), userId, accountId: userId, providerId: "credential", password: hash } });
  }
  await db.user.update({ where: { id: userId }, data: { trocarSenha: provisoria } });
  if (encerrarSessoes) await db.session.deleteMany({ where: { userId } });
}
