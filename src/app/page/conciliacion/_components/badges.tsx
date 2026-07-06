'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  EstadoBusqueda, AccionContable, MatchTipo, SerieOrigen,
} from '@/types/conciliacion';
import {
  ESTADO_BUSQUEDA_LABEL, ACCION_LABEL, serieOrigen, SERIE_ORIGEN_LABEL,
} from '../_lib/format';

const ESTADO_CLASS: Record<EstadoBusqueda, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  encontrado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  no_encontrado: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  descartado: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  baja_confirmada: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200',
};

export function EstadoBusquedaBadge({ estado }: { estado: EstadoBusqueda }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', ESTADO_CLASS[estado])}>
      {ESTADO_BUSQUEDA_LABEL[estado] ?? estado}
    </Badge>
  );
}

const ACCION_CLASS: Record<AccionContable, string> = {
  dar_de_baja: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200',
  inventariar: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200',
  ninguna: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function AccionBadge({ accion }: { accion: AccionContable }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', ACCION_CLASS[accion])}>
      {ACCION_LABEL[accion] ?? accion}
    </Badge>
  );
}

const ORIGEN_CLASS: Record<SerieOrigen, string> = {
  columna: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  extraida: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  sin_serie: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200',
};

/** Serie + badge de origen (columna / extraída / sin serie). */
export function SerieCell({
  serieOriginal, serieMatch,
}: { serieOriginal: string | null; serieMatch: string | null }) {
  const origen = serieOrigen(serieOriginal, serieMatch);
  const serie = serieMatch || serieOriginal;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs">{serie || '—'}</span>
      <Badge variant="outline" className={cn('border-transparent px-1.5 py-0 text-[10px]', ORIGEN_CLASS[origen])}>
        {SERIE_ORIGEN_LABEL[origen]}
      </Badge>
    </div>
  );
}

export function WindowsBadge({ auto }: { auto: 0 | 1 }) {
  return auto
    ? <Badge variant="outline" className="border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">Windows</Badge>
    : <span className="text-xs text-muted-foreground">—</span>;
}

export function MatchBadge({ tipo, confianza }: { tipo: MatchTipo; confianza?: string | null }) {
  if (tipo === 'ninguno') return <span className="text-xs text-muted-foreground">Sin match</span>;
  return (
    <Badge variant="outline" className="border-transparent bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
      {tipo}{confianza ? ` · ${confianza}` : ''}
    </Badge>
  );
}
