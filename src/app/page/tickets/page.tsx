'use client';

import Link from 'next/link';
import { Plus, Wrench, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TicketCard } from '@/components/tickets/TicketCard';
import { useTickets } from '@/hooks/useTicketQueries';
import { useTicketSocket } from '@/hooks/useTicketSocket';
import { Skeleton } from '@/components/ui/skeleton';

export default function TicketsPage() {
  // Conectar socket para recibir actualizaciones en tiempo real
  useTicketSocket();

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useTickets();

  const tickets = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Mis solicitudes de soporte
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/page/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva solicitud
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/page/tickets/improvement">
              <Wrench className="mr-2 h-4 w-4" />
              Solicitud de mejora
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/page/tickets/knowledge">
              <BookOpen className="mr-2 h-4 w-4" />
              Base de conocimiento
            </Link>
          </Button>
        </div>
      </div>

      {/* Lista */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-400">
            No se pudieron cargar los tickets.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && tickets.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-sm">No tenés solicitudes de soporte aún.</p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/page/tickets/new">Crear primera solicitud</Link>
          </Button>
        </div>
      )}

      {tickets.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                href={`/page/tickets/${ticket.id}`}
                showAssignee
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Cargando...' : 'Ver más'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
