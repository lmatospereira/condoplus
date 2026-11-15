import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { selecionarCondominio } from "@/app/actions/condominio";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { condominiosDoUsuario, requireUsuario } from "@/lib/tenant";

export const metadata: Metadata = { title: "Escolher condomínio" };

export default async function SelecionarPage() {
  const usuario = await requireUsuario();
  if (usuario.isMaster) redirect("/admin");
  const lista = await condominiosDoUsuario(usuario.id);
  if (lista.length === 0) redirect("/aguardando");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <Logo className="self-center text-xl" />
      <h1 className="text-center text-xl font-semibold">Escolha o condomínio</h1>
      <ul className="flex flex-col gap-2">
        {lista.map((c) => (
          <li key={c.id}>
            <form action={selecionarCondominio}>
              <input type="hidden" name="condominioId" value={c.id} />
              <Button type="submit" variant="outline" className="w-full justify-start">
                {c.nome}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
