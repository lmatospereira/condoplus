import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TrocarSenhaForm } from "@/components/trocar-senha-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Minha senha" };

export default function AdminSenhaPage() {
  return (
    <div className="max-w-md">
      <PageHeader titulo="Minha senha" descricao="Ao trocar, as outras sessões abertas são encerradas." />
      <Card>
        <CardContent className="pt-5">
          <TrocarSenhaForm />
        </CardContent>
      </Card>
    </div>
  );
}
