'use client';

/**
 * Puente entre los tokens de tema (`--chart-1` … `--chart-5`, definidos en
 * `src/app/globals.css` para claro y oscuro y cableados en `tailwind.config.ts`
 * como `colors.chart`) y recharts.
 *
 * Recharts necesita un color *resuelto* para el atributo `fill`/`stroke` de los SVG;
 * no se puede confiar en que `var()` se resuelva ahí en todos los navegadores. Por eso
 * leemos los tokens del `<html>` en tiempo de ejecución y los re-leemos cuando cambia
 * la clase del documento (el tema oscuro se activa con `class`, ver `darkMode` del
 * config de Tailwind). Resultado: los gráficos cambian de color con el tema sin un
 * solo hex hardcodeado en los componentes.
 */

import { useEffect, useState } from 'react';

export const CHART_TOKENS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const;

/** Índice de paleta (1-5) o cualquier color CSS válido. */
export type ChartColor = number | string;

/** Valores del tema claro de `globals.css`; sólo se usan en SSR / primer render. */
const FALLBACK: readonly string[] = [
  'hsl(12 76% 61%)',
  'hsl(173 58% 39%)',
  'hsl(197 37% 24%)',
  'hsl(43 74% 66%)',
  'hsl(27 87% 67%)',
];

function leerPaleta(): string[] {
  if (typeof window === 'undefined' || typeof document === 'undefined') return [...FALLBACK];
  const estilos = getComputedStyle(document.documentElement);
  return CHART_TOKENS.map((token, i) => {
    const valor = estilos.getPropertyValue(token).trim();
    return valor ? `hsl(${valor})` : FALLBACK[i];
  });
}

/** Paleta de 5 colores tomada del tema activo. Se actualiza al alternar claro/oscuro. */
export function useChartColors(): string[] {
  const [paleta, setPaleta] = useState<string[]>(() => [...FALLBACK]);

  useEffect(() => {
    const sincronizar = () => setPaleta(leerPaleta());
    sincronizar();
    const observador = new MutationObserver(sincronizar);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    });
    return () => observador.disconnect();
  }, []);

  return paleta;
}

/** Resuelve `ChartColor` contra la paleta: un número es índice 1-5, un string pasa tal cual. */
export function resolverColor(color: ChartColor | undefined, paleta: string[], porDefecto = 0): string {
  if (typeof color === 'string' && color.length > 0) return color;
  const indice = typeof color === 'number' ? color - 1 : porDefecto;
  return paleta[((indice % paleta.length) + paleta.length) % paleta.length];
}

/** Estilo del tooltip de recharts, igual al único gráfico del repo que respeta el tema. */
export const TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: '12px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  fontSize: '12px',
};

/** Props comunes de los ejes: color heredado del tema vía `currentColor`. */
export const AXIS_PROPS = {
  tick: { fontSize: 12, fill: 'currentColor' },
  className: 'text-muted-foreground',
  tickLine: false,
  axisLine: false,
} as const;

/** Props comunes del grid. */
export const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'currentColor',
  className: 'text-border',
} as const;

/** Corta un texto a `max` caracteres agregando elipsis. */
export function truncar(texto: string, max = 18): string {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max - 1).trimEnd()}…`;
}
