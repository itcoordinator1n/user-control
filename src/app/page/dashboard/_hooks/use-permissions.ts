"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function usePermissionsData(enabled: boolean) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !session?.user?.accessToken) return;
    setLoading(true);
    setError(null);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/get-permissions-personal-statistics`,
      { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
    )
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [enabled, session?.user?.accessToken]);

  return { data, loading, error };
}
