"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import type { ResultadoAcao } from "@/lib/acao";
import { ErroNegocio } from "@/lib/erros";
import { PermissaoNegada } from "@/lib/permissions";
import {
  adicionarCasasSchema,
  condominioSchema,
  espacoSchema,
  identificadorSchema,
  novoCondominioSchema,
  sindicoSchema,
} from "@/lib/schemas/admin";
import { requireMaster } from "@/lib/tenant";
import * as admin from "@/server/admin";

type Senha = { nome: string; email: string; senhaProvisoria: string | null };

function campos(fd: FormData) {
  return Object.fromEntries(fd) as Record<string, string>;
}

function validar<S extends z.ZodType>(schema: S, fd: FormData): z.infer<S> {
  const r = schema.safeParse(campos(fd));
  if (!r.success) throw new ErroNegocio(r.error.issues[0]?.message ?? "Dados inválidos");
  return r.data;
}

/** Executa como master, traduzindo erros conhecidos para mensagens amigáveis. */
async function comoMaster<T>(fn: (ator: ReturnType<typeof admin.atorMaster>) => Promise<ResultadoAcao<T>>): Promise<ResultadoAcao<T>> {
  const master = await requireMaster();
  try {
    return await fn(admin.atorMaster(master.id));
  } catch (e) {
    if (e instanceof ErroNegocio) return { ok: false, erro: e.message };
    if (e instanceof PermissaoNegada) return { ok: false, erro: "Você não tem permissão para esta ação." };
    console.error("[admin] erro inesperado:", e);
    return { ok: false, erro: "Não foi possível concluir. Tente novamente." };
  }
}

const caminho = (id: string) => `/admin/condominios/${id}`;

// --- Condomínios -------------------------------------------------------------

export async function criarCondominioAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  let id: string | undefined;
  const r = await comoMaster<undefined>(async (ator) => {
    id = (await admin.criarCondominio(ator, validar(novoCondominioSchema, fd))).id;
    return { ok: true };
  });
  if (r.ok && id) redirect(caminho(id));
  return r;
}

export async function atualizarCondominioAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  return comoMaster(async (ator) => {
    const id = String(fd.get("condominioId"));
    await admin.atualizarCondominio(ator, id, validar(condominioSchema, fd));
    revalidatePath(caminho(id));
    return { ok: true, mensagem: "Dados salvos." };
  });
}

export async function definirCondominioAtivoAction(condominioId: string, ativo: boolean): Promise<ResultadoAcao> {
  return comoMaster(async (ator) => {
    await admin.definirCondominioAtivo(ator, condominioId, ativo);
    revalidatePath(caminho(condominioId));
    return { ok: true, mensagem: ativo ? "Condomínio ativado." : "Condomínio desativado." };
  });
}

// --- Casas -------------------------------------------------------------------

export async function adicionarCasasAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  return comoMaster(async (ator) => {
    const id = String(fd.get("condominioId"));
    const n = await admin.adicionarCasas(ator, id, validar(adicionarCasasSchema, fd));
    revalidatePath(caminho(id));
    return { ok: true, mensagem: n === 1 ? "Casa adicionada." : `${n} casas adicionadas.` };
  });
}

export async function renomearCasaAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  return comoMaster(async (ator) => {
    const id = String(fd.get("condominioId"));
    await admin.renomearCasa(ator, id, String(fd.get("unidadeId")), validar(identificadorSchema, fd).identificador);
    revalidatePath(caminho(id));
    return { ok: true, mensagem: "Casa atualizada." };
  });
}

export async function definirCasaAtivaAction(condominioId: string, unidadeId: string, ativo: boolean): Promise<ResultadoAcao> {
  return comoMaster(async (ator) => {
    await admin.definirCasaAtiva(ator, condominioId, unidadeId, ativo);
    revalidatePath(caminho(condominioId));
    return { ok: true, mensagem: ativo ? "Casa ativada." : "Casa desativada." };
  });
}

// --- Espaços -----------------------------------------------------------------

export async function salvarEspacoAction(_p: ResultadoAcao | null, fd: FormData): Promise<ResultadoAcao> {
  let destino: string | undefined;
  const r = await comoMaster<undefined>(async (ator) => {
    const id = String(fd.get("condominioId"));
    const espacoId = fd.get("espacoId") ? String(fd.get("espacoId")) : undefined;
    await admin.salvarEspaco(ator, id, validar(espacoSchema, fd), espacoId);
    revalidatePath(caminho(id));
    destino = `${caminho(id)}#espacos`;
    return { ok: true };
  });
  if (r.ok && destino) redirect(destino);
  return r;
}

export async function excluirEspacoAction(condominioId: string, espacoId: string): Promise<ResultadoAcao> {
  const r = await comoMaster<undefined>(async (ator) => {
    await admin.excluirEspaco(ator, condominioId, espacoId);
    revalidatePath(caminho(condominioId));
    return { ok: true };
  });
  if (r.ok) redirect(`${caminho(condominioId)}#espacos`);
  return r;
}

// --- Síndico e senhas --------------------------------------------------------

export async function definirSindicoAction(_p: ResultadoAcao<Senha> | null, fd: FormData): Promise<ResultadoAcao<Senha>> {
  return comoMaster(async (ator) => {
    const id = String(fd.get("condominioId"));
    const r = await admin.definirSindico(ator, id, validar(sindicoSchema, fd));
    revalidatePath(caminho(id));
    return {
      ok: true,
      mensagem: r.senhaProvisoria ? "Síndico cadastrado." : `${r.nome} (conta existente) agora é o síndico.`,
      dados: r,
    };
  });
}

export async function removerSindicoAction(condominioId: string): Promise<ResultadoAcao> {
  return comoMaster(async (ator) => {
    await admin.removerSindico(ator, condominioId);
    revalidatePath(caminho(condominioId));
    return { ok: true, mensagem: "Síndico removido." };
  });
}

export async function redefinirSenhaAction(condominioId: string, userId: string): Promise<ResultadoAcao<Senha>> {
  return comoMaster(async (ator) => {
    const r = await admin.redefinirSenhaUsuario(ator, condominioId, userId);
    return { ok: true, mensagem: "Senha redefinida.", dados: r };
  });
}
