import { afterEach, describe, expect, it } from "vitest";
import { chaveMasterValida } from "@/lib/master-login";

const original = process.env.MASTER_LOGIN_PATH;
afterEach(() => {
  process.env.MASTER_LOGIN_PATH = original;
});

describe("login escondido do master", () => {
  it("aceita só a chave exata", () => {
    process.env.MASTER_LOGIN_PATH = "abc123-segredo";
    expect(chaveMasterValida("abc123-segredo")).toBe(true);
    expect(chaveMasterValida("abc123-segred")).toBe(false);
    expect(chaveMasterValida("ABC123-SEGREDO")).toBe(false);
    expect(chaveMasterValida(undefined)).toBe(false);
  });
  it("sem MASTER_LOGIN_PATH o login de master fica desligado", () => {
    delete process.env.MASTER_LOGIN_PATH;
    expect(chaveMasterValida("")).toBe(false);
    expect(chaveMasterValida("qualquer")).toBe(false);
  });
});
