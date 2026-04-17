"use client";

import { useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { EmployeeProfile } from "../_types/dashboard.types";

export interface ProfileParams {
  key: string;
  page?: number;
  limit?: number;
  /** "all" or a specific status value — "all" omits the param from the request */
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  /** When true, returns only records where the employee worked past end-of-schedule */
  hasOvertime?: boolean;
  /** When true, returns only records that had an approved permission on that day */
  hasPermission?: boolean;
  /** Filter to a specific day of week: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" */
  dayOfWeek?: string;
}

/** Stable cache key for a specific page + filter combination. */
function cacheKey({ key, page = 1, limit = 10, status = "all", dateFrom = "", dateTo = "", hasOvertime = false, hasPermission = false, dayOfWeek = "" }: ProfileParams) {
  return `${key}|${page}|${limit}|${status}|${dateFrom}|${dateTo}|${hasOvertime}|${hasPermission}|${dayOfWeek}`;
}

/**
 * On-demand employee profile loader with paginated records.
 *
 * Cache strategy:
 *   - Each unique combination of (key, page, limit, status, dateFrom, dateTo) is cached
 *     independently in a flat Map<string, EmployeeProfile>.
 *   - `isCached(key)` returns true if ANY page for that employee has been loaded,
 *     used to show the "cargado" indicator in the employee list.
 *   - Cache lives for the component lifetime (cleared on page refresh).
 *
 * Backend endpoint:
 *   GET /api/attendance/employee-profile
 *     ?key=juan-perez
 *     &page=1
 *     &limit=10
 *     [&status=late]
 *     [&dateFrom=YYYY-MM-DD]
 *     [&dateTo=YYYY-MM-DD]
 *
 *   Returns: EmployeeProfile  (records = current page only, + pagination object)
 */
export function useEmployeeProfile() {
  const { data: session } = useSession();
  const cache = useRef<Map<string, EmployeeProfile>>(new Map());
  const loadedKeys = useRef<Set<string>>(new Set()); // keys with at least one page loaded
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(
    async (params: ProfileParams): Promise<EmployeeProfile | null> => {
      const ck = cacheKey(params);
      if (cache.current.has(ck)) return cache.current.get(ck)!;

      if (!session?.user?.accessToken) return null;
      setLoading(true);
      setError(null);

      try {
        const { key, page = 1, limit = 10, status, dateFrom, dateTo, hasOvertime, hasPermission, dayOfWeek } = params;
        const qp = new URLSearchParams({ key, page: String(page), limit: String(limit) });
        if (status && status !== "all") qp.set("status", status);
        if (dateFrom) qp.set("dateFrom", dateFrom);
        if (dateTo) qp.set("dateTo", dateTo);
        if (hasOvertime) qp.set("hasOvertime", "true");
        if (hasPermission) qp.set("hasPermission", "true");
        if (dayOfWeek) qp.set("dayOfWeek", dayOfWeek);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/employee-profile?${qp}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.accessToken}`,
            },
          }
        );
        if (!res.ok) throw new Error(res.statusText);

        const profile: EmployeeProfile = await res.json();
        cache.current.set(ck, profile);
        loadedKeys.current.add(key);
        return profile;
      } catch (e: any) {
        setError(e.message ?? "Error al cargar perfil");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.accessToken]
  );

  /** True when any page for this employee key has been fetched. */
  const isCached = (key: string) => loadedKeys.current.has(key);

  return { fetchProfile, loading, error, isCached };
}
