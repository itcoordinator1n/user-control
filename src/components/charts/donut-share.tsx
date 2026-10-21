'use client';

/**
 * `DonutShare` — dona de composición con leyenda y porcentaje.
 *
 * Reglas del repo: datos desestructurados antes del JSX (bug SWC con recharts) y
 * colores desde los tokens `--chart-*` del tema.
 */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { TOOLTIP_STYLE, resolverColor, useChartColors } from './chart-theme';

export interface DonutShareProps<T extends Record<string, unknown>> {
  data: T[];
  /** Campo con la etiqueta de cada porción. */
  labelKey: keyof T & string;
  /** Campo numérico con el valor de cada porción. */
  valueKey: keyof T & string;
  height?: number;
  formatValue?: (valor: number) => string;
  /** Agrupa el resto en "Otros" después de las N porciones más grandes. */
  maxSlices?: number;
  /**
   * Respeta el orden en que vienen los datos en vez de ordenar por tamaño.
   *
   * Hace falta cuando las porciones son una escala y no un ranking: la calidad de
   * sesión va de REBOTE a EXCELENTE, y ordenarla por tamaño la vuelve ilegible.
   */
  preservarOrden?: boolean;
  /** Texto chico en el centro de la dona; por defecto el total. */
  centerLabel?: string;
  emptyLabel?: string;
}

interface Porcion {
  etiqueta: string;
  valor: number;
  pct: number;
  color: string;
}

const porDefecto = (valor: number) => new Intl.NumberFormat('es-HN').format(valor);

export function DonutShare<T extends Record<string, unknown>>({
  data,
  labelKey,
  valueKey,
  height = 300,
  formatValue,
  maxSlices = 6,
  preservarOrden = false,
  centerLabel,
  emptyLabel = 'Sin datos para el período.',
}: DonutShareProps<T>) {
  const paleta = useChartColors();

  // Extract all data before JSX — prevents SWC _ref bug with Recharts
  const formato = formatValue ?? porDefecto;
  const crudas = (Array.isArray(data) ? data : []).map((item) => {
    const bruto = item[valueKey];
    return {
      etiqueta: String(item[labelKey] ?? '—'),
      valor: typeof bruto === 'number' ? bruto : Number(bruto ?? 0) || 0,
    };
  });
  const ordenadas = preservarOrden ? crudas : [...crudas].sort((a, b) => b.valor - a.valor);
  const visibles = ordenadas.slice(0, maxSlices);
  const resto = ordenadas.slice(maxSlices);
  if (resto.length > 0) {
    visibles.push({ etiqueta: 'Otros', valor: resto.reduce((acc, x) => acc + x.valor, 0) });
  }
  const total = visibles.reduce((acc, x) => acc + x.valor, 0);
  const porciones: Porcion[] = visibles.map((x, i) => ({
    etiqueta: x.etiqueta,
    valor: x.valor,
    pct: total > 0 ? (x.valor / total) * 100 : 0,
    color: resolverColor(i + 1, paleta, i),
  }));
  const vacio = porciones.length === 0 || total === 0;
  const textoCentro = centerLabel ?? formato(total);

  const Contenido = ({ active, payload }: { active?: boolean; payload?: Array<{ payload?: Porcion }> }) => {
    if (!active || !payload || payload.length === 0) return null;
    const porcion = payload[0].payload;
    if (!porcion) return null;
    return (
      <div style={TOOLTIP_STYLE} className="px-3 py-2">
        <p className="font-medium">{porcion.etiqueta}</p>
        <p className="tabular-nums text-muted-foreground">
          {formato(porcion.valor)} · {porcion.pct.toFixed(1)}%
        </p>
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
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full sm:flex-1" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={porciones}
              dataKey="valor"
              nameKey="etiqueta"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {porciones.map((porcion, i) => (
                <Cell key={porcion.etiqueta + i} fill={porcion.color} />
              ))}
            </Pie>
            <Tooltip content={<Contenido />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-foreground">{textoCentro}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</span>
        </div>
      </div>

      <ul className="w-full space-y-1.5 text-xs sm:w-48">
        {porciones.map((porcion, i) => (
          <li key={porcion.etiqueta + i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: porcion.color }}
            />
            <span className="min-w-0 flex-1 truncate text-foreground" title={porcion.etiqueta}>
              {porcion.etiqueta}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {porcion.pct.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
