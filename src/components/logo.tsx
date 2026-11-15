import { cn } from "@/lib/utils";

/**
 * Assinatura visual da Zelora (specs/001-brand-identity — proposta, aguardando aprovação).
 * Símbolo: telhado (cuidado com a casa) sobre um "Z". Versão principal = símbolo + nome;
 * versão reduzida = só o símbolo. `tom="escuro"` para fundos escuros.
 */
export function Simbolo({ className, tom = "claro" }: { className?: string; tom?: "claro" | "escuro" }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden focusable="false">
      <rect width="32" height="32" rx="8" fill={tom === "claro" ? "#203D50" : "#FFFFFF"} />
      <path d="M8 13.5 16 7.5l8 6" fill="none" stroke="#62D5B0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 17h11l-11 7.5h11" fill="none" stroke={tom === "claro" ? "#FFFFFF" : "#203D50"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, tom = "claro", reduzida = false }: { className?: string; tom?: "claro" | "escuro"; reduzida?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Simbolo tom={tom} />
      {reduzida ? (
        <span className="sr-only">Zelora</span>
      ) : (
        <span className={cn("text-xl font-semibold tracking-tight", tom === "claro" ? "text-primary" : "text-white")}>Zelora</span>
      )}
    </span>
  );
}

export const SLOGAN = "Gestão que cuida de cada detalhe.";
