'use client';

/**
 * `BarRanking` — barras horizontales para rankings (top productos, términos, ciudades…).
 *
 * Reglas del repo que se cumplen acá:
 *  - Todos los datos se desestructuran ANTES del JSX (bug del compilador SWC con
 *    recharts; ver el comentario en `src/app/page/ticket-mgmt/page.tsx:134`).
 *  - Los colores vienen de los tokens `--chart-*` del tema, nunca de hex.
 */

import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, truncar, resolverColor, useChartColors,
  type ChartColor,
} from './chart-theme';

export interface BarRankingProps<T extends Record<string, unknown>> {
  data: T[];
  /** Campo con la etiqueta de cada barra. */
  labelKey: keyof T & string;
  /** Campo numérico con el valor de cada barra. */
  valueKey: keyof T & string;
  height?: number;
  /** Formateo del valor en el eje y el tooltip. */
  formatValue?: (valor: number) => string;
  /** Índice de paleta (1-5) o color CSS. Por defecto `--chart-1`. */
  color?: ChartColor;
  /** Largo máximo de la etiqueta del eje antes de truncar con elipsis. */
  maxLabel?: number;
  /** Degrada el color de las barras siguiendo la paleta en vez de usar uno solo. */
  multicolor?: boolean;
  emptyLabel?: string;
}

interface Fila {
  etiqueta: string;
  etiquetaCorta: string;
  valor: number;
}

const porDefecto = (valor: number) => new Intl.NumberFormat('es-HN').format(valor);

export function BarRanking<T extends Record<string, unknown>>({
  data,
  labelKey,
  valueKey,
  height = 320,
  formatValue,
  color,
  maxLabel = 18,
  multicolor = false,
  emptyLabel = 'Sin datos para el período.',
}: BarRankingProps<T>) {
  const paleta = useChartColors();

  // Extract all data before JSX — prevents SWC _ref bug with Recharts
  const formato = formatValue ?? porDefecto;
  const filas: Fila[] = (Array.isArray(data) ? data : []).map((item) => {
    const etiqueta = String(item[labelKey] ?? '—');
    const bruto = item[valueKey];
    return {
      etiqueta,
      etiquetaCorta: truncar(etiqueta, maxLabel),
      valor: typeof bruto === 'number' ? bruto : Number(bruto ?? 0) || 0,
    };
  });
  const colorBase = resolverColor(color, paleta, 0);
  const anchoEje = Math.min(200, Math.max(90, maxLabel * 7));
  const vacio = filas.length === 0;

  const Contenido = ({ active, payload }: { active?: boolean; payload?: Array<{ payload?: Fila }> }) => {
    if (!active || !payload || payload.length === 0) return null;
    const fila = payload[0].payload;
    if (!fila) return null;
    return (
      <div style={TOOLTIP_STYLE} className="px-3 py-2">
        <p className="font-medium">{fila.etiqueta}</p>
        <p className="tabular-nums text-muted-foreground">{formato(fila.valor)}</p>
      </div>
    );
  };

  if (vacio) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filas} layout="vertical" margin={{ top: 8, right: 24, left: 4, bottom: 4 }}>
          <CartesianGrid {...GRID_PROPS} horizontal={false} />
          <XAxis type="number" {...AXIS_PROPS} tickFormatter={formato} />
          <YAxis
            type="category"
            dataKey="etiquetaCorta"
            width={anchoEje}
            {...AXIS_PROPS}
            interval={0}
          />
          <Tooltip content={<Contenido />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
          <Bar dataKey="valor" radius={[0, 6, 6, 0]} fill={colorBase} maxBarSize={28}>
            {multicolor
              ? filas.map((fila, i) => (
                  <Cell key={fila.etiqueta + i} fill={resolverColor(i + 1, paleta, i)} />
                ))
              : null}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
