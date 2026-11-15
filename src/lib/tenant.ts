import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Ator } from "@/lib/permissions";
import { tenantDb } from "@/lib/tenant-db";

export const COOKIE_CONDOMINIO = "cp_condominio";

export type UsuarioSessao = {
  id: string;
  name: string;
  email: string;
  isMaster: boolean;
};

/** Usuário logado (ou null). Memoizado por requisição. */
export const getUsuario = cache(async (): Promise<UsuarioSessao | null> => {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return null;
  const u = await prisma.user.findUnique({
    where: { id: sessao.user.id },
    select: { id: true, name: true, email: true, isMaster: true, ativo: true },
  });
  if (!u || !u.ativo) return null;
  return { id: u.id, name: u.name, email: u.email, isMaster: u.isMaster };
});

export async function requireUsuario() {
  const u = await getUsuario();
  if (!u) redirect("/login");
  return u;
}

export async function requireMaster() {
  const u = await requireUsuario();
  if (!u.isMaster) redirect("/");
  return u;
}

/** Condomínios em que o usuário tem algum vínculo ATIVO (e o condomínio está ativo). */
export async function condominiosDoUsuario(userId: string) {
  return prisma.condominio.findMany({
    where: { ativo: true, vinculos: { some: { userId, status: "ATIVO" } } },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
}

export type TenantContext = {
  usuario: UsuarioSessao;
  condominio: { id: string; nome: string };
  ator: Ator;
  db: ReturnType<typeof tenantDb>;
};

/**
 * Resolve o condomínio ativo a partir do cookie e VALIDA no banco que o usuário
 * pertence a ele. O cookie é só uma preferência; a autorização vem do vínculo.
 * O master pode abrir qualquer condomínio (somente leitura nas áreas do síndico).
 */
export const getTenantContext = cache(async (): Promise<TenantContext | null> => {
  const usuario = await getUsuario();
  if (!usuario) return null;

  const preferido = (await cookies()).get(COOKIE_CONDOMINIO)?.value;
  let condominio: { id: string; nome: string } | null = null;

  if (preferido) {
    condominio = await prisma.condominio.findFirst({
      where: usuario.isMaster
        ? { id: preferido }
        : { id: preferido, ativo: true, vinculos: { some: { userId: usuario.id, status: "ATIVO" } } },
      select: { id: true, nome: true },
    });
  }
  if (!condominio && !usuario.isMaster) {
    const lista = await condominiosDoUsuario(usuario.id);
    if (lista.length === 1) condominio = lista[0];
  }
  if (!condominio) return null;

  const vinculos = await prisma.vinculo.findMany({
    where: { userId: usuario.id, condominioId: condominio.id, status: "ATIVO" },
    select: { papel: true, unidadeId: true },
  });

  const ator: Ator = {
    userId: usuario.id,
    isMaster: usuario.isMaster,
    sindico: vinculos.some((v) => v.papel === "SINDICO"),
    unidadeIds: vinculos.filter((v) => v.papel === "MORADOR" && v.unidadeId).map((v) => v.unidadeId!),
  };

  return { usuario, condominio, ator, db: tenantDb(condominio.id) };
});

/** Para páginas da área do condomínio: decide para onde mandar quem não tem tenant. */
export async function requireTenant(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (ctx) return ctx;

  const usuario = await requireUsuario();
  if (usuario.isMaster) redirect("/admin");

  const lista = await condominiosDoUsuario(usuario.id);
  if (lista.length > 1) redirect("/selecionar-condominio");

  const pendente = await prisma.vinculo.count({ where: { userId: usuario.id, status: "PENDENTE" } });
  if (pendente > 0) redirect("/aguardando");
  redirect("/sem-acesso");
}
