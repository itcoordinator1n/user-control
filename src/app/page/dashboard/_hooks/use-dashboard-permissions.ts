"use client";

import { useSession } from "next-auth/react";
import type { DashboardView } from "../_types/dashboard.types";
import { hasPerm } from "@/lib/auth";

// Normaliza nombre de área al formato que usa el backend en los strings de permiso:
// "Administración" → "administracion" (minúsculas, sin tildes)
function normalizeArea(area: string): string {
  return area
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function useDashboardPermissions() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const permissions = user?.permissions ?? [];
  const userArea = user?.area?.name ?? null;

  // Un jefe entra al dashboard por jerarquía: ve los marcajes de su equipo y nada más.
  // Es alcance por organigrama, no por área.
  const tieneAlcanceEquipo =
    hasPerm(user, 'permisos', 'dashboard:team:view') ||
    hasPerm(user, 'permisos', 'dashboard:team:tree:view');

  // Quien coordina un área sin ser jefe en el organigrama: ve su área completa.
  const tieneAlcanceArea = hasPerm(user, 'permisos', 'dashboard:area:view');

  // Quien además tiene un permiso de alcance amplio no queda limitado por lo anterior.
  const tieneAlcanceAmplio =
    hasPerm(user, 'permisos', 'RRHH:ADMIN') ||
    hasPerm(user, 'permisos', 'METRICS:GENERAL') ||
    hasPerm(user, 'permisos', 'dashboard:all:view');

  // Verificación simplificada usando el nuevo helper hasPerm para la plataforma 'permisos'
  const canView = (view: DashboardView): boolean => {
    // Si tiene permiso de administración global de plataforma, ve todo
    if (hasPerm(user, 'permisos', 'RRHH:ADMIN')) return true;

    // Jefe sin alcance amplio: solo Asistencia. Las demás vistas (vacaciones, permisos,
    // hr-admin) consultan endpoints que agrupan POR ÁREA y no entienden de jerarquía;
    // dejarlas visibles le mostraría a un jefe los datos de toda su área, mucha más
    // gente de la que tiene a cargo. El backend además devuelve vacío en esos casos,
    // así que esto es la capa de presentación de una restricción que ya es real.
    if ((tieneAlcanceEquipo || tieneAlcanceArea) && !tieneAlcanceAmplio) {
      return view === "attendance";
    }

    // Verificación por vista específica
    switch (view) {
      case "attendance":
        return hasPerm(user, 'permisos', 'METRICS:ATTENDANCE') || hasPerm(user, 'permisos', 'METRICS:GENERAL');
      // (el caso del jefe por jerarquía se resolvió antes del switch)
      case "vacations":
        return hasPerm(user, 'permisos', 'RRHH:PERMITS_VIEW') || hasPerm(user, 'permisos', 'METRICS:VACATIONS');
      case "permissions":
        return hasPerm(user, 'permisos', 'RRHH:APPLICATIONS_MANAGE') || hasPerm(user, 'permisos', 'METRICS:PERMITS');
      case "hr-admin":
        return hasPerm(user, 'permisos', 'RRHH:ADMIN');
      default:
        return false;
    }
  };

  // true = el usuario solo ve su propia área (no tiene permisos de administrador o globales)
  // El jefe por jerarquía queda fuera: su alcance no es un área sino su equipo, que puede
  // abarcar varias (Javier Fernández tiene gente en Planta, Logística y Mantenimiento).
  // Forzarle el filtro de su propia área le escondería a los suyos de las otras dos.
  // Quien tiene dashboard:area:view sí sigue restringido: su alcance ES un área.
  const isAreaRestricted =
    !hasPerm(user, 'permisos', 'RRHH:ADMIN') &&
    !hasPerm(user, 'permisos', 'METRICS:GENERAL') &&
    !tieneAlcanceEquipo;

  // Área normalizada para comparar
  const normalizedArea = userArea ? normalizeArea(userArea) : null;

  return { canView, isAreaRestricted, userArea, normalizedArea, permissions };
}
