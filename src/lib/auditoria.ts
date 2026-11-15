import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export type RegistroAuditoria = {
  condominioId?: string | null;
  userId: string;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  dados?: Prisma.InputJsonValue;
};

/** Grava no log de auditoria (seção 7). Nunca inclua senhas ou tokens em `dados`. */
export function registrarAuditoria(db: Db, r: RegistroAuditoria) {
  return db.auditLog.create({ data: { ...r, condominioId: r.condominioId ?? null, entidadeId: r.entidadeId ?? null } });
}

/** Rótulos legíveis das ações, para a tela de auditoria. */
export const ACOES_AUDITORIA: Record<string, string> = {
  "condominio.criar": "Criou o condomínio",
  "condominio.editar": "Editou os dados do condomínio",
  "condominio.ativar": "Ativou o condomínio",
  "condominio.desativar": "Desativou o condomínio",
  "unidade.criar": "Adicionou casas",
  "unidade.editar": "Editou uma casa",
  "unidade.ativar": "Ativou uma casa",
  "unidade.desativar": "Desativou uma casa",
  "espaco.criar": "Cadastrou um espaço",
  "espaco.editar": "Editou um espaço",
  "espaco.excluir": "Excluiu um espaço",
  "sindico.definir": "Definiu o síndico",
  "sindico.trocar": "Trocou o síndico",
  "sindico.remover": "Removeu o síndico",
  "usuario.redefinirSenha": "Redefiniu a senha de um usuário",
  "convite.gerar": "Gerou um link de convite",
  "convite.revogar": "Revogou o link de convite",
  "morador.aprovar": "Aprovou um cadastro",
  "morador.recusar": "Recusou um cadastro",
  "morador.transferir": "Aprovou uma transferência de casa",
  "morador.mudarCasa": "Aprovou uma mudança de casa",
  "morador.desativar": "Desativou um morador",
  "reserva.criar": "Criou uma reserva",
  "reserva.excluir": "Excluiu uma reserva",
  "comunicado.criar": "Publicou um comunicado",
  "comunicado.editar": "Editou um comunicado",
  "comunicado.excluir": "Excluiu um comunicado",
};
