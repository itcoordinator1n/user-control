'use client';

import { Loader2, AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title, description, actions,
}: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Loading({ label = 'Cargando…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground', className)}>
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-red-600">
      <AlertTriangle className="h-5 w-5" />
      <span>No se pudo cargar la información.</span>
      <span className="text-xs text-muted-foreground">{msg}</span>
    </div>
  );
}

export function EmptyState({ message = 'Sin resultados.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Inbox className="h-6 w-6" />
      {message}
    </div>
  );
}
