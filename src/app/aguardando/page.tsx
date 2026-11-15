import type { Metadata } from "next";
import { StatusScreen } from "@/components/status-screen";
import { prisma } from "@/lib/db";
import { formatarDataHora } from "@/lib/datas";
import { requireUsuario } from "@/lib/tenant";

export const metadata: Metadata = { title: "Aguardando aprovação" };

export default async function AguardandoPage() {
  const usuario = await requireUsuario();
  const pedidos = await prisma.vinculo.findMany({
    where: { userId: usuario.id, status: "PENDENTE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, condominio: { select: { nome: true } }, unidade: { select: { identificador: true } } },
  });
  return (
    <StatusScreen
      titulo="Aguardando aprovação do síndico"
      texto="Seu cadastro foi recebido. Assim que o síndico aprovar, você terá acesso aos comunicados, reservas, documentos e à prestação de contas."
    >
      {pedidos.length > 0 ? (
        <ul className="w-full rounded-md bg-muted p-3 text-left text-sm">
          {pedidos.map((p) => (
            <li key={p.id}>
              <span className="font-medium">{p.condominio.nome}</span> · {p.unidade?.identificador}
              <span className="block text-xs text-muted-foreground">Enviado em {formatarDataHora(p.createdAt)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </StatusScreen>
  );
}
