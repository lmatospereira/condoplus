"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendente = "Salvando…",
  ...props
}: React.ComponentProps<typeof Button> & { pendente?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? pendente : children}
    </Button>
  );
}
