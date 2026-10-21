/**
 * Piezas compartidas por las cuatro pestañas de Mercadeo.
 *
 * Uso típico dentro de una pestaña:
 *
 *   const filtros = useFiltrosMercadeo();
 *   const { data, isLoading, error } = useDemanda(filtros.params);
 *   ...
 *   <PageHeader title="Demanda" actions={<FiltroPeriodo filtros={filtros} />} />
 *   <AvisoAnomalos filtros={filtros} />
 *   {isLoading ? <Loading /> : error ? <ErrorState error={error} /> : ...}
 */

export { useFiltrosMercadeo, PERIODO_PERSONALIZADO, type FiltrosMercadeo } from './use-filtros-mercadeo';
export { FiltroPeriodo } from './filtro-periodo';
export { AvisoAnomalos, FECHA_ANOMALA } from './aviso-anomalos';

// Re-exportados para que las pestañas importen todo desde un solo lugar.
export { KpiCard, type KpiCardProps } from '@/components/kpi-card';
export { PageHeader, Loading, ErrorState, EmptyState } from '@/components/estados';
