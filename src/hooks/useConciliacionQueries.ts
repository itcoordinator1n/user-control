/**
 * useConciliacionQueries.ts — Hooks React Query del módulo Conciliación.
 * Espeja el patrón de src/hooks/useTicketQueries.ts (useToken + enabled:!!token).
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import * as api from '@/lib/equipos-api';
import type {
  ActivosFiltros, MatchPayload, PatchActivoPayload, ImportRow, ImportMeta,
} from '@/types/conciliacion';

function useToken(): string {
  const { data: session } = useSession();
  return session?.user?.accessToken ?? '';
}

// ─── Queries ─────────────────────────────────────────────────────────────────
export function useResumen() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'resumen'], queryFn: () => api.getResumen(token), enabled: !!token });
}
export function useResumenPorCeco() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'resumen', 'ceco'], queryFn: () => api.getResumenPorCeco(token), enabled: !!token });
}
export function useResumenPorAccion() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'resumen', 'accion'], queryFn: () => api.getResumenPorAccion(token), enabled: !!token });
}

export function useActivos(filtros: ActivosFiltros) {
  const token = useToken();
  return useQuery({
    queryKey: ['conc', 'activos', filtros],
    queryFn: () => api.getActivos(token, filtros),
    enabled: !!token,
    staleTime: 15_000,
  });
}

export function useActivoDetalle(actFijo: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['conc', 'activo', actFijo],
    queryFn: () => api.getActivoDetalle(token, actFijo),
    enabled: !!token && !!actFijo,
  });
}

export function useActivoCandidatos(actFijo: string, enabled = true) {
  const token = useToken();
  return useQuery({
    queryKey: ['conc', 'activo', actFijo, 'candidatos'],
    queryFn: () => api.getActivoCandidatos(token, actFijo),
    enabled: !!token && !!actFijo && enabled,
  });
}

export function useEquipoDetalle(id: number | null | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ['conc', 'equipo', id],
    queryFn: () => api.getEquipoDetalle(token, id as number),
    enabled: !!token && !!id,
  });
}

export function useEquipoCapturas(id: number | null | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ['conc', 'equipo', id, 'capturas'],
    queryFn: () => api.getEquipoCapturas(token, id as number),
    enabled: !!token && !!id,
  });
}

export function useEquipoCandidatosActivo(id: number | null | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ['conc', 'equipo', id, 'candidatos-activo'],
    queryFn: () => api.getEquipoCandidatosActivo(token, id as number),
    enabled: !!token && !!id,
  });
}

export function useAmbiguos() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'ambiguos'], queryFn: () => api.getAmbiguos(token), enabled: !!token });
}
export function useEquiposSinActivo() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'equipos-sin-activo'], queryFn: () => api.getEquiposSinActivo(token), enabled: !!token });
}
export function useCandidatosBaja() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'candidatos-baja'], queryFn: () => api.getCandidatosBaja(token), enabled: !!token });
}
export function usePorRegistrar() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'por-registrar'], queryFn: () => api.getPorRegistrar(token), enabled: !!token });
}
export function useConciliados() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'conciliados'], queryFn: () => api.getConciliados(token), enabled: !!token });
}
export function useRevisionManual() {
  const token = useToken();
  return useQuery({ queryKey: ['conc', 'revision-manual'], queryFn: () => api.getRevisionManual(token), enabled: !!token });
}

// ─── Mutaciones ──────────────────────────────────────────────────────────────
function useInvalidateConc() {
  const qc = useQueryClient();
  return (actFijo?: string) => {
    qc.invalidateQueries({ queryKey: ['conc'] });
    if (actFijo) qc.invalidateQueries({ queryKey: ['conc', 'activo', actFijo] });
  };
}

export function useMatch() {
  const token = useToken();
  const invalidate = useInvalidateConc();
  return useMutation({
    mutationFn: ({ actFijo, payload }: { actFijo: string; payload: MatchPayload }) =>
      api.matchActivo(token, actFijo, payload),
    onSuccess: (_r, { actFijo }) => invalidate(actFijo),
  });
}

export function useUnmatch() {
  const token = useToken();
  const invalidate = useInvalidateConc();
  return useMutation({
    mutationFn: ({ actFijo, nuevoEstado }: { actFijo: string; nuevoEstado?: string }) =>
      api.unmatchActivo(token, actFijo, nuevoEstado),
    onSuccess: (_r, { actFijo }) => invalidate(actFijo),
  });
}

export function usePatchActivo() {
  const token = useToken();
  const invalidate = useInvalidateConc();
  return useMutation({
    mutationFn: ({ actFijo, body }: { actFijo: string; body: PatchActivoPayload }) =>
      api.patchActivo(token, actFijo, body),
    onSuccess: (_r, { actFijo }) => invalidate(actFijo),
  });
}

export function useConfirmarBaja() {
  const token = useToken();
  const invalidate = useInvalidateConc();
  return useMutation({
    mutationFn: (actFijo: string) => api.confirmarBaja(token, actFijo),
    onSuccess: (_r, actFijo) => invalidate(actFijo),
  });
}

export function useRegistrarEquipo() {
  const token = useToken();
  const invalidate = useInvalidateConc();
  return useMutation({
    mutationFn: ({ id, actFijoAsignado }: { id: number; actFijoAsignado: string | null }) =>
      api.registrarEquipo(token, id, actFijoAsignado),
    onSuccess: () => invalidate(),
  });
}

export function useAutoMatch() {
  const token = useToken();
  const invalidate = useInvalidateConc();
  return useMutation({
    mutationFn: (loteId?: number) => api.autoMatch(token, loteId),
    onSuccess: () => invalidate(),
  });
}

export function useImport() {
  const token = useToken();
  const invalidate = useInvalidateConc();
  return useMutation({
    mutationFn: ({ rows, meta }: { rows: ImportRow[]; meta: ImportMeta }) =>
      api.importActivos(token, rows, meta),
    onSuccess: () => invalidate(),
  });
}

export { useToken };
