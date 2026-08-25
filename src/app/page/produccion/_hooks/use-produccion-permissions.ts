'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { computeProduccionPerms, type ProduccionPerms } from './produccion-perms';

export type { ProduccionPerms };

/**
 * Gate de acciones del módulo Producción. La lógica vive en
 * `produccion-perms.ts` (pura y testeable); aquí solo se extraen los slugs.
 */
export function useProduccionPermissions(): ProduccionPerms {
  const { data: session } = useSession();

  return useMemo(() => {
    const user = session?.user as
      | { permissions?: string[]; platformPermissions?: Record<string, string[]> }
      | undefined;

    // El backend agrupa por la plataforma del ROL, no la del permiso, así que
    // un slug puede caer en `_global`: leemos el array plano y todos los buckets.
    return computeProduccionPerms(
      [
        ...(user?.permissions ?? []),
        ...Object.values(user?.platformPermissions ?? {}).flat(),
      ],
      process.env.NEXT_PUBLIC_PROD_RBAC_ENFORCE === "true"
    );
  }, [session]);
}
