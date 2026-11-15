import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <Building2 className="size-5" aria-hidden />
      </span>
      condoplus
    </span>
  );
}
