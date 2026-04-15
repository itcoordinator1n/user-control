'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import type { Ticket, TicketStatus } from '@/types/tickets';

interface KanbanColumnProps {
  id: TicketStatus;
  title: string;
  tickets: Ticket[];
  isDropDisabled?: boolean;
  colorClass: string;
}

export function KanbanColumn({
  id,
  title,
  tickets,
  isDropDisabled = false,
  colorClass,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: isDropDisabled,
  });

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px] flex-shrink-0">
      {/* Header */}
      <div className={cn('flex items-center justify-between rounded-t-lg px-3 py-2', colorClass)}>
        <span className="text-sm font-semibold">{title}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-xs font-bold">
          {tickets.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[200px] rounded-b-lg border border-t-0 p-2 space-y-2 transition-colors',
          isOver && !isDropDisabled
            ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-700'
            : 'bg-gray-50/50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700',
          isDropDisabled && 'opacity-70'
        )}
      >
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tickets.map((ticket) => (
            <KanbanCard key={ticket.id} ticket={ticket} />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <div className="flex h-16 items-center justify-center text-xs text-muted-foreground">
            {isDropDisabled ? 'Sin tickets' : 'Arrastrá aquí'}
          </div>
        )}
      </div>
    </div>
  );
}
