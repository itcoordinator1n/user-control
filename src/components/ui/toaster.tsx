'use client';

import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore, type ToastVariant } from '@/hooks/useToast';

const STYLES: Record<ToastVariant, { icon: React.ElementType; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100' },
  error:   { icon: XCircle,      className: 'border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-100' },
  info:    { icon: Info,         className: 'border-sky-500/40 bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100' },
};

/** Contenedor global de toasts. Montar una sola vez en el layout raíz. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const { icon: Icon, className } = STYLES[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-bottom-2',
              className,
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1 break-words">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
