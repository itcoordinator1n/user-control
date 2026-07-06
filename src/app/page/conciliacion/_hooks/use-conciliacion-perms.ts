/**
 * use-conciliacion-perms.ts — Gate blando de acciones del módulo Conciliación.
 *
 * El backend tiene RBAC OPT-IN (EQUIPOS_RBAC_ENFORCE): mientras esté apagado,
 * ningún usuario tiene los slugs EQUIPO:/CONCILIACION: en su JWT. Para no
 * ocultar toda la UI antes de sembrar 008_equipos_rbac.sql, aplicamos
 * DEFAULT-ALLOW cuando el usuario no tiene NINGÚN slug del módulo (= no
 * provisionado). Cuando el RBAC se active y al usuario se le asignen permisos,
 * el gate empieza a respetarlos automáticamente.
 */
'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';

export interface ConciliacionPerms {
  provisioned: boolean;
  canRead: boolean;
  canMatch: boolean;
  canConfirmarBaja: boolean;
  canRegistrar: boolean;
  canExportar: boolean;
  canAdmin: boolean;
}

export function useConciliacionPerms(): ConciliacionPerms {
  const { data: session } = useSession();

  return useMemo(() => {
    const user = session?.user as
      | { permissions?: string[]; platformPermissions?: Record<string, string[]> }
      | undefined;

    const all = new Set<string>([
      ...(user?.permissions ?? []),
      ...Object.values(user?.platformPermissions ?? {}).flat(),
    ]);

    const provisioned = [...all].some(
      (p) => p.startsWith('EQUIPO:') || p.startsWith('CONCILIACION:'),
    );

    // default-allow si no está provisionado
    const has = (slug: string) => !provisioned || all.has(slug);

    return {
      provisioned,
      canRead: has('CONCILIACION:READ') || has('EQUIPO:READ'),
      canMatch: has('CONCILIACION:MATCH'),
      canConfirmarBaja: has('CONCILIACION:CONFIRMAR_BAJA'),
      canRegistrar: has('CONCILIACION:REGISTRAR') || has('EQUIPO:ADMIN'),
      canExportar: has('CONCILIACION:EXPORTAR'),
      canAdmin: has('EQUIPO:ADMIN'),
    };
  }, [session]);
}
