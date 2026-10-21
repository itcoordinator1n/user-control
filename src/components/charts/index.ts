/**
 * Gráficos reutilizables sobre recharts, con los colores tomados de los tokens
 * `--chart-1` … `--chart-5` del tema (claro y oscuro).
 *
 * Al usarlos: desestructuren los datos ANTES del JSX. Hay un bug del compilador SWC
 * con recharts documentado en `src/app/page/ticket-mgmt/page.tsx:134`; nunca pongan
 * `data?.foo` inline dentro de un componente de recharts.
 */

export { BarRanking, type BarRankingProps } from './bar-ranking';
export { FunnelSteps, type FunnelStep, type FunnelStepsProps } from './funnel-steps';
export { DonutShare, type DonutShareProps } from './donut-share';
export {
  useChartColors,
  resolverColor,
  truncar,
  CHART_TOKENS,
  TOOLTIP_STYLE,
  AXIS_PROPS,
  GRID_PROPS,
  type ChartColor,
} from './chart-theme';
