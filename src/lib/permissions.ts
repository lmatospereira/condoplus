/**
 * Camada central de permissões (seção 4 da especificação).
 * Funções puras: recebem o "ator" já resolvido no servidor (getTenantContext) e
 * nunca dados vindos do cliente. A interface só esconde; quem decide é `can`.
 */

export type Ator = {
  userId: string;
  isMaster: boolean;
  /** Tem vínculo SINDICO ATIVO no condomínio ativo. */
  sindico: boolean;
  /** Unidades onde tem vínculo MORADOR ATIVO no condomínio ativo. */
  unidadeIds: string[];
};

export type Acao =
  | "condominio.gerenciar"
  | "unidade.gerenciar"
  | "unidade.verCadastro"
  | "sindico.definir"
  | "espaco.gerenciar"
  | "convite.gerenciar"
  | "morador.aprovar"
  | "transferencia.aprovar"
  | "morador.desativar"
  | "comunicado.gerenciar"
  | "comunicado.ler"
  | "documento.gerenciar"
  | "documento.ler"
  | "despesa.gerenciar"
  | "despesa.ler"
  | "reserva.ver"
  | "reserva.criar"
  | "reserva.excluir"
  | "auditoria.ver";

export type Recurso = {
  /** reserva.criar / unidade.verCadastro: a unidade alvo */
  unidadeId?: string;
  /** reserva.excluir: quem criou a reserva */
  criadoPorId?: string;
  /** reserva.excluir: a data da reserva já passou (fuso America/Sao_Paulo) */
  passada?: boolean;
};

export function ehMorador(ator: Ator) {
  return ator.unidadeIds.length > 0;
}

/** Tem algum acesso ao conteúdo do condomínio (master, síndico ou morador ativo). */
export function temAcesso(ator: Ator) {
  return ator.isMaster || ator.sindico || ehMorador(ator);
}

export function can(ator: Ator, acao: Acao, recurso: Recurso = {}): boolean {
  switch (acao) {
    // Exclusivos do Admin Master
    case "condominio.gerenciar":
    case "unidade.gerenciar":
    case "sindico.definir":
    case "espaco.gerenciar":
      return ator.isMaster;

    case "unidade.verCadastro":
      if (ator.isMaster || ator.sindico) return true;
      return recurso.unidadeId !== undefined && ator.unidadeIds.includes(recurso.unidadeId);

    // Master e síndico
    case "convite.gerenciar":
    case "morador.aprovar":
    case "transferencia.aprovar":
    case "morador.desativar":
    case "auditoria.ver":
      return ator.isMaster || ator.sindico;

    // Somente o síndico produz conteúdo; o master apenas visualiza
    case "comunicado.gerenciar":
    case "documento.gerenciar":
    case "despesa.gerenciar":
      return ator.sindico;

    case "comunicado.ler":
    case "documento.ler":
    case "despesa.ler":
    case "reserva.ver":
      return temAcesso(ator);

    case "reserva.criar":
      if (ator.sindico) return true; // qualquer casa
      return recurso.unidadeId !== undefined && ator.unidadeIds.includes(recurso.unidadeId);

    case "reserva.excluir":
      if (ator.sindico) return true; // qualquer reserva
      if (!ehMorador(ator) || recurso.passada !== false) return false;
      return recurso.criadoPorId === ator.userId;
  }
}

export class PermissaoNegada extends Error {
  constructor(acao: Acao) {
    super(`Permissão negada: ${acao}`);
    this.name = "PermissaoNegada";
  }
}

export function assertCan(ator: Ator, acao: Acao, recurso?: Recurso) {
  if (!can(ator, acao, recurso)) throw new PermissaoNegada(acao);
}
