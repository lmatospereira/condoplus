import { describe, expect, it } from "vitest";
import { dataISO, formatarData, hojeSP, parseDataISO } from "@/lib/datas";
import { gerarSenhaProvisoria } from "@/lib/senha";

describe("hojeSP (fuso America/Sao_Paulo, servidor em UTC)", () => {
  it("às 01h UTC ainda é o dia anterior em São Paulo", () => {
    expect(dataISO(hojeSP(new Date("2026-11-16T01:00:00Z")))).toBe("2026-11-15");
  });
  it("às 03h UTC já é o mesmo dia", () => {
    expect(dataISO(hojeSP(new Date("2026-11-16T03:00:00Z")))).toBe("2026-11-16");
  });
});

describe("parseDataISO / formatarData", () => {
  it("aceita datas válidas e recusa inválidas", () => {
    expect(parseDataISO("2026-02-28")?.toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(parseDataISO("2026-02-30")).toBeNull();
    expect(parseDataISO("28/02/2026")).toBeNull();
  });
  it("formata dd/mm/aaaa sem deslocar o dia", () => {
    expect(formatarData(new Date("2026-01-01T00:00:00Z"))).toBe("01/01/2026");
  });
});

describe("gerarSenhaProvisoria", () => {
  it("tem o formato esperado, sem caracteres ambíguos, e varia", () => {
    const s = gerarSenhaProvisoria();
    expect(s).toMatch(/^[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}$/);
    expect(s).not.toMatch(/[01lIoO]/);
    expect(gerarSenhaProvisoria()).not.toBe(s);
  });
});
