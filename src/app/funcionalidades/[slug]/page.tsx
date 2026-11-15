import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { buscarFuncionalidade, FUNCIONALIDADES } from "@/lib/funcionalidades";
import { WHATSAPP_URL } from "@/lib/site";
import { getUsuario } from "@/lib/tenant";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return FUNCIONALIDADES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = buscarFuncionalidade((await params).slug);
  if (!f) return {};
  return { title: f.titulo, description: f.descricao };
}

export default async function FuncionalidadePage({ params }: Props) {
  const f = buscarFuncionalidade((await params).slug);
  if (!f) notFound();
  const usuario = await getUsuario();
  const outras = FUNCIONALIDADES.filter((o) => o.slug !== f.slug);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader usuario={usuario} />
      <main>
        <section className="bg-brand-900 text-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-14">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-md bg-white/10 text-accent">
                <f.Icone className="size-6" aria-hidden />
              </span>
              <span
                className={
                  f.pronto
                    ? "rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                    : "rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white"
                }
              >
                {f.pronto ? "Disponível" : "Em breve"}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{f.titulo}</h1>
            <p className="max-w-prose text-base text-white/80 md:text-lg">{f.subtitulo}</p>
          </div>
        </section>

        <section aria-labelledby="como-funciona" className="mx-auto max-w-5xl px-4 py-12">
          <h2 id="como-funciona" className="text-2xl font-semibold tracking-tight">
            {f.pronto ? "Como funciona" : "Como deve funcionar"}
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {f.passos.map((p, i) => (
              <li key={p.titulo} className="rounded-lg border border-border bg-card p-5">
                <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-primary">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{p.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="recursos" className="border-t border-border bg-card">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="recursos" className="text-2xl font-semibold tracking-tight">
              {f.pronto ? "Recursos" : "O que está planejado"}
            </h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {f.recursos.map(({ Icone, titulo, texto }) => (
                <li key={titulo} className="flex gap-3">
                  <Icone className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                  <div>
                    <h3 className="font-semibold">{titulo}</h3>
                    <p className="text-sm text-muted-foreground">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="papeis" className="mx-auto max-w-5xl px-4 py-12">
          <h2 id="papeis" className="sr-only">Para quem</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { t: "Para o síndico", itens: f.sindico },
              { t: "Para o morador", itens: f.morador },
            ].map(({ t, itens }) => (
              <div key={t} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-lg font-semibold">{t}</h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {itens.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {!f.pronto ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Este módulo ainda está em desenvolvimento e os detalhes podem mudar até o lançamento.
            </p>
          ) : null}
        </section>

        <section aria-labelledby="cta" className="border-t border-border bg-brand-900 text-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-12">
            <h2 id="cta" className="text-2xl font-semibold tracking-tight">Quer ver a Zelora no seu condomínio?</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden /> Falar no WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                {usuario ? <Link href={usuario.isMaster ? "/admin" : "/inicio"}>Abrir o app</Link> : <Link href="/login">Acessar</Link>}
              </Button>
            </div>
          </div>
        </section>

        <nav aria-label="Outras funcionalidades" className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-sm font-semibold text-muted-foreground">Outras funcionalidades</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {outras.map((o) => (
              <li key={o.slug}>
                <Link href={`/funcionalidades/${o.slug}`} className="inline-flex min-h-11 items-center gap-1 text-sm text-primary underline underline-offset-4">
                  {o.titulo} <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
