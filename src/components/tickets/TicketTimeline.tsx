'use client';

import { useTicketLog } from '@/hooks/useTicketQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TicketStatus } from '@/types/tickets';
import { StatusBadge } from './StatusBadge';

interface TicketTimelineProps {
  ticketId: string;
}

export function TicketTimeline({ ticketId }: TicketTimelineProps) {
  const { data: logs, isLoading, isError } = useTicketLog(ticketId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-4 rounded-full mt-1" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !logs) {
    return (
      <p className="p-4 text-xs text-red-500">
        No se pudo cargar el historial de estados.
      </p>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="p-4 text-xs text-muted-foreground italic">
        Sin cambios registrados aún.
      </p>
    );
  }

  // Ordenar logs: más reciente arriba
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6 p-4">
      {sortedLogs.map((log, i) => (
        <div key={log.id} className="relative flex gap-4">
          {/* Línea vertical */}
          {i !== sortedLogs.length - 1 && (
            <div className="absolute left-2 top-6 h-[calc(100%-24px)] w-[1px] bg-muted-foreground/20" />
          )}

          {/* Icono/Punto */}
          <div className="relative mt-1">
            <div
              className={cn(
                'h-4 w-4 rounded-full border-2 bg-white ring-4 ring-white dark:bg-gray-950 dark:ring-gray-950',
                log.to_status === 'resolved'
                  ? 'border-green-500'
                  : 'border-blue-500'
              )}
            />
          </div>

          {/* Contenido */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={log.to_status as TicketStatus} />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(log.created_at).toLocaleTimeString('es-SV', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(log.created_at).toLocaleDateString('es-SV', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            </div>

            <p className="text-xs font-medium text-foreground">
              {log.change_source === 'automatic' || log.change_source === 'bot' ? (
                <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tighter mr-1.5">
                  [SISTEMA]
                </span>
              ) : null}
              {log.changed_by_name || 'Sistema'}
            </p>

            {log.reason && (
              <p className="text-xs text-muted-foreground italic leading-relaxed bg-muted/30 p-2 rounded-md">
                "{log.reason}"
              </p>
            )}

            <p className="text-[10px] text-muted-foreground">
              {getFriendlyMessage(log)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getFriendlyMessage(log: any) {
  if (log.to_status === 'resolved') {
    return 'Resumen de solución enviado por WhatsApp al usuario.';
  }
  if (log.to_status === 'assigned') {
    return `Ticket asignado a ${log.changed_by_name}. Notificación enviada.`;
  }
  if (log.change_source === 'escalation') {
    return 'El ticket ha sido escalado a nivel superior.';
  }
  return `Estado cambiado de ${log.from_status} a ${log.to_status}.`;
}
