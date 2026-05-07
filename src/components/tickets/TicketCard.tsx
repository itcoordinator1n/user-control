import Link from 'next/link';
import { Clock, User, MessageSquare, ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import type { Ticket } from '@/types/tickets';

interface TicketCardProps {
  ticket: Ticket;
  href: string;
  showAssignee?: boolean;
}

function toTitleCase(str: string) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
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
      className="group relative flex h-full flex-col justify-between rounded-xl border border-gray-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F2B90F]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:border-gray-800 dark:bg-card dark:hover:border-[#F2B90F]/40 dark:hover:shadow-[0_8px_30px_rgba(242,185,15,0.06)]"
    >
      <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-400 dark:bg-gray-800/50">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Header: Code & Priority */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex w-fit items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {ticket.code}
            </span>
            {ticket.user_name && (
              <h3 className="line-clamp-1 font-semibold text-gray-900 dark:text-gray-100 pr-6" title={ticket.user_name}>
                {toTitleCase(ticket.user_name)}
              </h3>
            )}
          </div>
          <PriorityBadge priority={ticket.priority} className="shrink-0 shadow-sm" />
        </div>

        {/* Category & Description */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#0367A6] dark:text-[#77B3D9]">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="truncate">
              {toTitleCase(ticket.category)}
              {ticket.subcategory ? ` • ${toTitleCase(ticket.subcategory)}` : ''}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {ticket.description}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <StatusBadge status={ticket.status} />

        <div className="flex items-center gap-3">
          {showAssignee && ticket.assigned_to_name && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <User className="h-3 w-3" />
              </div>
              <span className="truncate max-w-[100px]" title={ticket.assigned_to_name}>
                {toTitleCase(ticket.assigned_to_name.split(' ')[0])}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{createdDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
