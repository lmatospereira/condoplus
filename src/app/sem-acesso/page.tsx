import type { Metadata } from "next";
import { StatusScreen } from "@/components/status-screen";
import { prisma } from "@/lib/db";
import { requireUsuario } from "@/lib/tenant";

export const metadata: Metadata = { title: "Sem acesso" };

export default async function SemAcessoPage() {
  const usuario = await requireUsuario();
  const recusas = await prisma.vinculo.findMany({
    where: { userId: usuario.id, status: "RECUSADO" },
    orderBy: { updatedAt: "desc" },
    take: 3,
    select: { id: true, motivoRecusa: true, condominio: { select: { nome: true } }, unidade: { select: { identificador: true } } },
  });
  return (
    <StatusScreen
      titulo="Nenhum condomínio ativo"
      texto="Sua conta não está vinculada a um condomínio ativo. Se precisar, peça ao síndico um novo link de convite."
    >
      {recusas.length > 0 ? (
        <ul className="w-full rounded-md bg-muted p-3 text-left text-sm">
          {recusas.map((r) => (
            <li key={r.id}>
              Cadastro em <span className="font-medium">{r.condominio.nome}</span> ({r.unidade?.identificador}) foi recusado
              {r.motivoRecusa ? `: “${r.motivoRecusa}”` : "."}
            </li>
          ))}
        </ul>
      ) : null}
    </StatusScreen>
  );
}
