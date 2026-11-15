import type { Metadata } from "next";
import { StatusScreen } from "@/components/status-screen";
import { requireUsuario } from "@/lib/tenant";

export const metadata: Metadata = { title: "Aguardando aprovação" };

export default async function AguardandoPage() {
  await requireUsuario();
  return (
    <StatusScreen
      titulo="Aguardando aprovação do síndico"
      texto="Seu cadastro foi recebido. Assim que o síndico aprovar, você terá acesso aos comunicados, reservas, documentos e à prestação de contas."
    />
  );
}
