"use client";

import { useSession } from "next-auth/react";
import type { DashboardView } from "../_types/dashboard.types";

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
  const permissions = session?.user?.permissions ?? [];
  const userArea = session?.user?.area?.name ?? null;

  // El backend aún no emite strings dashboard:* — mientras no exista ninguno, mostrar todo.
  const hasDashboardStrings = permissions.some((p) => p.startsWith("dashboard:"));

  const canView = (view: DashboardView): boolean => {
    if (!hasDashboardStrings) return true; // fallback permisivo hasta que el backend los emita
    if (permissions.includes("dashboard:all:view")) return true; // acceso total
    switch (view) {
      case "attendance":
        return permissions.includes("dashboard:attendance:view");
      case "vacations":
        return permissions.includes("dashboard:vacations:view");
      case "permissions":
        return permissions.includes("dashboard:permissions:view");
      default:
        return false;
    }
  };

  // true = el usuario solo ve su propia área (no tiene dashboard:all:view)
  const isAreaRestricted =
    hasDashboardStrings && !permissions.includes("dashboard:all:view");

  // Área normalizada para comparar con strings dashboard:area:<nombre>:view
  const normalizedArea = userArea ? normalizeArea(userArea) : null;

  return { canView, isAreaRestricted, userArea, normalizedArea, permissions };
}
