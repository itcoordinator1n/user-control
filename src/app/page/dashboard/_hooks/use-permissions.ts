"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function usePermissionsData(
  enabled: boolean,
  area?: string | null,
  dateFrom?: string,
  dateTo?: string
) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !session?.user?.accessToken) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (area && area !== "Todas") params.set("area", area);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const qs = `?${params.toString()}`;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/get-permissions-personal-statistics${qs}`,
      { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
    )
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [enabled, session?.user?.accessToken, area, dateFrom, dateTo]);

  return { data, loading, error };
}
