import Link from "next/link";
import { CalendarDays, FileText, Megaphone, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenant } from "@/lib/tenant";

const ATALHOS = [
  { href: "/comunicados", titulo: "Comunicados", texto: "Avisos do síndico", Icone: Megaphone },
  { href: "/reservas", titulo: "Reservas", texto: "Salão e outros espaços", Icone: CalendarDays },
  { href: "/documentos", titulo: "Documentos", texto: "Convenção, atas e contratos", Icone: FileText },
  { href: "/contas", titulo: "Prestação de contas", texto: "Despesas do condomínio", Icone: Wallet },
];

export default async function InicioPage() {
  const { usuario, condominio, ator, db } = await requireTenant();
  const pendentes = ator.sindico || ator.isMaster ? await db.vinculo.count({ where: { status: "PENDENTE" } }) : 0;
  const primeiroNome = usuario.name.split(" ")[0];

  return (
    <>
      <PageHeader titulo={`Olá, ${primeiroNome}`} descricao={condominio.nome} />
      {pendentes > 0 ? (
        <Link
          href="/moradores"
          className="mb-6 block rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm font-medium text-primary"
        >
          {pendentes} {pendentes === 1 ? "cadastro aguardando" : "cadastros aguardando"} aprovação →
        </Link>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {ATALHOS.map(({ href, titulo, texto, Icone }) => (
          <Link key={href} href={href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="flex-row items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icone className="size-5" aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base">{titulo}</CardTitle>
                  <CardDescription>{texto}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
