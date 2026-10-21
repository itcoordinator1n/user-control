'use client';

/**
 * `FunnelSteps` — avance por etapas, dibujado como barras horizontales decrecientes
 * (recharts no necesita su `FunnelChart` para esto). Muestra, por etapa, el valor
 * absoluto, el % respecto a la PRIMERA etapa y el % respecto a la etapa anterior respecto a la
 * etapa inmediatamente anterior.
 *
 * Reglas del repo: datos desestructurados antes del JSX (bug SWC con recharts) y
 * colores desde los tokens `--chart-*` del tema.
 */

import {
  Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AXIS_PROPS, TOOLTIP_STYLE, truncar, resolverColor, useChartColors,
} from './chart-theme';

export interface FunnelStep {
  label: string;
  value: number;
}

export interface FunnelStepsProps {
  steps: FunnelStep[];
  height?: number;
  formatValue?: (valor: number) => string;
  /** Oculta la tabla de porcentajes debajo del gráfico. */
  hideLegend?: boolean;
  emptyLabel?: string;
}

interface FilaEmbudo extends FunnelStep {
  etiquetaCorta: string;
  /** % respecto a la primera etapa. */
  pctInicio: number;
  /** % respecto a la etapa anterior. */
  pctAnterior: number;
}

const porDefecto = (valor: number) => new Intl.NumberFormat('es-HN').format(valor);
const pct = (n: number) => `${n.toFixed(1)}%`;

export function FunnelSteps({
  steps,
  height = 300,
  formatValue,
  hideLegend = false,
  emptyLabel = 'Sin datos para el período.',
}: FunnelStepsProps) {
  const paleta = useChartColors();

  // Extract all data before JSX — prevents SWC _ref bug with Recharts
  const formato = formatValue ?? porDefecto;
  const entradas = Array.isArray(steps) ? steps : [];
  const base = entradas.length > 0 ? Number(entradas[0].value) || 0 : 0;
  const filas: FilaEmbudo[] = entradas.map((etapa, i) => {
    const valor = Number(etapa.value) || 0;
    const anterior = i === 0 ? valor : Number(entradas[i - 1].value) || 0;
    return {
      label: etapa.label,
      etiquetaCorta: truncar(etapa.label, 16),
      value: valor,
      pctInicio: base > 0 ? (valor / base) * 100 : 0,
      pctAnterior: anterior > 0 ? (valor / anterior) * 100 : 0,
    };
  });
  const vacio = filas.length === 0 || base === 0;

  const Contenido = ({ active, payload }: { active?: boolean; payload?: Array<{ payload?: FilaEmbudo }> }) => {
    if (!active || !payload || payload.length === 0) return null;
    const fila = payload[0].payload;
    if (!fila) return null;
    return (
      <div style={TOOLTIP_STYLE} className="px-3 py-2">
        <p className="font-medium">{fila.label}</p>
        <p className="tabular-nums">{formato(fila.value)}</p>
        <p className="text-muted-foreground">{pct(fila.pctInicio)} del inicio</p>
        <p className="text-muted-foreground">{pct(fila.pctAnterior)} vs. etapa anterior</p>
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
    <div className="space-y-3">
      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filas} layout="vertical" margin={{ top: 8, right: 56, left: 4, bottom: 4 }}>
            <XAxis type="number" hide domain={[0, base]} />
            <YAxis type="category" dataKey="etiquetaCorta" width={120} {...AXIS_PROPS} interval={0} />
            <Tooltip content={<Contenido />} cursor={{ fill: 'currentColor', fillOpacity: 0.06 }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
              {filas.map((fila, i) => (
                <Cell key={fila.label + i} fill={resolverColor(i + 1, paleta, i)} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                className="fill-foreground text-[11px] tabular-nums"
                formatter={(valor: number) => formato(valor)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!hideLegend && (
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-5">
          {filas.map((fila, i) => (
            <div key={fila.label + i} className="rounded-lg border border-border bg-muted/30 px-2 py-1.5">
              <p className="truncate font-medium text-foreground" title={fila.label}>{fila.label}</p>
              <p className="tabular-nums text-muted-foreground">
                {formato(fila.value)} · {pct(fila.pctInicio)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
