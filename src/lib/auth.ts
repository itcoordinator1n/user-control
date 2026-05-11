import { CustomAuthUser } from "@/types/next-auth.d";

/**
 * Verifica si un usuario tiene un permiso específico en una plataforma determinada.
 * 
 * @param user El objeto usuario obtenido de la sesión.
 * @param platform El slug de la plataforma (ej: 'tickets', 'bodega').
 * @param perm El identificador del permiso (ej: 'TICKET:ASSIGN').
 * @returns boolean
 */
export function hasPerm(
  user: CustomAuthUser | null | undefined,
  platform: string,
  perm: string
): boolean {
  if (!user) return false;
  
  // Verificación en el scope de la plataforma específica
  const platformPerms = user.platformPermissions?.[platform];
  if (platformPerms?.includes(perm)) return true;
  
  // Fallback opcional: verificar en el array plano global si existe
  // (útil para roles globales o durante la transición)
  if (user.permissions?.includes(perm)) return true;
  
  return false;
}
