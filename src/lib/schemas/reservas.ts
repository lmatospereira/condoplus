import { z } from "zod";
import { parseDataISO } from "@/lib/datas";

export const novaReservaSchema = z.object({
  espacoId: z.string().min(1, "Selecione o espaço"),
  data: z.string().transform((v, ctx) => {
    const d = parseDataISO(v);
    if (!d) {
      ctx.addIssue({ code: "custom", message: "Data inválida" });
      return z.NEVER;
    }
    return d;
  }),
  periodo: z.string().trim().min(1, "Selecione o período").max(30),
  unidadeId: z.string().min(1, "Selecione a casa"),
});

/** "AAAA-MM" → { ano, mes }; fora do padrão, usa o mês de `padrao`. */
export function parseMes(valor: string | undefined, padrao: Date) {
  const m = valor && /^(\d{4})-(\d{2})$/.exec(valor);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { ano: Number(m[1]), mes: Number(m[2]) };
  return { ano: padrao.getUTCFullYear(), mes: padrao.getUTCMonth() + 1 };
}
