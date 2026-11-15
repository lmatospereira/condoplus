import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Garante que o Admin Master de MASTER_EMAIL exista (seção 5.1).
 * Cria a conta na primeira vez; depois não mexe na senha, para que trocas
 * feitas pelo próprio master não sejam desfeitas a cada reinício.
 */
export async function ensureMaster(prisma: PrismaClient) {
  const email = process.env.MASTER_EMAIL?.trim().toLowerCase();
  const senha = process.env.MASTER_PASSWORD;
  if (!email || !senha) {
    console.warn("[bootstrap] MASTER_EMAIL/MASTER_PASSWORD ausentes — master não criado.");
    return null;
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    if (!existente.isMaster) await prisma.user.update({ where: { id: existente.id }, data: { isMaster: true } });
    return existente.id;
  }

  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email,
      name: process.env.MASTER_NAME || "Admin Master",
      emailVerified: true,
      isMaster: true,
      accounts: {
        create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(senha) },
      },
    },
  });
  console.info("[bootstrap] Admin Master criado.");
  return id;
}
