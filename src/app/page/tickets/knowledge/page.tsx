'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useKnowledge, useSearchKnowledge } from '@/hooks/useTicketQueries';
import { ROOT_CAUSE_LABELS } from '@/types/tickets';
import { useDebounce } from 'use-debounce';
import type { TicketSolution } from '@/types/tickets';

export default function KnowledgePage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 400);
  const isSearching = debouncedQuery.trim().length >= 2;

  const {
    data: listData,
    isLoading: isListLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useKnowledge();

  const { data: searchResults, isLoading: isSearchLoading } = useSearchKnowledge(debouncedQuery);

  const listSolutions = listData?.pages.flatMap((p) => p.data) ?? [];
  const solutions = isSearching ? (searchResults ?? []) : listSolutions;
  const isLoading = isSearching ? isSearchLoading : isListLoading;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/page/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Base de conocimiento</h1>
          <p className="text-sm text-muted-foreground">
            Buscá si tu problema ya tiene una solución documentada.
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por diagnóstico, solución o pasos..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Resultados */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && solutions.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-40" />
          {isSearching
            ? <p className="text-sm">No se encontraron resultados para "{debouncedQuery}".</p>
            : <p className="text-sm">No hay soluciones documentadas aún.</p>
          }
        </div>
      )}

      {!isLoading && solutions.length > 0 && (
        <>
          {isSearching && (
            <p className="text-xs text-muted-foreground">
              {solutions.length} resultado{solutions.length !== 1 ? 's' : ''} para "{debouncedQuery}"
            </p>
          )}

          <div className="space-y-3">
            {solutions.map((sol) => (
              <KnowledgeCard key={sol.id} solution={sol} />
            ))}
          </div>

          {!isSearching && hasNextPage && (
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

function KnowledgeCard({ solution }: { solution: TicketSolution }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-900 dark:border-gray-700 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
            {solution.diagnosis}
          </p>
          <p className="text-xs text-muted-foreground">
            Causa raíz: {ROOT_CAUSE_LABELS[solution.root_cause] ?? solution.root_cause}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
        {solution.solution_applied}
      </p>

      <Button
        variant="ghost"
        size="sm"
        className="text-xs px-0 h-auto"
        onClick={() => setExpanded((v) => !v)}
      >
        <ChevronRight
          className={`mr-1 h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        {expanded ? 'Ocultar pasos' : 'Ver pasos'}
      </Button>

      {expanded && (
        <pre className="whitespace-pre-wrap rounded bg-muted/40 p-3 text-xs font-mono leading-relaxed">
          {solution.steps}
        </pre>
      )}
    </div>
  );
}
