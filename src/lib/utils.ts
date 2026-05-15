import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function adjustTimeRange(timeRange: string | undefined | null): string {
  if (!timeRange) return "";
  return timeRange.replace(/(\d{1,2}):(\d{2})/g, (match, h, m) => {
    let hours = parseInt(h, 10);
    // Subtract 6 hours in 24-hour format
    let adjustedHours = (hours - 6 + 24) % 24;
    return `${adjustedHours.toString().padStart(2, "0")}:${m}`;
  });
}
