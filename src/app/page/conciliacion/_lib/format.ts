/**
 * format.ts — Helpers puros de formato/etiquetas para el módulo Conciliación.
 */
import type {
  EstadoBusqueda, AccionContable, EstadoContable, TipoActivo, SerieOrigen,
} from '@/types/conciliacion';

export function fmtMoneda(v: number | null | undefined, moneda = 'HNL'): string {
  if (v === null || v === undefined) return '—';
  try {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: moneda, maximumFractionDigits: 2 }).format(v);
  } catch {
    return v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function fmtFecha(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function fmtFechaHora(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString('es-HN', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Deriva el origen de la serie a partir de serie_original / serie_match. */
export function serieOrigen(
  serieOriginal: string | null | undefined,
  serieMatch: string | null | undefined,
): SerieOrigen {
  const norm = (serieOriginal ?? '').trim().toUpperCase().replace(/[\s.\-]/g, '');
  if (norm && norm !== '0') return 'columna';
  if (serieMatch) return 'extraida';
  return 'sin_serie';
}

export const SERIE_ORIGEN_LABEL: Record<SerieOrigen, string> = {
  columna: 'columna',
  extraida: 'extraída',
  sin_serie: 'sin serie',
};

export const ESTADO_BUSQUEDA_LABEL: Record<EstadoBusqueda, string> = {
  pendiente: 'Pendiente',
  encontrado: 'Encontrado',
  no_encontrado: 'No encontrado',
  descartado: 'Descartado',
  baja_confirmada: 'Baja confirmada',
};

export const ACCION_LABEL: Record<AccionContable, string> = {
  dar_de_baja: 'Dar de baja',
  inventariar: 'Inventariar',
  ninguna: 'Ninguna',
};

export const ESTADO_CONTABLE_LABEL: Record<EstadoContable, string> = {
  depreciado: 'Depreciado',
  por_depreciar: 'Por depreciar',
  desconocido: 'Desconocido',
};

export const TIPO_ACTIVO_LABEL: Record<TipoActivo, string> = {
  computadora: 'Computadora', laptop: 'Laptop', servidor: 'Servidor', monitor: 'Monitor',
  impresora: 'Impresora', proyector: 'Proyector', ups: 'UPS', red: 'Red',
  almacenamiento: 'Almacenamiento', tv: 'TV', camara: 'Cámara', mac: 'Mac', otro: 'Otro',
};

export const ESTADO_BUSQUEDA_OPTS: EstadoBusqueda[] = [
  'pendiente', 'encontrado', 'no_encontrado', 'descartado', 'baja_confirmada',
];
export const ACCION_OPTS: AccionContable[] = ['dar_de_baja', 'inventariar', 'ninguna'];
export const TIPO_ACTIVO_OPTS: TipoActivo[] = [
  'computadora', 'laptop', 'servidor', 'monitor', 'impresora', 'proyector',
  'ups', 'red', 'almacenamiento', 'tv', 'camara', 'mac', 'otro',
];
