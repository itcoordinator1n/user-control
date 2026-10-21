'use client';

/**
 * Aviso de honestidad del módulo: el 2026-09-30 concentra una carga de prueba
 * sintética que representa el 86% de los mensajes del histórico. Se excluye por
 * defecto; el interruptor permite incluirla para auditar.
 *
 * Entrega el booleano `excluirAnomalos` a través de `useFiltrosMercadeo`.
 */

import { Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { FiltrosMercadeo } from './use-filtros-mercadeo';

/** Día con la carga sintética. Si el backend cambia el criterio, actualizar acá el texto. */
export const FECHA_ANOMALA = '2026-09-30';

export function AvisoAnomalos({
  filtros,
  className,
}: {
  filtros: FiltrosMercadeo;
  className?: string;
}) {
  const { excluirAnomalos, setExcluirAnomalos } = filtros;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-muted-foreground">
          {excluirAnomalos ? (
            <>
              El <span className="font-medium text-foreground">{FECHA_ANOMALA}</span> está{' '}
              <span className="font-medium text-foreground">excluido</span>: es una carga de prueba
              sintética que concentra el 86% de los mensajes del histórico y distorsiona cualquier
              promedio.
            </>
          ) : (
            <>
              Estás viendo los datos <span className="font-medium text-foreground">con</span> la carga
              sintética del <span className="font-medium text-foreground">{FECHA_ANOMALA}</span> (86%
              de los mensajes del histórico). Las cifras no son representativas del uso real.
            </>
          )}
        </p>
      </div>

      <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap">
        <Switch
          checked={!excluirAnomalos}
          onCheckedChange={(valor) => setExcluirAnomalos(!valor)}
          aria-label={`Incluir la carga sintética del ${FECHA_ANOMALA}`}
        />
        <span className="text-muted-foreground">Incluir {FECHA_ANOMALA}</span>
      </label>
    </div>
  );
}
