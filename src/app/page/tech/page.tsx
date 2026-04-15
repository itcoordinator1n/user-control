'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanBoard } from '@/components/tickets/KanbanBoard';
import { useTickets } from '@/hooks/useTicketQueries';
import { useTimerStore } from '@/hooks/useTimerStore';
import { useStartSession, usePomodoroConfig } from '@/hooks/useTicketQueries';
import type { Ticket } from '@/types/tickets';

export default function TechKanbanPage() {
  const { data: session } = useSession();
  const userId = (session?.user as unknown as { id?: string })?.id;

  // Cargar solo los tickets asignados al técnico logueado
  const { data, isLoading, isError, refetch } = useTickets(
    userId ? { assigned_to: userId } : undefined
  );

  const { data: pomodoroConfig } = usePomodoroConfig();
  const { mutate: startSession } = useStartSession();
  const startFocus = useTimerStore((s) => s.startFocus);
  const pomodoroSequence = useTimerStore((s) => s.pomodoroSequence);

  const [startingFor, setStartingFor] = useState<string | null>(null);

  const tickets = data?.pages.flatMap((p) => p.data) ?? [];

  const handleStartPomodoro = (ticket: Ticket) => {
    if (!pomodoroConfig) return;
    setStartingFor(ticket.id);

    startSession(ticket.id, {
      onSuccess: (session) => {
        startFocus(ticket.id, ticket.code, session.id, pomodoroConfig.focus_seconds);
        setStartingFor(null);
      },
      onError: () => setStartingFor(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[260px] space-y-2">
            <Skeleton className="h-9 rounded-t-lg" />
            <Skeleton className="h-28 rounded-b-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm text-red-700 dark:text-red-400">
          No se pudo cargar el tablero.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      {startingFor && (
        <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
          Iniciando Pomodoro…
        </div>
      )}
      <KanbanBoard tickets={tickets} onStartPomodoro={handleStartPomodoro} />
    </>
  );
}
