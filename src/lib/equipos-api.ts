/**
 * equipos-api.ts — Cliente REST tipado del módulo Control de Equipos +
 * Conciliación. Espeja el patrón de src/lib/ticket-api.ts.
 * Base: ${NEXT_PUBLIC_API_URL}/api/equipos. Auth: Authorization: Bearer <token>.
 */

import type {
  ResumenConciliacion, ResumenPorCeco, ResumenPorAccion,
  ActivoContable, ActivoDetalle, ActivosFiltros,
  Equipo, EquipoDetalle, Captura,
  CandidatoBaja, PorRegistrar, Conciliado, RevisionManual, Ambiguo,
  MatchPayload, PatchActivoPayload,
  MatchResult, OkResult, AutoMatchResult, ImportResult, ImportRow, ImportMeta,
} from '@/types/conciliacion';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/equipos`;

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errBody: unknown;
    try { errBody = await res.json(); } catch { errBody = { message: res.statusText }; }
    const b = errBody as Record<string, unknown> | string;
    const errorMessage =
      (typeof b === 'object' && b && (b.error as string)) ||
      (typeof b === 'object' && b && (b.message as string)) ||
      (typeof b === 'string' ? b : JSON.stringify(b));
    throw new Error(`[${res.status}] ${errorMessage}`);
  }

  // 204 sin cuerpo
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Descarga autenticada de un endpoint que responde texto/binario (CSV). */
async function apiDownload(path: string, token: string): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`[${res.status}] No se pudo descargar`);
  return res.blob();
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

const enc = encodeURIComponent;

// ─── Resumen (P1) ────────────────────────────────────────────────────────────
export const getResumen = (token: string) =>
  apiFetch<ResumenConciliacion>('/conciliacion/resumen', token);
export const getResumenPorCeco = (token: string) =>
  apiFetch<ResumenPorCeco[]>('/conciliacion/resumen/por-ceco', token);
export const getResumenPorAccion = (token: string) =>
  apiFetch<ResumenPorAccion[]>('/conciliacion/resumen/por-accion', token);

// ─── Activos (P2 / P3) ───────────────────────────────────────────────────────
export const getActivos = (token: string, f: ActivosFiltros = {}) =>
  apiFetch<ActivoContable[]>(
    '/conciliacion/activos' + buildQuery({
      q: f.q, estado: f.estado, tipo: f.tipo, ceco: f.ceco,
      autoAuditable: f.autoAuditable ? 'true' : undefined,
      limite: f.limite, offset: f.offset,
    }),
    token,
  );

export const getActivoDetalle = (token: string, actFijo: string) =>
  apiFetch<ActivoDetalle>(`/conciliacion/activos/${enc(actFijo)}`, token);

export const getActivoCandidatos = (token: string, actFijo: string) =>
  apiFetch<Equipo[]>(`/conciliacion/activos/${enc(actFijo)}/candidatos`, token);

export const patchActivo = (token: string, actFijo: string, body: PatchActivoPayload) =>
  apiFetch<OkResult>(`/conciliacion/activos/${enc(actFijo)}`, token, {
    method: 'PATCH', body: JSON.stringify(body),
  });

export const matchActivo = (token: string, actFijo: string, body: MatchPayload) =>
  apiFetch<MatchResult>(`/conciliacion/activos/${enc(actFijo)}/match`, token, {
    method: 'POST', body: JSON.stringify(body),
  });

/** Deshacer match / marcar no encontrado. nuevoEstado ∈ pendiente|no_encontrado|descartado */
export const unmatchActivo = (token: string, actFijo: string, nuevoEstado: string = 'no_encontrado') =>
  apiFetch<OkResult>(`/conciliacion/activos/${enc(actFijo)}/match`, token, {
    method: 'DELETE', body: JSON.stringify({ nuevoEstado }),
  });

export const confirmarBaja = (token: string, actFijo: string) =>
  apiFetch<OkResult>(`/conciliacion/activos/${enc(actFijo)}/confirmar-baja`, token, { method: 'POST' });

// ─── Emparejamiento (P4) ─────────────────────────────────────────────────────
export const getAmbiguos = (token: string) =>
  apiFetch<Ambiguo[]>('/conciliacion/ambiguos', token);
export const getEquiposSinActivo = (token: string) =>
  apiFetch<Equipo[]>('/conciliacion/equipos-sin-activo', token);
export const getEquipoCandidatosActivo = (token: string, id: number) =>
  apiFetch<ActivoContable[]>(`/${id}/candidatos-activo`, token);
export const autoMatch = (token: string, loteId?: number) =>
  apiFetch<AutoMatchResult>('/conciliacion/auto-match', token, {
    method: 'POST', body: JSON.stringify(loteId ? { loteId } : {}),
  });

// ─── Vistas (P5 / P6 / otros) ────────────────────────────────────────────────
export const getCandidatosBaja = (token: string) =>
  apiFetch<CandidatoBaja[]>('/conciliacion/candidatos-baja', token);
export const getPorRegistrar = (token: string) =>
  apiFetch<PorRegistrar[]>('/conciliacion/por-registrar', token);
export const getConciliados = (token: string) =>
  apiFetch<Conciliado[]>('/conciliacion/conciliados', token);
export const getRevisionManual = (token: string) =>
  apiFetch<RevisionManual[]>('/conciliacion/revision-manual', token);

export const downloadCandidatosBajaCsv = (token: string) =>
  apiDownload('/conciliacion/candidatos-baja?format=csv', token);
export const downloadPorRegistrarCsv = (token: string) =>
  apiDownload('/conciliacion/por-registrar?format=csv', token);

// ─── Inventario / equipos ────────────────────────────────────────────────────
export const buscarEquipos = (token: string, q: string) =>
  apiFetch<Equipo[]>('/buscar' + buildQuery({ q }), token);
export const getEquipoDetalle = (token: string, id: number) =>
  apiFetch<EquipoDetalle>(`/${id}/detalle`, token);
export const getEquipoCapturas = (token: string, id: number) =>
  apiFetch<Captura[]>(`/${id}/capturas`, token);
export const registrarEquipo = (token: string, id: number, actFijoAsignado: string | null) =>
  apiFetch<OkResult>(`/${id}/registrar`, token, {
    method: 'POST', body: JSON.stringify({ actFijoAsignado }),
  });

// ─── Import (P7) ─────────────────────────────────────────────────────────────
export const importActivos = (token: string, rows: ImportRow[], meta: ImportMeta) =>
  apiFetch<ImportResult>('/conciliacion/import', token, {
    method: 'POST', body: JSON.stringify({ rows, meta }),
  });
