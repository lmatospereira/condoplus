"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PromptEvento = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Estado = "oculto" | "pronto" | "ios";

export function InstalarApp({ className, variant = "outline" }: { className?: string; variant?: "default" | "outline" | "secondary" | "ghost" }) {
  const [estado, setEstado] = useState<Estado>("oculto");
  const [evento, setEvento] = useState<PromptEvento | null>(null);
  const [instrucoes, setInstrucoes] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const t = ios ? setTimeout(() => setEstado("ios"), 0) : undefined;

    const antes = (e: Event) => {
      e.preventDefault();
      setEvento(e as PromptEvento);
      setEstado("pronto");
    };
    const instalado = () => setEstado("oculto");
    window.addEventListener("beforeinstallprompt", antes);
    window.addEventListener("appinstalled", instalado);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", antes);
      window.removeEventListener("appinstalled", instalado);
    };
  }, []);

  if (estado === "oculto") return null;

  async function instalar() {
    if (estado === "ios") return setInstrucoes((v) => !v);
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
    setEstado("oculto");
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button type="button" variant={variant} onClick={instalar} aria-expanded={estado === "ios" ? instrucoes : undefined}>
        <Download aria-hidden /> Instalar app
      </Button>
      {estado === "ios" && instrucoes ? (
        <p role="note" className="rounded-md border border-border bg-card p-3 text-sm text-foreground">
          <Share className="mr-1 inline size-4 align-text-bottom" aria-hidden />
          Toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
        </p>
      ) : null}
    </div>
  );
}
