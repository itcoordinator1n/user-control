import { cn } from '@/lib/utils';
import type { TicketPriority } from '@/types/tickets';

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; classes: string }> = {
  P1: { label: 'P1 — Crítico',  classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 ring-1 ring-red-400' },
  P2: { label: 'P2 — Alto',     classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  P3: { label: 'P3 — Medio',    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  P4: { label: 'P4 — Bajo',     classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
