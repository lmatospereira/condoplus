import { z } from "zod";
import { parseDataISO } from "@/lib/datas";

const texto = (max: number, msg: string) => z.string().trim().min(1, msg).max(max);
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
const inteiroOpcional = z
  .union([z.literal(""), z.coerce.number().int("Use um número inteiro").min(0, "Não pode ser negativo").max(10000)])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;

export const condominioSchema = z.object({
  nome: texto(120, "Informe o nome"),
  endereco: texto(200, "Informe o endereço"),
  cidade: texto(100, "Informe a cidade"),
  uf: z.enum(UFS, "Selecione a UF"),
  cnpj: opcional(18).refine((v) => v === null || v.replace(/\D/g, "").length === 14, "CNPJ deve ter 14 dígitos"),
});

export const novoCondominioSchema = condominioSchema.extend({
  quantidadeCasas: z.coerce.number().int().min(0, "Mínimo 0").max(500, "Máximo 500"),
  prefixoCasa: z.string().trim().max(30).default("Casa"),
});

export const adicionarCasasSchema = z.discriminatedUnion("modo", [
  z.object({ modo: z.literal("quantidade"), quantidade: z.coerce.number().int().min(1, "Mínimo 1").max(500), prefixo: z.string().trim().max(30).default("Casa") }),
  z.object({ modo: z.literal("individual"), identificador: texto(40, "Informe o identificador") }),
]);

export const identificadorSchema = z.object({ identificador: texto(40, "Informe o identificador") });

export const espacoSchema = z
  .object({
    nome: texto(80, "Informe o nome"),
    capacidade: inteiroOpcional,
    regras: opcional(5000),
    ativo: z.coerce.boolean().default(false),
    modo: z.enum(["DIA_INTEIRO", "PERIODOS"]),
    periodos: z
      .string()
      .default("")
      .transform((s) => [...new Set(s.split(/[\n,]/).map((p) => p.trim()).filter(Boolean))]),
    antecedenciaMinDias: inteiroOpcional,
    antecedenciaMaxDias: inteiroOpcional,
    limiteMensalPorUnidade: inteiroOpcional,
    diasBloqueados: z
      .string()
      .default("")
      .transform((s, ctx) => {
        const datas: Date[] = [];
        for (const parte of s.split(/[\s,;]+/).filter(Boolean)) {
          const d = parseDataISO(parte);
          if (!d) {
            ctx.addIssue({ code: "custom", message: `Data inválida: ${parte} (use AAAA-MM-DD)` });
            return z.NEVER;
          }
          datas.push(d);
        }
        return datas.sort((a, b) => a.getTime() - b.getTime());
      }),
  })
  .superRefine((v, ctx) => {
    if (v.modo === "PERIODOS" && v.periodos.length === 0)
      ctx.addIssue({ code: "custom", path: ["periodos"], message: "Informe ao menos um período" });
    if (v.periodos.some((p) => p.length > 30)) ctx.addIssue({ code: "custom", path: ["periodos"], message: "Período com no máximo 30 caracteres" });
    if (v.periodos.some((p) => p.toUpperCase() === "DIA_INTEIRO"))
      ctx.addIssue({ code: "custom", path: ["periodos"], message: "Nome de período reservado" });
    if (v.antecedenciaMinDias !== null && v.antecedenciaMaxDias !== null && v.antecedenciaMinDias > v.antecedenciaMaxDias)
      ctx.addIssue({ code: "custom", path: ["antecedenciaMaxDias"], message: "A antecedência máxima deve ser maior que a mínima" });
  })
  .transform((v) => ({ ...v, periodos: v.modo === "DIA_INTEIRO" ? [] : v.periodos }));

export const sindicoSchema = z.object({
  nome: texto(120, "Informe o nome"),
  email: z.email("E-mail inválido").trim().toLowerCase(),
  telefone: opcional(20),
});

export const novaSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres").max(128),
    confirmacao: z.string(),
  })
  .refine((v) => v.novaSenha === v.confirmacao, { path: ["confirmacao"], message: "As senhas não conferem" })
  .refine((v) => v.novaSenha !== v.senhaAtual, { path: ["novaSenha"], message: "A nova senha deve ser diferente da atual" });

export type EspacoInput = z.infer<typeof espacoSchema>;
