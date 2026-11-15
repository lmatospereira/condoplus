import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, KeyRound, Megaphone, ShieldCheck, Smartphone, Users, Wallet } from "lucide-react";
import { Logo, SLOGAN } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getUsuario } from "@/lib/tenant";

export const metadata: Metadata = {
  title: { absolute: `Zelora — ${SLOGAN}` },
  description:
    "Zelora: comunicados, reservas de espaços e gestão de moradores para condomínios de casas, num app simples para síndicos e moradores.",
  openGraph: { title: "Zelora", description: SLOGAN, type: "website", locale: "pt_BR" },
};

/**
 * Página inicial pública (entrada provisória do site). O site institucional
 * completo segue specs/003-institutional-website (aguardando aprovação).
 * Os módulos mostram o estágio real (APP-003): disponível ou em breve.
 */
const MODULOS = [
  { Icone: Megaphone, titulo: "Comunicados", texto: "Avisos do síndico com destaque, fixados e controle de leitura por casa.", pronto: true },
  { Icone: CalendarDays, titulo: "Reservas", texto: "Calendário do salão e de outros espaços, com regras e sem conflito de datas.", pronto: true },
  { Icone: Users, titulo: "Moradores", texto: "Cadastro por link de convite, aprovação do síndico e transferência de casa.", pronto: true },
  { Icone: FileText, titulo: "Documentos", texto: "Convenção, regimento, atas e contratos sempre à mão.", pronto: false },
  { Icone: Wallet, titulo: "Prestação de contas", texto: "Despesas por categoria, comparativos e exportação para assembleia.", pronto: false },
];

export default async function HomePage() {
  const usuario = await getUsuario();
  const destinoApp = usuario?.isMaster ? "/admin" : "/inicio";

  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-safe border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          {usuario ? (
            <Button asChild size="sm">
              <Link href={destinoApp}>Abrir o app</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Entrar</Link>
            </Button>
          )}
        </div>
      </header>

      <main>
        <section className="bg-brand-900 text-white">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
            <div className="flex flex-col gap-5">
              <p className="text-sm font-medium text-accent">Gestão condominial para condomínios de casas</p>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">{SLOGAN}</h1>
              <p className="max-w-prose text-base text-white/80 md:text-lg">
                Comunicados, reservas e cadastro de moradores num só lugar — no celular ou no computador, sem planilhas e sem
                grupo de WhatsApp lotado.
              </p>

              {usuario ? (
                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto">
                  <Link href={destinoApp}>
                    Continuar como {usuario.name.split(" ")[0]} <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/login?perfil=sindico">
                      <KeyRound aria-hidden /> Acesso do síndico
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                    <Link href="/login?perfil=morador">
                      <Users aria-hidden /> Acesso do morador
                    </Link>
                  </Button>
                </div>
              )}
              {!usuario ? (
                <p className="text-sm text-white/70">
                  É morador e ainda não tem conta? Peça ao síndico o <strong className="text-white">link de convite</strong> do seu
                  condomínio.
                </p>
              ) : null}
            </div>

            <div aria-hidden className="hidden items-center justify-center md:flex">
              <div className="w-64 rounded-xl border border-white/15 bg-white/5 p-4 shadow-2xl">
                <div className="mb-3 flex items-center gap-2 text-xs text-white/70">
                  <Smartphone className="size-4" /> Residencial Exemplo
                </div>
                {["Assembleia geral — sábado, 19h", "Manutenção do portão", "Salão reservado · Casa 07"].map((t, i) => (
                  <div key={t} className="mb-2 rounded-md bg-white/10 p-3 text-sm">
                    {i === 0 ? <span className="mb-1 block text-[11px] font-semibold text-accent">IMPORTANTE</span> : null}
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="modulos" className="mx-auto max-w-5xl px-4 py-14">
          <h2 id="modulos" className="text-2xl font-semibold tracking-tight">O que a Zelora faz</h2>
          <p className="mt-1 text-muted-foreground">Enxuta de propósito: só o que o dia a dia do condomínio precisa.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULOS.map(({ Icone, titulo, texto, pronto }) => (
              <li key={titulo} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-md bg-accent-soft text-primary">
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <span
                    className={
                      pronto
                        ? "rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-primary"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {pronto ? "Disponível" : "Em breve"}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold">{titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-3">
            {[
              { Icone: Smartphone, t: "Feita para o celular", d: "Instale como app na tela inicial, no Android ou no iPhone." },
              { Icone: ShieldCheck, t: "Dados separados por condomínio", d: "Cada condomínio só enxerga o que é seu, e o morador não vê contatos de vizinhos." },
              { Icone: Users, t: "Síndico no controle", d: "Ninguém entra sem aprovação do síndico, e tudo fica registrado." },
            ].map(({ Icone, t, d }) => (
              <div key={t} className="flex gap-3">
                <Icone className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="pb-safe border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo reduzida className="opacity-80" />
          <p>
            Zelora — {SLOGAN} ·{" "}
            <Link href="/termos" className="underline underline-offset-4">
              Termos e privacidade
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
