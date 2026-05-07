'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Wrench, BookOpen, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketCard } from '@/components/tickets/TicketCard';
import { useTickets } from '@/hooks/useTicketQueries';
import { useTicketSocket } from '@/hooks/useTicketSocket';
import { Skeleton } from '@/components/ui/skeleton';

export default function TicketsPage() {
  // Conectar socket para recibir actualizaciones en tiempo real
  useTicketSocket();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

      <Tabs defaultValue="nuevos" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="nuevos">Nuevos</TabsTrigger>
            <TabsTrigger value="progreso">En Progreso</TabsTrigger>
            <TabsTrigger value="resueltos">Resueltos</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por usuario..."
              className="pl-9 bg-white dark:bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="nuevos" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <TicketListTab status="new,classified" sort="priority_desc" userName={debouncedSearch} />
        </TabsContent>
        <TabsContent value="progreso" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <TicketListTab status="assigned,in_progress,pending_user,escalated" sort="priority_desc" userName={debouncedSearch} />
        </TabsContent>
        <TabsContent value="resueltos" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <TicketListTab status="resolved,closed" sort="priority_desc" userName={debouncedSearch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TicketListTab({ status, sort, userName }: { status: string; sort: string; userName: string }) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useTickets({
    status,
    sort,
    user_name: userName || undefined,
    limit: 9,
  });

  const allTickets = data?.pages.flatMap((p) => p.data) ?? [];
  const tickets = Array.from(new Map(allTickets.map((t) => [t.id, t])).values());

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30 mt-4">
        <p className="text-sm text-red-700 dark:text-red-400">
          No se pudieron cargar los tickets.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground mt-4 bg-gray-50/50 dark:bg-gray-900/20">
        <p className="text-sm">No se encontraron tickets en esta categoría.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex justify-center pb-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {isFetchingNextPage ? 'Cargando más...' : 'Cargar más'}
          </Button>
        </div>
      )}
    </div>
  );
}
