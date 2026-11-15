import { expect, test, type Page } from "@playwright/test";

/**
 * Fase 2 sem e-mail: o master cria o condomínio, cadastra o síndico com senha
 * provisória, o síndico troca a senha no primeiro acesso, e a troca de síndico
 * tira o acesso do anterior.
 */
const id = Date.now().toString(36);
const nomeCond = `E2E ${id}`;
const emailSindico = `sindico-${id}@e2e.local`;
const emailNovo = `novo-${id}@e2e.local`;

async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function sair(page: Page) {
  await page.context().clearCookies();
}

test("master cadastra condomínio, espaço e síndico; síndico define a senha", async ({ page }) => {
  await entrar(page, "master@condoplus.local", "master123456");
  await expect(page).toHaveURL(/\/admin$/);

  // Novo condomínio com 5 casas
  await page.getByRole("link", { name: "Novo condomínio" }).click();
  await page.getByLabel("Nome").fill(nomeCond);
  await page.getByLabel("Endereço").fill("Rua dos Testes, 1");
  await page.getByLabel("Cidade").fill("Campinas");
  await page.getByLabel("UF").selectOption("SP");
  await page.getByLabel("Quantidade").fill("5");
  await page.getByRole("button", { name: "Criar condomínio" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nomeCond })).toBeVisible();
  await expect(page.getByLabel("Identificador da Casa 05")).toBeVisible();

  // Renomear casa
  const casa1 = page.getByLabel("Identificador da Casa 01");
  await casa1.fill("Casa 1A");
  await casa1.locator("xpath=..").getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Casa atualizada.")).toBeVisible();
  await expect(page.getByLabel("Identificador da Casa 1A")).toBeVisible();

  // Espaço
  await page.getByRole("link", { name: "Novo espaço" }).click();
  await expect(page).toHaveURL(/\/espacos\/novo$/);
  await page.getByLabel("Nome").fill("Salão E2E");
  await page.getByLabel("Capacidade (pessoas)").fill("40");
  await page.getByRole("button", { name: "Cadastrar espaço" }).click();
  await expect(page).toHaveURL(/\/admin\/condominios\/[^/]+$/);
  await expect(page.locator("#espacos").getByText("Salão E2E")).toBeVisible();
  await expect(page.getByText("Dia inteiro · 40 pessoas")).toBeVisible();

  // Síndico com senha provisória
  await page.locator("#sindico-nome").fill("Síndico E2E");
  await page.locator("#sindico-email").fill(emailSindico);
  await page.getByRole("button", { name: "Cadastrar síndico" }).click();
  const caixa = page.getByRole("status").filter({ hasText: "Senha provisória de Síndico E2E" });
  await expect(caixa).toBeVisible();
  const senhaProvisoria = (await caixa.locator("dd.font-mono").innerText()).trim();
  expect(senhaProvisoria).toMatch(/^\w{4}-\w{4}-\w{4}$/);

  // Primeiro acesso do síndico: troca obrigatória
  await sair(page);
  await entrar(page, emailSindico, senhaProvisoria);
  await expect(page).toHaveURL(/\/trocar-senha$/);
  await page.getByLabel("Senha provisória").fill(senhaProvisoria);
  await page.getByLabel("Nova senha", { exact: true }).fill("minhasenha123");
  await page.getByLabel("Confirme a nova senha").fill("minhasenha123");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByRole("heading", { name: "Olá, Síndico" })).toBeVisible();
  await expect(page.getByText("Síndico", { exact: true }).first()).toBeVisible();

  // Master troca o síndico; o anterior perde o acesso
  await sair(page);
  await entrar(page, "master@condoplus.local", "master123456");
  await page.getByRole("link", { name: new RegExp(nomeCond) }).click();
  await expect(page.getByRole("heading", { level: 1, name: nomeCond })).toBeVisible();
  await page.locator("#sindico-nome").fill("Novo Síndico");
  await page.locator("#sindico-email").fill(emailNovo);
  await page.getByRole("button", { name: "Trocar síndico" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Senha provisória de Novo Síndico" })).toBeVisible();
  await expect(page.getByText("Síndicos anteriores")).toBeVisible();

  await sair(page);
  await entrar(page, emailSindico, "minhasenha123");
  await expect(page).toHaveURL(/\/sem-acesso$/);
});
