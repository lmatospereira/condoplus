import { z } from "zod";

const situacao = z.enum(["titular", "comorador", "transferencia"], "Informe a situação").default("titular");

export const cadastroConviteSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo").max(120),
    email: z.email("E-mail inválido").trim().toLowerCase(),
    telefone: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((v) => v || null),
    senha: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(128),
    unidadeId: z.string().min(1, "Selecione a casa"),
    situacao,
    aceite: z.literal("on", "É preciso aceitar os termos de uso e privacidade"),
  })
  .transform((v) => ({
    nome: v.nome,
    email: v.email,
    telefone: v.telefone,
    senha: v.senha,
    unidadeId: v.unidadeId,
    situacao: v.situacao,
  }));

export const mudancaCasaSchema = z.object({
  unidadeId: z.string().min(1, "Selecione a casa"),
  situacao,
});

export const conviteSchema = z.object({
  validadeDias: z
    .union([z.literal(""), z.coerce.number().int().min(1, "Mínimo 1 dia").max(365, "Máximo 365 dias")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

export const recusaSchema = z.object({
  motivo: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || null),
});
