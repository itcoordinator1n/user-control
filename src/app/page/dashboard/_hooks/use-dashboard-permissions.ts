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

  // Verificación simplificada usando el nuevo helper hasPerm para la plataforma 'permisos'
  const canView = (view: DashboardView): boolean => {
    // Si tiene permiso de administración global de plataforma, ve todo
    if (hasPerm(user, 'permisos', 'RRHH:ADMIN')) return true;
    
    // Verificación por vista específica
    switch (view) {
      case "attendance":
        return hasPerm(user, 'permisos', 'METRICS:ATTENDANCE') || hasPerm(user, 'permisos', 'METRICS:GENERAL');
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
  const isAreaRestricted = !hasPerm(user, 'permisos', 'RRHH:ADMIN') && !hasPerm(user, 'permisos', 'METRICS:GENERAL');

  // Área normalizada para comparar
  const normalizedArea = userArea ? normalizeArea(userArea) : null;

  return { canView, isAreaRestricted, userArea, normalizedArea, permissions };
}
