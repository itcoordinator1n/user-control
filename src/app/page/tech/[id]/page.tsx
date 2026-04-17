'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { ChatTimeline } from '@/components/tickets/ChatTimeline';
import { SolutionEditor } from '@/components/tickets/SolutionEditor';
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import { useTicket, useMessages, useReplyToTicket, useStartSession } from '@/hooks/useTicketQueries';
import { useTimerStore } from '@/hooks/useTimerStore';
import { usePomodoroConfig } from '@/hooks/useTicketQueries';
import type { TicketSolution } from '@/types/tickets';

interface Props {
  params: Promise<{ id: string }>;
}

export default function TechTicketPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: ticket, isLoading } = useTicket(id);
  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(id);
  const { mutate: reply, isPending: isSending } = useReplyToTicket(id);
  const { data: pomodoroConfig } = usePomodoroConfig();
  const { mutate: startSession } = useStartSession();

  const isRunning = useTimerStore((s) => s.isRunning);
  const activeTicketId = useTimerStore((s) => s.activeTicketId);
  const startFocus = useTimerStore((s) => s.startFocus);

  const messages = messagesData?.pages.flatMap((p) => p.data) ?? [];
  const chronologicalMessages = [...messages].reverse();

  const solution = ticket
    ? (ticket as unknown as { solution?: TicketSolution }).solution
    : undefined;

  const isTimerRunningHere = isRunning && activeTicketId === id;

  const handleStartPomodoro = () => {
    if (!pomodoroConfig || !ticket) return;
    startSession(ticket.id, {
      onSuccess: (s) => startFocus(ticket.id, ticket.code, s.id, pomodoroConfig.focus_seconds),
    });
  };

  if (isLoading) return <TechTicketSkeleton />;
  if (!ticket) return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/page/tech"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
      </Button>
      <p className="text-sm text-red-600">Ticket no encontrado.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] gap-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/page/tech"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <span className="font-mono text-sm font-bold truncate">{ticket.code}</span>
          <PriorityBadge priority={ticket.priority} />
          <span className="text-sm text-muted-foreground hidden sm:block truncate">
            {ticket.category} / {ticket.subcategory}
          </span>
          <StatusBadge status={ticket.status} />
        </div>

        {/* Timer inline o botón iniciar */}
        {!isTimerRunningHere && (
          <Button size="sm" variant="outline" onClick={handleStartPomodoro} className="shrink-0">
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Iniciar Pomodoro
          </Button>
        )}
      </div>

      {/* Split body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel izquierdo — Tabs Chat / Historial */}
        <div className="flex-1 min-w-0 border-r overflow-hidden flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <div className="px-3 py-1.5 border-b bg-muted/30 flex items-center justify-between">
              <TabsList className="h-8 bg-transparent p-0 gap-4">
                <TabsTrigger 
                  value="chat" 
                  className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs font-semibold uppercase tracking-wider"
                >
                  Chat con usuario
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs font-semibold uppercase tracking-wider"
                >
                  Historial de estados
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
              <ChatTimeline
                messages={chronologicalMessages}
                isReadOnly={false}
                onSendReply={(text) => reply(text)}
                isSending={isSending}
                onLoadMore={() => fetchNextPage()}
                hasMore={hasNextPage}
                isLoadingMore={isFetchingNextPage}
              />
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 m-0 overflow-y-auto">
              <TicketTimeline ticketId={id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel derecho — Documentación */}
        <div className="w-[380px] shrink-0 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b bg-muted/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documentación
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <SolutionEditor
              ticketId={id}
              existingSolution={solution}
              onResolved={() => router.push('/page/tech')}
            />
          </div>
        </div>
      </div>

      {/* Contexto footer */}
      <div className="shrink-0 border-t bg-muted/30 px-4 py-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {ticket.group_code && (
          <span>Grupo: <strong className="text-foreground">{ticket.group_code}</strong>
            {ticket.ticket_count > 1 && ` (${ticket.ticket_count} afectados)`}
          </span>
        )}
        {ticket.source_channel && (
          <span>Canal: <strong className="text-foreground">
            {ticket.source_channel === 'whatsapp' ? 'WhatsApp' : 'Web'}
          </strong></span>
        )}
        {ticket.assigned_to_name && (
          <span>Técnico: <strong className="text-foreground">{ticket.assigned_to_name}</strong></span>
        )}
        <span>Creado: <strong className="text-foreground">
          {new Date(ticket.created_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })}
        </strong></span>
      </div>
    </div>
  );
}

function TechTicketSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] gap-2">
      <Skeleton className="h-12 w-full" />
      <div className="flex flex-1 gap-2">
        <Skeleton className="flex-1" />
        <Skeleton className="w-[380px]" />
      </div>
    </div>
  );
}
