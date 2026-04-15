'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Clock, User, Zap } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { useTimerStore } from '@/hooks/useTimerStore';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/types/tickets';

interface KanbanCardProps {
  ticket: Ticket;
  isDragOverlay?: boolean;
}

export function KanbanCard({ ticket, isDragOverlay = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id, data: { ticket } });

  const activeTicketId = useTimerStore((s) => s.activeTicketId);
  const isRunning = useTimerStore((s) => s.isRunning);
  const isPaused = useTimerStore((s) => s.isPaused);
  const secondsRemaining = useTimerStore((s) => s.secondsRemaining);

  const isTimerActive = activeTicketId === ticket.id && isRunning;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const mins = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
  const secs = (secondsRemaining % 60).toString().padStart(2, '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing dark:bg-gray-900 dark:border-gray-700 select-none',
        isDragging && 'opacity-40',
        isDragOverlay && 'shadow-lg rotate-1 opacity-100',
        isTimerActive && 'ring-2 ring-blue-500'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400">
          {ticket.code}
        </span>
        <PriorityBadge priority={ticket.priority} className="shrink-0" />
      </div>

      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
        {ticket.description}
      </p>

      <p className="text-xs text-muted-foreground mb-2">
        {ticket.category} / {ticket.subcategory}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {ticket.assigned_to_name && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {ticket.assigned_to_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Timer activo en esta tarjeta */}
          {isTimerActive && (
            <span className={cn(
              'flex items-center gap-1 text-xs font-mono font-semibold px-1.5 py-0.5 rounded',
              isPaused
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            )}>
              <Zap className="h-3 w-3" />
              {mins}:{secs}
            </span>
          )}

          <Link
            href={`/page/tech/${ticket.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            Abrir
          </Link>
        </div>
      </div>

      {/* Fecha */}
      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        {new Date(ticket.created_at).toLocaleDateString('es-SV', {
          day: '2-digit', month: 'short',
        })}
      </p>
    </div>
  );
}
