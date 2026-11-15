import { z } from "zod";

export const CATEGORIAS = ["GERAL", "MANUTENCAO", "ASSEMBLEIA", "SEGURANCA", "EVENTOS"] as const;

export const comunicadoSchema = z.object({
  titulo: z.string().trim().min(3, "Informe o título").max(150),
  conteudo: z.string().trim().min(1, "Escreva o comunicado").max(20000),
  categoria: z.enum(CATEGORIAS).default("GERAL"),
  importante: z.coerce.boolean().default(false),
  fixado: z.coerce.boolean().default(false),
});
