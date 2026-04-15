'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTicket } from '@/hooks/useTicketQueries';
import { ROOT_CAUSE_LABELS } from '@/types/tickets';

interface Props {
  params: Promise<{ id: string }>;
}

export default function TicketStepsPage({ params }: Props) {
  const { id } = use(params);
  const { data: ticket, isLoading } = useTicket(id);

  const solution = ticket
    ? (ticket as unknown as { solution?: import('@/types/tickets').TicketSolution }).solution
    : undefined;

  return (
    <div className="space-y-5 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/page/tickets/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al ticket
        </Link>
      </Button>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!isLoading && (!solution || solution.is_draft) && (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="text-sm">La solución aún no está documentada.</p>
        </div>
      )}

      {!isLoading && solution && !solution.is_draft && (
        <div className="space-y-5">
          <h1 className="text-xl font-bold">Solución documentada</h1>

          {ticket && (
            <p className="text-sm text-muted-foreground">
              {ticket.code} — {ticket.category} / {ticket.subcategory}
            </p>
          )}

          <Section label="Diagnóstico">
            <p className="text-sm whitespace-pre-wrap">{solution.diagnosis}</p>
          </Section>

          <Section label="Solución aplicada">
            <p className="text-sm whitespace-pre-wrap">{solution.solution_applied}</p>
          </Section>

          <Section label="Pasos">
            <pre className="whitespace-pre-wrap rounded bg-muted/40 p-4 text-sm font-mono leading-relaxed">
              {solution.steps}
            </pre>
          </Section>

          <Section label="Causa raíz">
            <p className="text-sm">{ROOT_CAUSE_LABELS[solution.root_cause] ?? solution.root_cause}</p>
          </Section>

          {solution.attachments && solution.attachments.length > 0 && (
            <Section label="Archivos adjuntos">
              <ul className="space-y-1">
                {solution.attachments.map((att) => (
                  <li key={att.url}>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      {att.name}
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
