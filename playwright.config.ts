import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra um servidor já rodando com o seed de desenvolvimento:
 *   npm run build && BETTER_AUTH_URL=http://localhost:3100 APP_URL=http://localhost:3100 npx next start -p 3100
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" } }],
});
