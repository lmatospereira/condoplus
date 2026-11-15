import "server-only";
import { prisma } from "@/lib/db";

/** Modelos que pertencem a um condomínio (têm `condominioId` obrigatório). */
const TENANT_MODELS = new Set([
  "Unidade",
  "Vinculo",
  "Convite",
  "Comunicado",
  "ComunicadoAnexo",
  "Espaco",
  "Reserva",
  "Documento",
  "Despesa",
]);

const WHERE_OPS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/**
 * Cliente Prisma preso a um condomínio: injeta `condominioId` em todo filtro e em
 * toda criação dos modelos de tenant. Use sempre este cliente nas áreas do
 * condomínio — o `condominioId` vem do contexto do servidor, nunca do cliente.
 */
export function tenantDb(condominioId: string) {
  return prisma.$extends({
    name: "tenant",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);
          const a = (args ?? {}) as Record<string, unknown>;

          if (WHERE_OPS.has(operation)) {
            a.where = { ...(a.where as object), condominioId };
          } else if (operation === "create") {
            a.data = { ...(a.data as object), condominioId };
          } else if (operation === "createMany" || operation === "createManyAndReturn") {
            const data = a.data as object | object[];
            a.data = Array.isArray(data)
              ? data.map((d) => ({ ...d, condominioId }))
              : { ...data, condominioId };
          } else if (operation === "upsert") {
            a.where = { ...(a.where as object), condominioId };
            a.create = { ...(a.create as object), condominioId };
          }
          return query(a as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;
