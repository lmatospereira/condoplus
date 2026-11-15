/** Erro de regra de negócio com mensagem amigável, exibida ao usuário. */
export class ErroNegocio extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroNegocio";
  }
}

/** Código P2002 do Prisma (violação de unicidade). */
export function ehViolacaoUnica(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}
