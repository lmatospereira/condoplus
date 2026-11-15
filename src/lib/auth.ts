import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Não existe cadastro aberto: contas nascem por convite (fase 3) ou pelo master (fase 2).
    disableSignUp: true,
    minPasswordLength: 8,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      telefone: { type: "string", required: false, input: false },
      isMaster: { type: "boolean", required: false, defaultValue: false, input: false },
      ativo: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24, // renova uma vez por dia
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 5 },
    },
  },
  advanced: {
    // O Caddy fica na frente e define X-Forwarded-For com o IP real do cliente.
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    useSecureCookies: baseURL.startsWith("https://"),
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
