"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface DashboardSummaryData {
  activeEmployees: number;
  todayAttendance: {
    present: number;
    total: number;
    percentage: number;
  };
  pendingRequests: {
    permissions: number;
    vacations: number;
    total: number;
  };
}

export function useSummaryData() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session?.user?.accessToken]);

  return { data, loading, error };
}
