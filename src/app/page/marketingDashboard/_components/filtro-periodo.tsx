'use client';

/**
 * Selector de período de Mercadeo: envuelve el `PeriodFilter` del dashboard
 * (variante "attendance", que incluye Hoy / Esta Semana / … / Rango Personalizado)
 * y entrega `{ desde, hasta }` ya resueltos a través de `useFiltrosMercadeo`.
 */

import { PeriodFilter } from '@/app/page/dashboard/_components/shared/period-filter';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FiltrosMercadeo } from './use-filtros-mercadeo';

export function FiltroPeriodo({
  filtros,
  className,
}: {
  filtros: FiltrosMercadeo;
  className?: string;
}) {
  const { periodo, setPeriodo, desde, hasta, setDesde, setHasta, esPersonalizado } = filtros;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <PeriodFilter value={periodo} onChange={setPeriodo} variant="attendance" />

      {esPersonalizado ? (
        <>
          <Input
            type="date"
            aria-label="Desde"
            value={desde}
            max={hasta || undefined}
            onChange={(e) => setDesde(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            aria-label="Hasta"
            value={hasta}
            min={desde || undefined}
            onChange={(e) => setHasta(e.target.value)}
            className="w-40"
          />
        </>
      ) : (
        <span className="text-xs tabular-nums text-muted-foreground">
          {desde} → {hasta}
        </span>
      )}
    </div>
  );
}
