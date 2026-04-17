// ─── Asistencias ────────────────────────────────────────────────────────────

/** Approved permission that covers (or overlaps) an attendance record's day. */
export interface PermissionInfo {
  id: number;
  /** "HH:mm" — null means the permission covers the full work day */
  startTime: string | null;
  endTime: string | null;
  reason: string;
  /** Backend-computed type for display labelling */
  type?: "late_arrival" | "early_departure" | "full_day" | "partial" | null;
}

export interface AttendanceRecord {
  id: string | null;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  status:
    | "on_time"
    | "late"
    | "early_departure"
    | "absent"
    | "incomplete"
    | "early_arrival";
  notes?: string;
  /** Approved permission that applies to this day, if any. */
  permission?: PermissionInfo | null;
  /** Active vacation request that covers this day. */
  vacation?: { id: string; startDate: string; endDate: string } | null;
  /** Public or company holiday on this day. */
  holiday?: { name: string; isNational: boolean } | null;
}

export interface RecordsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Per-weekday count used for the distribution mini-charts. */
export interface WeeklyDayCount {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
}

export interface EmployeeProfile {
  id: string | null;
  name: string;
  area: string;
  supervisor: string;
  position: string;
  attendanceRate: number;
  lateArrivals: number;
  absences: number;
  records: AttendanceRecord[];   // current page only
  pagination: RecordsPagination; // server-side pagination info
  /** Full-history distribution by weekday — computed by backend, not affected by page/filter. */
  weeklyDistribution: {
    absences: WeeklyDayCount;
    lateArrivals: WeeklyDayCount;
    incomplete: WeeklyDayCount;
    onTime: WeeklyDayCount;
  };
}

export interface AttendanceDataInterface {
  area: string;
  total: number;
  present: number;
  percentage: number;
  trend: number;
  employees: { name: string; key?: string; attendance: number; status: string }[];
}

// ─── Vacaciones ─────────────────────────────────────────────────────────────

export interface VacationRequest {
  id: string;
  requestDate: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: "approved" | "rejected" | "pending";
  reason: string;
  approvedBy?: string;
}

export interface EmployeeVacationProfile {
  id: string;
  name: string;
  area: string;
  position: string;
  daysUsed: number;
  daysAccumulated: number;
  requests: VacationRequest[];
  areaAverage: number;
}

export interface VacationDataInterface {
  area: string;
  totalEmployees: number;
  daysUsed: number;
  averageDaysPerEmployee: number;
  accumulatedDays: number;
  trend: number;
  employees: {
    name: string;
    daysUsed: number;
    daysAccumulated: number;
  }[];
}

// ─── Permisos ────────────────────────────────────────────────────────────────

export type PermissionRequestsType = {
  approvedBy: string;
  area: string;
  employeeName: string;
  endDate: string;
  hours: number;
  id: number;
  reason: string;
  requestDate: string;
  startDate: string;
  status: string;
};

export type PermissionsDataType = {
  area: string;
  averageHoursPerPermission: number;
  averagePermissionsPerEmployee: number;
  employees: {
    areaAverage: number;
    averageHours: number;
    comparisonWithArea: number;
    lastPermission: string;
    name: string;
    pendingPermissions: number;
    totalHours: number;
    totalPermissions: number;
    weeklyPattern: {
      friday: string;
      monday: string;
      thursday: string;
      tuesday: string;
      wednesday: string;
    };
  }[];
  supervisor: string;
  totalEmployees: number;
  totalHours: number;
  totalPermissions: number;
};

// ─── Resumen principal (cards) ───────────────────────────────────────────────

export type DashboardView = "attendance" | "vacations" | "permissions";
