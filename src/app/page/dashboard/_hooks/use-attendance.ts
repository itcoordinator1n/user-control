"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { AttendanceDataInterface } from "../_types/dashboard.types";

interface AttendanceHookData {
  attendanceData: AttendanceDataInterface[];
  // monthlyData and cardsData removed from initial load:
  //   - cardsData replaced by backend-calculated percentages in attendanceData
  //   - monthlyData fetched on-demand only when exporting to Excel
}

// attendance-history now accepts dateFrom/dateTo (YYYY-MM-DD) and returns
// percentages already calculated for that date range by the backend.
export function useAttendanceData(
  enabled: boolean,
  area: string | null,
  dateFrom?: string,
  dateTo?: string,
) {
  const { data: session } = useSession();
  const [data, setData] = useState<AttendanceHookData | null>(null);
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
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("lite", "true"); // skip byUser — profiles loaded on-demand
    const qs = `?${params}`;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/attendance-history${qs}`, { headers })
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then((historyData) => {
        setData({ attendanceData: historyData.attendanceData });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [enabled, session?.user?.accessToken, area, dateFrom, dateTo]);

  return { data, loading, error };
}
