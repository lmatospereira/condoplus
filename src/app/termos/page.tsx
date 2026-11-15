import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Termos e privacidade" };

// Texto placeholder — edite conforme a política do condomínio/administradora.
export default function TermosPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/">
        <Logo />
      </Link>
      <article className="mt-8 flex flex-col gap-4 text-sm leading-relaxed">
        <h1 className="text-2xl font-semibold">Termos de uso e privacidade</h1>
        <p>
          O condoplus é usado pelo condomínio para comunicados, reservas de espaços, documentos e prestação de contas.
        </p>
        <h2 className="text-lg font-semibold">Dados coletados</h2>
        <p>
          Coletamos apenas nome, e-mail, telefone e a casa vinculada, para identificar os moradores e permitir o acesso.
          Outros moradores não veem seu e-mail nem seu telefone.
        </p>
        <h2 className="text-lg font-semibold">Uso e retenção</h2>
        <p>
          Os dados são usados somente para a gestão do condomínio. Quando você deixa de morar no condomínio, mantemos
          apenas o histórico necessário (por exemplo, reservas e registros de auditoria).
        </p>
        <h2 className="text-lg font-semibold">Seus direitos (LGPD)</h2>
        <p>Você pode pedir ao síndico a correção ou a exclusão dos seus dados pessoais.</p>
      </article>
    </main>
  );
}
