import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getUsuario } from "@/lib/tenant";

export const metadata: Metadata = { title: "Contato" };

const WHATSAPP = "https://wa.me/5511940069584?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20a%20Zelora.";

export default async function ContatoPage() {
  const usuario = await getUsuario();
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader usuario={usuario} />
      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Fale com a Zelora</h1>
        <p className="max-w-prose text-muted-foreground">
          É síndico ou administradora? Tire suas dúvidas ou peça uma demonstração da Zelora para o seu condomínio. Respondemos
          pelo WhatsApp.
        </p>
        <div className="flex flex-col gap-3 sm:items-start">
          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden /> Falar no WhatsApp
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">WhatsApp: (11) 94006-9584</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
