"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopiarBotao({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setOk(true);
          setTimeout(() => setOk(false), 2500);
        } catch {
          setOk(false);
        }
      }}
    >
      {ok ? <Check aria-hidden /> : <Copy aria-hidden />}
      {ok ? "Copiado" : rotulo}
    </Button>
  );
}
