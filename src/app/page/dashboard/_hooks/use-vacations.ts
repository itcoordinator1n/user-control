"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { VacationDataInterface, EmployeeVacationProfile } from "../_types/dashboard.types";

interface VacationHookData {
  vacationData: VacationDataInterface[];
  employeeVacationProfiles: { [key: string]: EmployeeVacationProfile };
}

export function useVacationData(enabled: boolean, area: string | null) {
  const { data: session } = useSession();
  const [data, setData] = useState<VacationHookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !session?.user?.accessToken) return;
    setLoading(true);
    setError(null);
    const token = session.user.accessToken;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const params = new URLSearchParams();
    if (area) params.set("area", area);
    const qs = params.toString() ? `?${params}` : "";

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/get-vacation-stats${qs}`, { headers })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then((d) => setData({ vacationData: d.stats, employeeVacationProfiles: d.profiles }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [enabled, session?.user?.accessToken, area]);

  return { data, loading, error };
}
