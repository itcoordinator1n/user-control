import Link from 'next/link';
import { Clock, User } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import type { Ticket } from '@/types/tickets';

interface TicketCardProps {
  ticket: Ticket;
  href: string;
  showAssignee?: boolean;
}

export function TicketCard({ ticket, href, showAssignee = false }: TicketCardProps) {
  const createdDate = new Date(ticket.created_at).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={href}
      className="block rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-card dark:border-gray-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {ticket.code}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-muted-foreground">
            {ticket.category}
            {ticket.subcategory ? ` / ${ticket.subcategory}` : ''}
          </p>
        </div>
        <PriorityBadge priority={ticket.priority} className="shrink-0" />
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
        {ticket.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={ticket.status} />

        {showAssignee && ticket.assigned_to_name && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-muted-foreground">
            <User className="h-3 w-3" />
            {ticket.assigned_to_name}
          </span>
        )}

        <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {createdDate}
        </span>
      </div>
    </Link>
  );
}
