'use client';

/**
 * Estado compartido de los filtros de las cuatro pestañas de Mercadeo.
 *
 * Un solo hook que resuelve el período (etiqueta → `{desde, hasta}` vía
 * `periodoAFechas`) y el interruptor de datos anómalos, y entrega `params` listos
 * para pasarle a `useDemanda` / `useOportunidades` / `useExperiencia` / `useOperacion`.
 *
 *   const filtros = useFiltrosMercadeo();
 *   const { data, isLoading, error } = useDemanda(filtros.params);
 *   …
 *   <FiltroPeriodo filtros={filtros} />
 *   <AvisoAnomalos filtros={filtros} />
 */

import { useCallback, useMemo, useState } from 'react';
import { periodoAFechas } from '@/app/page/dashboard/_lib/exportar-asistencia';
import type { RangoParams } from '@/lib/services/mercadeo.service';

/** Etiqueta aceptada por `PeriodFilter` con `variant="attendance"`. */
export const PERIODO_PERSONALIZADO = 'Rango Personalizado';

export interface FiltrosMercadeo {
  /** Etiqueta del período ("Hoy", "Este Mes", …, "Rango Personalizado"). */
  periodo: string;
  setPeriodo: (periodo: string) => void;
  /** Fecha inicial efectiva, `YYYY-MM-DD`. */
  desde: string;
  /** Fecha final efectiva, `YYYY-MM-DD`. */
  hasta: string;
  /** Sólo relevante con `periodo === 'Rango Personalizado'`. */
  setDesde: (fecha: string) => void;
  setHasta: (fecha: string) => void;
  esPersonalizado: boolean;
  /** `true` por defecto: deja fuera la carga sintética del 2026-09-30. */
  excluirAnomalos: boolean;
  setExcluirAnomalos: (valor: boolean) => void;
  /** Lo que se le pasa a los hooks de Mercadeo. */
  params: RangoParams;
}

export function useFiltrosMercadeo(periodoInicial = 'Este Mes'): FiltrosMercadeo {
  const [periodo, setPeriodoEstado] = useState(periodoInicial);
  const [excluirAnomalos, setExcluirAnomalos] = useState(true);

  const inicial = useMemo(() => periodoAFechas(periodoInicial), [periodoInicial]);
  const [desdeManual, setDesde] = useState(inicial.dateFrom);
  const [hastaManual, setHasta] = useState(inicial.dateTo);

  const esPersonalizado = periodo === PERIODO_PERSONALIZADO;

  // Al cambiar de etiqueta precargamos el rango manual, así "Rango Personalizado"
  // arranca desde lo último que se estaba viendo en lugar de vacío.
  const setPeriodo = useCallback((siguiente: string) => {
    setPeriodoEstado(siguiente);
    if (siguiente !== PERIODO_PERSONALIZADO) {
      const { dateFrom, dateTo } = periodoAFechas(siguiente);
      if (dateFrom) setDesde(dateFrom);
      if (dateTo) setHasta(dateTo);
    }
  }, []);

  const { desde, hasta } = useMemo(() => {
    if (esPersonalizado) return { desde: desdeManual, hasta: hastaManual };
    const { dateFrom, dateTo } = periodoAFechas(periodo);
    return { desde: dateFrom || desdeManual, hasta: dateTo || hastaManual };
  }, [esPersonalizado, periodo, desdeManual, hastaManual]);

  const params = useMemo<RangoParams>(
    () => ({ desde, hasta, excluirAnomalos }),
    [desde, hasta, excluirAnomalos],
  );

  return {
    periodo, setPeriodo,
    desde, hasta, setDesde, setHasta,
    esPersonalizado,
    excluirAnomalos, setExcluirAnomalos,
    params,
  };
}
