import type { Metadata } from "next";
import { StatusScreen } from "@/components/status-screen";
import { requireUsuario } from "@/lib/tenant";

export const metadata: Metadata = { title: "Sem acesso" };

export default async function SemAcessoPage() {
  await requireUsuario();
  return (
    <StatusScreen
      titulo="Nenhum condomínio ativo"
      texto="Sua conta não está vinculada a um condomínio ativo. Peça ao síndico um novo link de convite."
    />
  );
}
