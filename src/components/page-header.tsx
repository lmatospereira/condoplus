export function PageHeader({ titulo, descricao, children }: { titulo: string; descricao?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function EmBreve({ fase, texto }: { fase: number; texto: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <p className="font-medium">{texto}</p>
      <p className="mt-1 text-sm text-muted-foreground">Este módulo chega na fase {fase} do desenvolvimento.</p>
    </div>
  );
}
