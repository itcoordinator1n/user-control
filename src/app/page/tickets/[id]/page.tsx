'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, MessageSquare, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { ChatTimeline } from '@/components/tickets/ChatTimeline';
import { useTicket, useMessages } from '@/hooks/useTicketQueries';
import { ROOT_CAUSE_LABELS } from '@/types/tickets';

interface Props {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: ticket, isLoading, isError } = useTicket(id);
  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(id);

  const messages = messagesData?.pages.flatMap((p) => p.data) ?? [];
  // Los mensajes vienen del más reciente al más antiguo — invertir para el chat
  const chronologicalMessages = [...messages].reverse();

  const solution = ticket
    ? (ticket as unknown as { solution?: import('@/types/tickets').TicketSolution }).solution
    : undefined;

  if (isLoading) return <TicketDetailSkeleton />;

  if (isError || !ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/page/tickets"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
        </Button>
        <p className="text-sm text-red-600">No se pudo cargar el ticket.</p>
      </div>
    );
  }

  const createdDate = new Date(ticket.created_at).toLocaleDateString('es-SV', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild className="mt-0.5 shrink-0">
          <Link href="/page/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{ticket.code}</h1>
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ticket.category} / {ticket.subcategory}
            {ticket.group_code && (
              <span className="ml-2 text-xs">· Grupo {ticket.group_code}</span>
            )}
          </p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-4">
        <InfoCell icon={<Clock className="h-3.5 w-3.5" />} label="Creado" value={createdDate} />
        <InfoCell
          icon={<User className="h-3.5 w-3.5" />}
          label="Técnico"
          value={ticket.assigned_to_name ?? 'Sin asignar'}
        />
        <InfoCell
          label="Canal"
          value={ticket.source_channel === 'whatsapp' ? 'WhatsApp' : 'Web'}
        />
        <InfoCell
          label="Afectados"
          value={`${ticket.ticket_count ?? 1} persona${(ticket.ticket_count ?? 1) > 1 ? 's' : ''}`}
        />
      </div>

      {/* Descripción */}
      <div className="rounded-lg border p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Descripción
        </p>
        <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="space-y-3">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Historial de chat
          </TabsTrigger>
          <TabsTrigger value="steps">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Ver pasos
          </TabsTrigger>
        </TabsList>

        {/* Chat tab */}
        <TabsContent value="chat">
          <div className="h-[420px] rounded-lg border overflow-hidden">
            <ChatTimeline
              messages={chronologicalMessages}
              isReadOnly
              onLoadMore={() => fetchNextPage()}
              hasMore={hasNextPage}
              isLoadingMore={isFetchingNextPage}
            />
          </div>
        </TabsContent>

        {/* Steps tab */}
        <TabsContent value="steps">
          {!solution || solution.is_draft ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm">La solución aún no está documentada.</p>
            </div>
          ) : (
            <SolutionView solution={solution} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InfoCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function SolutionView({ solution }: { solution: import('@/types/tickets').TicketSolution }) {
  return (
    <div className="space-y-4 rounded-lg border p-5">
      <SolutionField label="Diagnóstico" value={solution.diagnosis} />
      <SolutionField label="Solución aplicada" value={solution.solution_applied} />
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pasos
        </p>
        <pre className="whitespace-pre-wrap rounded bg-muted/40 p-3 text-sm font-mono leading-relaxed">
          {solution.steps}
        </pre>
      </div>
      <SolutionField
        label="Causa raíz"
        value={ROOT_CAUSE_LABELS[solution.root_cause] ?? solution.root_cause}
      />
    </div>
  );
}

function SolutionField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  );
}
