/** Datas sem horário (@db.Date) no fuso America/Sao_Paulo (a VPS roda em UTC). */
const FUSO = "America/Sao_Paulo";

/** "Hoje" em São Paulo como Date à meia-noite UTC (o formato que o Prisma usa para @db.Date). */
export function hojeSP(agora: Date = new Date()): Date {
  const [a, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(agora)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

/** "AAAA-MM-DD" → Date à meia-noite UTC; null se inválida. */
export function parseDataISO(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const d = new Date(`${valor}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== valor ? null : d;
}

export function dataISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** dd/mm/aaaa de uma data sem horário. */
export function formatarData(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

/** dd/mm/aaaa hh:mm de um instante, no fuso de São Paulo. */
export function formatarDataHora(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" }).format(d);
}
