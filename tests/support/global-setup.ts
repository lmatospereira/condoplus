import "dotenv/config";
import { execSync } from "node:child_process";

/**
 * Os testes de integração usam um banco separado (`<db>_test`) no mesmo Postgres.
 * TEST_DATABASE_URL tem prioridade; senão deriva de DATABASE_URL. Cada teste cria
 * e apaga os próprios dados.
 */
export default async function setup() {
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!base) throw new Error("Defina DATABASE_URL ou TEST_DATABASE_URL para rodar os testes.");
  const url = new URL(base);
  if (!process.env.TEST_DATABASE_URL) url.pathname = `${url.pathname}_test`;
  process.env.DATABASE_URL = url.toString();
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
}
