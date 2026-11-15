import { describe, expect, it } from "vitest";
import { can, type Acao, type Ator } from "@/lib/permissions";

const master: Ator = { userId: "m", isMaster: true, sindico: false, unidadeIds: [] };
const sindico: Ator = { userId: "s", isMaster: false, sindico: true, unidadeIds: [] };
const sindicoMorador: Ator = { userId: "sm", isMaster: false, sindico: true, unidadeIds: ["u1"] };
const morador: Ator = { userId: "a", isMaster: false, sindico: false, unidadeIds: ["u2"] };
const semVinculo: Ator = { userId: "x", isMaster: false, sindico: false, unidadeIds: [] };

describe("ações exclusivas do Admin Master", () => {
  const exclusivas: Acao[] = ["condominio.gerenciar", "unidade.gerenciar", "sindico.definir", "espaco.gerenciar"];
  it.each(exclusivas)("%s: só o master", (acao) => {
    expect(can(master, acao)).toBe(true);
    expect(can(sindico, acao)).toBe(false);
    expect(can(sindicoMorador, acao)).toBe(false);
    expect(can(morador, acao)).toBe(false);
  });
});

describe("gestão de moradores (master e síndico)", () => {
  const acoes: Acao[] = ["convite.gerenciar", "morador.aprovar", "transferencia.aprovar", "morador.desativar", "auditoria.ver"];
  it.each(acoes)("%s", (acao) => {
    expect(can(master, acao)).toBe(true);
    expect(can(sindico, acao)).toBe(true);
    expect(can(morador, acao)).toBe(false);
  });
});

describe("conteúdo: só o síndico produz, todos leem", () => {
  it.each(["comunicado", "documento", "despesa"] as const)("%s", (m) => {
    expect(can(sindico, `${m}.gerenciar`)).toBe(true);
    expect(can(master, `${m}.gerenciar`)).toBe(false);
    expect(can(morador, `${m}.gerenciar`)).toBe(false);
    for (const ator of [master, sindico, morador]) expect(can(ator, `${m}.ler`)).toBe(true);
    expect(can(semVinculo, `${m}.ler`)).toBe(false);
  });
});

describe("cadastro das casas", () => {
  it("morador vê só a própria casa", () => {
    expect(can(morador, "unidade.verCadastro", { unidadeId: "u2" })).toBe(true);
    expect(can(morador, "unidade.verCadastro", { unidadeId: "u9" })).toBe(false);
    expect(can(morador, "unidade.verCadastro")).toBe(false);
  });
  it("síndico e master veem todas", () => {
    expect(can(sindico, "unidade.verCadastro", { unidadeId: "u9" })).toBe(true);
    expect(can(master, "unidade.verCadastro")).toBe(true);
  });
});

describe("reservas", () => {
  it("master não cria reservas", () => {
    expect(can(master, "reserva.criar", { unidadeId: "u1" })).toBe(false);
  });
  it("síndico cria para qualquer casa", () => {
    expect(can(sindico, "reserva.criar", { unidadeId: "u9" })).toBe(true);
  });
  it("morador cria só para a própria casa", () => {
    expect(can(morador, "reserva.criar", { unidadeId: "u2" })).toBe(true);
    expect(can(morador, "reserva.criar", { unidadeId: "u1" })).toBe(false);
  });
  it("síndico exclui qualquer reserva", () => {
    expect(can(sindico, "reserva.excluir", { criadoPorId: "outro", passada: true })).toBe(true);
  });
  it("morador exclui só as próprias e futuras", () => {
    expect(can(morador, "reserva.excluir", { criadoPorId: "a", passada: false })).toBe(true);
    expect(can(morador, "reserva.excluir", { criadoPorId: "outro", passada: false })).toBe(false);
    expect(can(morador, "reserva.excluir", { criadoPorId: "a", passada: true })).toBe(false);
    expect(can(morador, "reserva.excluir", { criadoPorId: "a" })).toBe(false);
  });
  it("master não exclui reservas", () => {
    expect(can(master, "reserva.excluir", { criadoPorId: "m", passada: false })).toBe(false);
  });
  it("todos com acesso veem o calendário", () => {
    for (const ator of [master, sindico, morador]) expect(can(ator, "reserva.ver")).toBe(true);
    expect(can(semVinculo, "reserva.ver")).toBe(false);
  });
});
