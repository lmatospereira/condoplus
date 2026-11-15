import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ id, label, dica, className, children }: { id: string; label: string; dica?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {dica ? <p className="text-xs text-muted-foreground">{dica}</p> : null}
    </div>
  );
}
