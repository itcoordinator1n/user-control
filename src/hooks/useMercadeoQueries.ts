'use client';

/**
 * Hooks de React Query del módulo de Mercadeo.
 *
 * Patrón de `useTicketQueries.ts`: un `useToken()` local sobre `useSession()` y una
 * query por endpoint con `enabled: !!token` y `staleTime` de 5 minutos. El
 * `QueryClientProvider` ya está montado globalmente en `src/provider/QueryProvider.tsx`.
 *
 * Los cuatro hooks que consumen las pestañas son `useDemanda`, `useOportunidades`,
 * `useExperiencia` y `useOperacion`.
 */

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  fetchDemanda, fetchOportunidades, fetchExperiencia, fetchOperacion,
  type RangoParams, type DemandaDTO, type OportunidadesDTO, type ExperienciaDTO, type OperacionDTO,
} from '@/lib/services/mercadeo.service';

function useToken(): string {
  const { data: session } = useSession();
  return session?.user?.accessToken ?? '';
}

const STALE = 5 * 60_000;

// ─── Mercadeo ─────────────────────────────────────────────────────────────────

/** Pestaña Demanda: productos, categorías, términos, intenciones y ciudades. */
export function useDemanda(params?: RangoParams) {
  const token = useToken();
  return useQuery<DemandaDTO>({
    queryKey: ['mercadeo-demanda', params],
    queryFn: () => fetchDemanda(token, params),
    enabled: !!token, staleTime: STALE,
  });
}

/** Pestaña Oportunidades: demanda no cubierta, catálogo sin demanda, competidores, segmentos. */
export function useOportunidades(params?: RangoParams) {
  const token = useToken();
  return useQuery<OportunidadesDTO>({
    queryKey: ['mercadeo-oportunidades', params],
    queryFn: () => fetchOportunidades(token, params),
    enabled: !!token, staleTime: STALE,
  });
}

/** Pestaña Experiencia: embudo, tasa de fallo, UX por categoría, turnos y cadenas. */
export function useExperiencia(params?: RangoParams) {
  const token = useToken();
  return useQuery<ExperienciaDTO>({
    queryKey: ['mercadeo-experiencia', params],
    queryFn: () => fetchExperiencia(token, params),
    enabled: !!token, staleTime: STALE,
  });
}

/** Pestaña Operación: volumen, costo por modelo, latencia y uso de respaldo. */
export function useOperacion(params?: RangoParams) {
  const token = useToken();
  return useQuery<OperacionDTO>({
    queryKey: ['mercadeo-operacion', params],
    queryFn: () => fetchOperacion(token, params),
    enabled: !!token, staleTime: STALE,
  });
}

export type {
  RangoParams, Periodo,
  DemandaDTO, OportunidadesDTO, ExperienciaDTO, OperacionDTO,
} from '@/lib/services/mercadeo.service';
