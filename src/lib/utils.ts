import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza un nombre de area para comparar: minusculas y sin tildes.
 * "Liquidos" y "LIQUIDOS" se consideran la misma area.
 */
export function normalizeArea(area: string): string {
  return area
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
