import { cn } from '@/lib/utils';
import type { TicketStatus } from '@/types/tickets';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; classes: string }> = {
  new:          { label: 'Nuevo',           classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  classified:   { label: 'Clasificado',     classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  assigned:     { label: 'Asignado',        classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  in_progress:  { label: 'En progreso',     classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  pending_user: { label: 'Esperando usuario', classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  resolved:     { label: 'Resuelto',        classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  closed:       { label: 'Cerrado',         classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  reopened:     { label: 'Reabierto',       classes: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
  escalated:    { label: 'Escalado',        classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
