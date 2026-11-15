import { expect, test, type Page } from "@playwright/test";

/**
 * Fluxo do morador (seed de desenvolvimento): cadastro pelo convite → pendente →
 * síndico aprova → morador reserva o salão → síndico publica comunicado →
 * morador vê como não lido e lê.
 */
const id = Date.now().toString(36);
const email = `morador-${id}@e2e.local`;
const CONVITE_SEED = "convite-exemplo-dev-0000000000000000";

async function entrar(page: Page, e: string, senha: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(e);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test("morador se cadastra pelo convite, é aprovado, reserva e lê comunicado", async ({ page }) => {
  // 1. Cadastro pelo link
  await page.goto(`/convite/${CONVITE_SEED}`);
  await expect(page.getByText("Residencial Exemplo")).toBeVisible();
  await page.getByLabel("Nome completo").fill("Morador E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-e2e-123");
  await page.getByLabel("Sua casa").selectOption({ label: "Casa 16" });
  // Se uma execução anterior já deixou titular na casa, entra como co-morador.
  const jaTemTitular = page.getByLabel("Vou morar junto com o titular atual");
  if (await jaTemTitular.isVisible()) await jaTemTitular.check();
  await page.getByLabel(/Li e aceito/).check();
  await page.getByRole("button", { name: "Enviar cadastro" }).click();
  await expect(page).toHaveURL(/\/aguardando$/);
  await expect(page.getByText("Casa 16")).toBeVisible();

  // 2. Síndico aprova
  await entrar(page, "sindico@exemplo.com", "senha12345");
  await page.goto("/moradores");
  const pedido = page.locator("#pendencias li").filter({ hasText: "Morador E2E" });
  await pedido.getByRole("button", { name: "Aprovar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByText("Cadastro aprovado.")).toBeVisible();
  await expect(page.locator("#pendencias").getByText("Morador E2E")).toHaveCount(0);

  // 3. Morador reserva o primeiro dia livre do próximo mês
  await entrar(page, email, "senha-e2e-123");
  await expect(page.getByRole("heading", { name: "Olá, Morador" })).toBeVisible();
  await page.goto("/reservas");
  await page.getByRole("link", { name: "Próximo mês" }).click();
  await page.getByRole("link", { name: /livre\. Reservar/ }).first().click();
  await expect(page.getByRole("heading", { name: "Confirmar reserva" })).toBeVisible();
  await expect(page.getByText("Reserva para a Casa 16.")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Reserva confirmada" })).toBeVisible();
  await expect(page.getByText("Casa 16").first()).toBeVisible();

  // 4. Síndico publica comunicado
  await entrar(page, "sindico@exemplo.com", "senha12345");
  await page.goto("/comunicados/novo");
  await page.getByLabel("Título").fill(`Aviso E2E ${id}`);
  await page.getByLabel("Texto").fill("Olá a todos!\n\n- item **um**\n- item dois");
  await page.getByLabel("Marcar como importante").check();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Aviso E2E ${id}` })).toBeVisible();
  await expect(page.locator("strong", { hasText: "um" })).toBeVisible();

  // 5. Morador vê não lido e lê
  await entrar(page, email, "senha-e2e-123");
  await page.goto("/comunicados");
  const card = page.getByRole("link", { name: new RegExp(`Aviso E2E ${id}`) });
  await expect(card.getByText("Não lido")).toBeVisible();
  await card.click();
  await expect(page.getByRole("heading", { level: 1, name: `Aviso E2E ${id}` })).toBeVisible();
  await page.goto("/comunicados");
  await expect(page.getByRole("link", { name: new RegExp(`Aviso E2E ${id}`) }).getByText("Não lido")).toHaveCount(0);
});
