"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useAttendanceData } from "../../_hooks/use-attendance";
import { useEmployeeProfile } from "../../_hooks/use-employee-profile";
import { DashboardSkeleton } from "../shared/dashboard-skeleton";
import { AreaFilter } from "../shared/area-filter";
import { PeriodFilter } from "../shared/period-filter";
import { SmartPagination } from "../shared/smart-pagination";
import { saveAs } from "file-saver";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  CalendarDays,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Filter,
  BarChart3,
  Loader2,
  CheckCircle2,
  TimerOff,
  UserX,
  ShieldCheck,
  Plane,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ExcelJS from "exceljs";
import type { EmployeeProfile } from "../../_types/dashboard.types";

// ─── Schedule rules ─────────────────────────────────────────────────────────
const SCHEDULE = {
  startLocal: { h: 6,  m: 45 },
  endLocal:   { h: 16, m: 45 },
  graceMins:  30,
} as const;

function toLocalMinutes(timeHHmm: string | null): number | null {
  if (!timeHHmm) return null;
  const [h, m] = timeHHmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m; // times are already in local time
}

function isLateArrival(entryTime: string | null): boolean {
  const mins = toLocalMinutes(entryTime);
  if (mins === null) return false;
  return mins > SCHEDULE.startLocal.h * 60 + SCHEDULE.startLocal.m + SCHEDULE.graceMins;
}

function getOvertimeHours(exitTime: string | null): number {
  const mins = toLocalMinutes(exitTime);
  if (mins === null) return 0;
  const endMins = SCHEDULE.endLocal.h * 60 + SCHEDULE.endLocal.m;
  const over = mins - endMins;
  return over > 0 ? Math.round((over / 60) * 10) / 10 : 0;
}

function getEffectiveStatus(record: {
  status: string;
  entryTime: string | null;
  exitTime?: string | null;
  permission?: { startTime: string | null; endTime: string | null } | null;
}): string {
  // Permission-justified overrides — absence/late/early departure covered by an approved permit
  if (record.permission) {
    if (record.status === "absent") return "permitted_absence";
    if (record.status === "early_departure") return "permitted_early_departure";
    // Late arrival covered by permission
    if (isLateArrival(record.entryTime) || record.status === "late") return "permitted_late";
  }
  // Schedule-based overrides
  if (record.status === "absent" || record.status === "incomplete") return record.status;
  if (!record.entryTime) return record.status;
  if (isLateArrival(record.entryTime)) return "late";
  if (record.status === "late") return "on_time";
  return record.status;
}

// ─── Date display helpers ────────────────────────────────────────────────────
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH_ABBR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function getDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
}

function formatDateBadge(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTH_ABBR[m - 1]} ${y}`;
}

// ─── Period label → YYYY-MM-DD range ────────────────────────────────────────
function periodToDates(period: string): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  switch (period) {
    case "Hoy": { const s = fmt(today); return { dateFrom: s, dateTo: s }; }
    case "Esta Semana": {
      const day = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
      return { dateFrom: fmt(start), dateTo: fmt(today) };
    }
    case "Este Mes": return { dateFrom: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), dateTo: fmt(today) };
    case "Último Trimestre": {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 3);
      return { dateFrom: fmt(start), dateTo: fmt(today) };
    }
    case "Este Año": return { dateFrom: fmt(new Date(today.getFullYear(), 0, 1)), dateTo: fmt(today) };
    default: return { dateFrom: "", dateTo: "" };
  }
}

/** Returns worked hours as "Xh Ym" given two "HH:mm" UTC strings. */
function calcWorkedHours(entryUtc: string | null, exitUtc: string | null): string {
  if (!entryUtc || !exitUtc) return "—";
  const toLocalMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return NaN;
    return (h - 6) * 60 + m;
  };
  const entry = toLocalMins(entryUtc);
  const exit  = toLocalMins(exitUtc);
  if (isNaN(entry) || isNaN(exit) || exit <= entry) return "—";
  const diff = exit - entry;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function toEmployeeKey(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

function resolveKey(employee: { name: string; key?: string }) {
  return employee.key ? employee.key : toEmployeeKey(employee.name);
}

// ─── Modal filter state ──────────────────────────────────────────────────────
interface ModalFilters {
  status: string;           // "all" | specific status value
  hasOvertime: boolean;
  hasPermission: boolean;
  dayOfWeek: string | null; // "monday" | "tuesday" … | null
}
const DEFAULT_MODAL_FILTERS: ModalFilters = {
  status: "all", hasOvertime: false, hasPermission: false, dayOfWeek: null,
};
const DAY_FULL: Record<string, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes",
};

interface AttendanceViewProps {
  onBack: () => void;
  allowedArea: string | null;
  /** Called when user clicks a permission badge — navigate to that permission's detail */
  onNavigateToPermission?: (permissionId: number) => void;
}

export function AttendanceView({ onBack, allowedArea, onNavigateToPermission }: AttendanceViewProps) {
  // ── State ────────────────────────────────────────────────────────────────────
  const { data: session } = useSession();
  const [selectedArea, setSelectedArea] = useState(allowedArea ? allowedArea : "Todas");
  const [selectedPeriod, setSelectedPeriod] = useState("Este Mes");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showAreaCards, setShowAreaCards] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [modalFilters, setModalFilters] = useState<ModalFilters>(DEFAULT_MODAL_FILTERS);
  const [modalDateFrom, setModalDateFrom] = useState("");
  const [modalDateTo, setModalDateTo] = useState("");
  const [activeProfileKey, setActiveProfileKey] = useState<string | null>(null);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [employeesPerPage, setEmployeesPerPage] = useState(10);
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [profileExportLoading, setProfileExportLoading] = useState(false);

  // ── Effective date range ──────────────────────────────────────────────────
  const isCustomRange = selectedPeriod === "Rango Personalizado";

  const effectiveDates = useMemo(() => {
    if (isCustomRange) {
      if (customDateFrom && customDateTo) return { dateFrom: customDateFrom, dateTo: customDateTo };
      return { dateFrom: undefined, dateTo: undefined };
    }
    const d = periodToDates(selectedPeriod);
    return { dateFrom: d.dateFrom || undefined, dateTo: d.dateTo || undefined };
  }, [isCustomRange, selectedPeriod, customDateFrom, customDateTo]);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const { data: hookData, loading, error } = useAttendanceData(
    true,
    allowedArea,
    effectiveDates.dateFrom,
    effectiveDates.dateTo,
  );
  const attendanceData = (hookData && hookData.attendanceData) ? hookData.attendanceData : [];

  // ── On-demand profiles ────────────────────────────────────────────────────
  const { fetchProfile, loading: profileLoading, isCached } = useEmployeeProfile();

  // ── Dynamic areas ─────────────────────────────────────────────────────────
  const availableAreas = useMemo(() => attendanceData.map((a) => a.area), [attendanceData]);

  // ── "Todas las Áreas" aggregate ───────────────────────────────────────────
  const allAreasPercentage = useMemo(() => {
    if (!attendanceData.length) return 0;
    const totalEmp = attendanceData.reduce((acc, a) => acc + a.employees.length, 0);
    if (!totalEmp) return 0;
    const weightedSum = attendanceData.reduce((acc, a) => acc + a.percentage * a.employees.length, 0);
    return Math.round(weightedSum / totalEmp);
  }, [attendanceData]);

  // ── Export (on-demand fetch of raw records) ───────────────────────────────
  const exportToExcel = async (fileName = "asistencias.xlsx") => {
    if (!(session && session.user ? session.user.accessToken : undefined)) return;
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      // Respect currently selected area filter
      if (selectedArea !== "Todas") params.set("area", selectedArea);
      else if (allowedArea) params.set("area", allowedArea);
      if (effectiveDates.dateFrom) params.set("dateFrom", effectiveDates.dateFrom);
      if (effectiveDates.dateTo) params.set("dateTo", effectiveDates.dateTo);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requests/get-monthly-attendance?${params}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${session && session.user ? session.user.accessToken : ""}` } }
      );
      if (!res.ok) throw new Error(res.statusText);
      const monthlyData: any[] = await res.json();
      if (!monthlyData.length) return;

      // Times from get-monthly-attendance are already in local time — no conversion needed
      const setHoursUtil = (hour: string) => {
        if (!hour) return "";
        const [h, m, s] = hour.split(":").map(Number);
        if (isNaN(h)) return "";
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s != null ? s : 0).padStart(2, "0")}`;
      };

      // Worked hours from local HH:mm:ss strings
      const calcWorkedHoursRaw = (entryRaw: string, exitRaw: string): string => {
        if (!entryRaw || !exitRaw) return "—";
        const toMins = (t: string) => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };
        const diff = toMins(exitRaw) - toMins(entryRaw);
        if (diff <= 0) return "—";
        const hh = Math.floor(diff / 60);
        const mm = diff % 60;
        return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`;
      };

      const workbook = new ExcelJS.Workbook();
      const summary = workbook.addWorksheet("Resumen Asistencia");
      const totalRegs = monthlyData.length;
      const uniqueEmps = new Set(monthlyData.map((r) => r.int_id_empleado)).size;
      const countByArea: Record<string, number> = {};
      monthlyData.forEach((r) => { countByArea[r.area] = (countByArea[r.area] || 0) + 1; });
      const sorted = [...monthlyData].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      const countByEmp: Record<string, number> = {};
      monthlyData.forEach((r) => { countByEmp[r.nombre_empleado] = (countByEmp[r.nombre_empleado] || 0) + 1; });
      const topEmps = Object.entries(countByEmp).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => [n, c]);

      summary.addRows([
        ["Total de registros", totalRegs],
        ["Empleados únicos", uniqueEmps],
        ["Área filtrada", selectedArea !== "Todas" ? selectedArea : "Todas las áreas"],
        ["Período", effectiveDates.dateFrom && effectiveDates.dateTo ? `${effectiveDates.dateFrom} — ${effectiveDates.dateTo}` : "Sin filtro"],
        ["Primer registro", (sorted[0] && sorted[0].fecha) ? sorted[0].fecha.toString() : ""],
        ["Último registro", (sorted[sorted.length - 1] && sorted[sorted.length - 1].fecha) ? sorted[sorted.length - 1].fecha.toString() : ""],
        [],
        ["Registros por Área", "Cantidad"],
        ...Object.entries(countByArea).map(([a, c]) => [a, c]),
        [],
        ["Top 5 Empleados", "Registros"],
        ...topEmps,
      ]);
      summary.columns = [{ width: 30 }, { width: 30 }];

      const detail = workbook.addWorksheet("Detalle Registros");
      detail.addTable({
        name: "DetalleTable", ref: "A1", headerRow: true, totalsRow: false,
        style: { theme: "TableStyleMedium4", showRowStripes: true },
        columns: [
          { name: "Fecha",          filterButton: true },
          { name: "ID Empleado",    filterButton: true },
          { name: "Nombre",         filterButton: true },
          { name: "Área",           filterButton: true },
          { name: "Entrada",        filterButton: true },
          { name: "Salida",         filterButton: true },
          { name: "Horas Trabajadas", filterButton: true },
        ],
        rows: monthlyData.map((r) => [
          r.fecha ? r.fecha.toString() : "",
          r.int_id_empleado,
          r.nombre_empleado,
          r.area,
          setHoursUtil(r.entrada),
          setHoursUtil(r.salida),
          calcWorkedHoursRaw(r.entrada ? r.entrada : "", r.salida ? r.salida : ""),
        ]),
      });
      detail.columns = [
        { width: 20 }, { width: 14 }, { width: 28 },
        { width: 22 }, { width: 12 }, { width: 12 }, { width: 18 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName);
    } catch (err) {
      console.error("Error al exportar:", err);
    } finally {
      setExportLoading(false);
    }
  };

  // ── Profile export (all records with current modal filters) ──────────────
  const exportProfileToExcel = async () => {
    if (!(session && session.user ? session.user.accessToken : undefined) || !activeProfileKey || !selectedEmployee) return;
    setProfileExportLoading(true);
    try {
      // Fetch all records (no pagination) with the active modal filters
      const qp = new URLSearchParams({
        key:   activeProfileKey,
        page:  "1",
        limit: "9999",
      });
      if (modalFilters.status && modalFilters.status !== "all") qp.set("status", modalFilters.status);
      if (modalFilters.hasOvertime)   qp.set("hasOvertime",   "true");
      if (modalFilters.hasPermission) qp.set("hasPermission", "true");
      if (modalFilters.dayOfWeek)     qp.set("dayOfWeek",     modalFilters.dayOfWeek);
      if (modalDateFrom) qp.set("dateFrom", modalDateFrom);
      if (modalDateTo)   qp.set("dateTo",   modalDateTo);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/employee-profile?${qp}`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${session && session.user ? session.user.accessToken : ""}` } }
      );
      if (!res.ok) throw new Error(res.statusText);
      const profile: EmployeeProfile = await res.json();

      // Client-side hasPermission fallback (mirrors displayRecords logic)
      const records = modalFilters.hasPermission
        ? profile.records.filter((r) => r.permission != null)
        : profile.records;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Asistencias");
      sheet.addTable({
        name: "AsistenciasTable", ref: "A1", headerRow: true, totalsRow: false,
        style: { theme: "TableStyleMedium2", showRowStripes: true },
        columns: [
          { name: "Fecha",            filterButton: true },
          { name: "Día",              filterButton: true },
          { name: "Entrada",          filterButton: true },
          { name: "Salida",           filterButton: true },
          { name: "Horas Trabajadas", filterButton: true },
          { name: "Estado",           filterButton: true },
          { name: "Notas",            filterButton: true },
        ],
        rows: records.map((r) => {
          const entry = setHours(r.entryTime ? r.entryTime + ":00" : "");
          const exit  = setHours(r.exitTime  ? r.exitTime  + ":00" : "");
          const effectiveStatus = getEffectiveStatus(r);
          const notesParts = [
            r.permission ? `Permiso — ${r.permission.type === "full_day" ? "Día completo" : r.permission.type === "late_arrival" ? "Llegada tarde" : r.permission.type === "early_departure" ? "Salida temprana" : r.permission.type === "partial" ? "Parcial" : ""}` : "",
            r.vacation   ? "Vacaciones" : "",
            r.holiday    ? `Festivo: ${r.holiday.name}${!r.holiday.isNational ? " (empresa)" : ""}` : "",
            r.notes ? r.notes : "",
          ].filter(Boolean).join(" | ");
          return [
            r.date,
            getDayName(r.date),
            entry || "—",
            exit  || "—",
            calcWorkedHours(r.entryTime, r.exitTime),
            getRecordStatusText(effectiveStatus),
            notesParts || "—",
          ];
        }),
      });
      sheet.columns = [
        { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 },
        { width: 18 }, { width: 26 }, { width: 40 },
      ];

      // Info header in a second sheet
      const info = workbook.addWorksheet("Resumen");
      info.addRows([
        ["Empleado",         selectedEmployee.name],
        ["Área",             selectedEmployee.area],
        ["Cargo",            selectedEmployee.position],
        ["Supervisor",       selectedEmployee.supervisor],
        ["Asistencia",       `${selectedEmployee.attendanceRate}%`],
        ["Tardanzas",        selectedEmployee.lateArrivals],
        ["Ausencias",        selectedEmployee.absences],
        ["Período",          modalDateFrom && modalDateTo ? `${modalDateFrom} — ${modalDateTo}` : "Sin filtro de fecha"],
        ["Filtro estado",    modalFilters.status !== "all" ? modalFilters.status : "Todos"],
        ["Con horas extra",  modalFilters.hasOvertime  ? "Sí" : "No"],
        ["Con permiso",      modalFilters.hasPermission ? "Sí" : "No"],
        ["Día de semana",    modalFilters.dayOfWeek ? DAY_FULL[modalFilters.dayOfWeek] : "Todos"],
        ["Total registros",  records.length],
      ]);
      info.columns = [{ width: 20 }, { width: 35 }];

      const safeName = selectedEmployee.name.replace(/\s+/g, "_");
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `perfil_${safeName}.xlsx`);
    } catch (err) {
      console.error("Error al exportar perfil:", err);
    } finally {
      setProfileExportLoading(false);
    }
  };

  // ── Status helpers ────────────────────────────────────────────────────────
  const setHours = (hour: string) => {
    if (!hour) return "";
    const [h, m, s] = hour.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, s != null ? s : 0, 0);
    date.setHours(date.getHours() - 6);
    return date.toTimeString().split(" ")[0];
  };

  const getStatusColor = (s: string) => ({
    excellent: "bg-green-100 text-green-800",
    good:      "bg-blue-100 text-blue-800",
    regular:   "bg-yellow-100 text-yellow-800",
    poor:      "bg-red-100 text-red-800",
  }[s] || "bg-gray-100 text-gray-800");

  const getStatusText = (s: string) => ({
    excellent: "Excelente", good: "Bueno", regular: "Regular", poor: "Deficiente",
  }[s] || "N/A");

  const getRecordStatusColor = (s: string) => ({
    on_time:                    "text-green-600",
    late:                       "text-red-600",
    early_departure:            "text-orange-600",
    absent:                     "text-red-800",
    incomplete:                 "text-yellow-600",
    early_arrival:              "text-blue-600",
    permitted_late:             "text-indigo-600",
    permitted_absence:          "text-violet-600",
    permitted_early_departure:  "text-purple-600",
  }[s] || "text-gray-600");

  const getRecordStatusText = (s: string) => ({
    on_time:                    "A Tiempo",
    late:                       "Llegada Tardía",
    early_departure:            "Salida Temprana",
    absent:                     "Inasistencia",
    incomplete:                 "Marcaje Incompleto",
    early_arrival:              "Llegada Temprana",
    permitted_late:             "Permiso — Tardanza",
    permitted_absence:          "Permiso — Ausencia",
    permitted_early_departure:  "Permiso — Salida Temp.",
  }[s] || "N/A");

  const getRecordStatusIcon = (s: string) => ({
    on_time:                    <CheckCircle className="h-4 w-4 text-green-600" />,
    late:                       <Clock className="h-4 w-4 text-red-600" />,
    early_departure:            <AlertCircle className="h-4 w-4 text-orange-600" />,
    absent:                     <XCircle className="h-4 w-4 text-red-800" />,
    incomplete:                 <AlertCircle className="h-4 w-4 text-yellow-600" />,
    early_arrival:              <Clock className="h-4 w-4 text-blue-600" />,
    permitted_late:             <ShieldCheck className="h-4 w-4 text-indigo-600" />,
    permitted_absence:          <ShieldCheck className="h-4 w-4 text-violet-600" />,
    permitted_early_departure:  <ShieldCheck className="h-4 w-4 text-purple-600" />,
  }[s] || <AlertCircle className="h-4 w-4 text-gray-600" />);

  const getAttendanceColor = (rate: number) =>
    rate >= 90 ? "text-green-600" : rate >= 75 ? "text-blue-600" : rate >= 60 ? "text-yellow-600" : "text-red-600";

  const getAttendanceBgColor = (rate: number) =>
    rate >= 90 ? "bg-green-500" : rate >= 75 ? "bg-blue-500" : rate >= 60 ? "bg-yellow-500" : "bg-red-500";

  // ── Build fetch params (shared by all modal handlers) ────────────────────
  const buildParams = (
    key: string, page: number, limit: number,
    f: ModalFilters, dateFrom: string, dateTo: string,
  ) => ({
    key, page, limit,
    status:        f.status !== "all" ? f.status : undefined,
    hasOvertime:   f.hasOvertime   || undefined,
    hasPermission: f.hasPermission || undefined,
    dayOfWeek:     f.dayOfWeek     || undefined,
    dateFrom:      dateFrom || undefined,
    dateTo:        dateTo   || undefined,
  });

  // ── Employee click — initialize modal dates from global period ────────────
  const handleEmployeeClick = async (employee: { name: string; key?: string }) => {
    const key      = resolveKey(employee);
    const initFrom = effectiveDates.dateFrom ? effectiveDates.dateFrom : "";
    const initTo   = effectiveDates.dateTo ? effectiveDates.dateTo : "";
    setActiveProfileKey(key);
    setModalFilters(DEFAULT_MODAL_FILTERS);
    setModalDateFrom(initFrom);
    setModalDateTo(initTo);
        const profile = await fetchProfile(buildParams(key, 1, recordsPerPage, DEFAULT_MODAL_FILTERS, initFrom, initTo));
    if (profile) { setSelectedEmployee(profile); setShowEmployeeModal(true); }
  };

  // ── Shared fetch helper (uses current state + overrides) ─────────────────
  const refetch = async (f: ModalFilters, from: string, to: string, page = 1, limit = recordsPerPage) => {
    if (!activeProfileKey) return;
    const profile = await fetchProfile(buildParams(activeProfileKey, page, limit, f, from, to));
    if (profile) setSelectedEmployee(profile);
  };

  // ── Page change ───────────────────────────────────────────────────────────
  const handleRecordPageChange = async (page: number) => {
    await refetch(modalFilters, modalDateFrom, modalDateTo, page);
  };

  // ── Status select change ──────────────────────────────────────────────────
  const handleStatusFilterChange = async (newStatus: string) => {
    const f = { ...modalFilters, status: newStatus, dayOfWeek: null };
    setModalFilters(f);     await refetch(f, modalDateFrom, modalDateTo);
  };

  // ── Stat card click (toggle) ──────────────────────────────────────────────
  const handleCardClick = async (status: string) => {
    const newStatus = modalFilters.status === status && !modalFilters.dayOfWeek ? "all" : status;
    const f = { ...modalFilters, status: newStatus, dayOfWeek: null };
    setModalFilters(f);     await refetch(f, modalDateFrom, modalDateTo);
  };

  // ── Bar click: status + day-of-week (toggle) ──────────────────────────────
  const handleBarClick = async (status: string, day: string) => {
    const alreadyActive = modalFilters.status === status && modalFilters.dayOfWeek === day;
    const f = alreadyActive
      ? { ...modalFilters, status: "all", dayOfWeek: null }
      : { ...modalFilters, status, dayOfWeek: day };
    setModalFilters(f);     await refetch(f, modalDateFrom, modalDateTo);
  };

  // ── Clear day-of-week filter only ─────────────────────────────────────────
  const handleDayFilterClear = async () => {
    const f = { ...modalFilters, dayOfWeek: null };
    setModalFilters(f);     await refetch(f, modalDateFrom, modalDateTo);
  };

  // ── Overtime toggle ───────────────────────────────────────────────────────
  const handleOvertimeToggle = async () => {
    const f = { ...modalFilters, hasOvertime: !modalFilters.hasOvertime };
    setModalFilters(f);     await refetch(f, modalDateFrom, modalDateTo);
  };

  // ── Permission toggle ─────────────────────────────────────────────────────
  const handlePermissionToggle = async () => {
    const f = { ...modalFilters, hasPermission: !modalFilters.hasPermission };
    setModalFilters(f);     await refetch(f, modalDateFrom, modalDateTo);
  };

  // ── Modal date filter change ──────────────────────────────────────────────
  const handleModalDateChange = async (newFrom: string, newTo: string) => {
    setModalDateFrom(newFrom); setModalDateTo(newTo);     await refetch(modalFilters, newFrom, newTo);
  };

  // ── Records-per-page change ───────────────────────────────────────────────
  const handleRecordsPerPageChange = async (newLimit: number) => {
    setRecordsPerPage(newLimit);     await refetch(modalFilters, modalDateFrom, modalDateTo, 1, newLimit);
  };

  // ── Clear all modal filters ───────────────────────────────────────────────
  const handleClearModalFilters = async () => {
    const from = effectiveDates.dateFrom ? effectiveDates.dateFrom : "";
    const to   = effectiveDates.dateTo ? effectiveDates.dateTo : "";
    setModalFilters(DEFAULT_MODAL_FILTERS);
    setModalDateFrom(from); setModalDateTo(to);     await refetch(DEFAULT_MODAL_FILTERS, from, to);
  };

  // ── Active filters flag ───────────────────────────────────────────────────
  const hasActiveFilters =
    modalFilters.status !== "all" || modalFilters.hasOvertime ||
    modalFilters.hasPermission    || modalFilters.dayOfWeek !== null ||
    modalDateFrom !== (effectiveDates.dateFrom ? effectiveDates.dateFrom : "") ||
    modalDateTo   !== (effectiveDates.dateTo ? effectiveDates.dateTo : "");

  // ── Employee list filtering ───────────────────────────────────────────────
  const filteredEmployees = useMemo(
    () =>
      attendanceData
        .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
        .flatMap((area) =>
          area.employees
            .filter((emp) => !searchTerm || emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((emp) => ({ ...emp, area: area.area }))
        ),
    [attendanceData, selectedArea, searchTerm]
  );

  const totalEmployeePages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentEmployeePage - 1) * employeesPerPage,
    currentEmployeePage * employeesPerPage
  );

  // ── Weekly distribution sum helper ───────────────────────────────────────
  const sumDays = (d: { monday: number; tuesday: number; wednesday: number; thursday: number; friday: number }) =>
    d.monday + d.tuesday + d.wednesday + d.thursday + d.friday;

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading && !hookData) return <DashboardSkeleton />;

  if (error) return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">Error al cargar asistencias</h2>
        <p className="text-gray-500 max-w-sm">{error}</p>
        <button onClick={onBack} className="text-blue-600 underline text-sm">Volver al resumen</button>
      </div>
    </div>
  );

  return (
  <div className="min-h-screen bg-background transition-colors duration-300 p-6">
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al Resumen
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de Asistencias</h1>
            <p className="text-gray-600">Análisis detallado por área y empleado</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1 text-sm text-gray-500 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> Actualizando...
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAreaCards(!showAreaCards)} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {showAreaCards ? "Ocultar Tarjetas" : "Mostrar Tarjetas"}
            {showAreaCards ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button onClick={() => exportToExcel()} disabled={exportLoading} className="flex items-center gap-2">
            {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar Detalle
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-lg border shadow-sm">
          <AreaFilter
            value={selectedArea}
            onChange={(v) => { setSelectedArea(v); setCurrentEmployeePage(1); }}
            areas={availableAreas}
          />
          <PeriodFilter
            value={selectedPeriod}
            onChange={(v) => { setSelectedPeriod(v); if (v !== "Rango Personalizado") { setCustomDateFrom(""); setCustomDateTo(""); } }}
            variant="attendance"
          />
          {isCustomRange && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500 shrink-0" />
              <Input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} className="w-40" />
              <span className="text-gray-500 text-sm shrink-0">—</span>
              <Input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} className="w-40" />
            </div>
          )}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentEmployeePage(1); }}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Area Cards */}
      {showAreaCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* All areas aggregate */}
          <Card
            className={`hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${selectedArea === "Todas" ? "ring-2 ring-purple-500 bg-purple-50 shadow-md" : "hover:bg-gray-50"}`}
            onClick={() => { setSelectedArea("Todas"); setCurrentEmployeePage(1); }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  Todas las Áreas
                  <span className="text-xs text-purple-600 opacity-70">Click para ver todas</span>
                </CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                  <TrendingUp className="h-3 w-3 mr-1" /> General
                </Badge>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Promedio</span>
                    <span className="font-medium">{allAreasPercentage}%</span>
                  </div>
                  <Progress value={allAreasPercentage} className="h-2" />
                </div>
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  {attendanceData.reduce((acc, a) => acc + a.employees.length, 0)} empleados total
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-area cards */}
          {attendanceData.map((area) => (
            <Card
              key={area.area}
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${selectedArea === area.area ? "ring-2 ring-blue-500 bg-blue-50 shadow-md" : "hover:bg-gray-50"}`}
              onClick={() => { setSelectedArea(area.area); setCurrentEmployeePage(1); }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    {area.area}
                    <span className="text-xs text-blue-600 opacity-70">Click para filtrar</span>
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant={area.trend >= 0 ? "default" : "destructive"} className="text-xs">
                    {area.trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(area.trend)}%
                  </Badge>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Asistencia</span>
                      <span className="font-medium">{area.percentage}%</span>
                    </div>
                    <Progress value={area.percentage} className="h-2" />
                  </div>
                  <div className="text-xs text-gray-500 text-center pt-2 border-t">
                    {area.employees.length} empleados
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter summary (collapsed) */}
      {!showFilters && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-blue-800">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" /><strong>Área:</strong> {selectedArea}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /><strong>Período:</strong>{" "}
                {isCustomRange && customDateFrom && customDateTo ? `${customDateFrom} — ${customDateTo}` : selectedPeriod}
              </span>
              {searchTerm && (
                <span className="flex items-center gap-1">
                  <Search className="h-4 w-4" /><strong>Búsqueda:</strong> "{searchTerm}"
                </span>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">{filteredEmployees.length} empleados</Badge>
          </div>
        </div>
      )}

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Detalle por Empleado — {selectedArea === "Todas" ? "Todas las Áreas" : selectedArea}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={employeesPerPage.toString()}
                onValueChange={(v) => { setEmployeesPerPage(Number.parseInt(v)); setCurrentEmployeePage(1); }}
              >
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 por página</SelectItem>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="15">15 por página</SelectItem>
                  <SelectItem value="25">25 por página</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-500">Total: {filteredEmployees.length} empleados</div>
            </div>

            <div className="space-y-3">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee, index) => {
                  const key = resolveKey(employee);
                  const cached = isCached(key);
                  return (
                    <div
                      key={`${employee.area}-${employee.name}-${index}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                      onClick={() => handleEmployeeClick(employee)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-blue-600">
                            {employee.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {employee.name}
                            {cached && (
                              <span className="text-xs text-green-600 opacity-70 flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3" /> cargado
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{employee.area}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-lg">{employee.attendance}%</p>
                          <p className="text-xs text-gray-400">en el período</p>
                        </div>
                        <Badge className={getStatusColor(employee.status)}>
                          {getStatusText(employee.status)}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron empleados con los filtros aplicados
                </div>
              )}
            </div>

            {totalEmployeePages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Mostrando {(currentEmployeePage - 1) * employeesPerPage + 1}–
                  {Math.min(currentEmployeePage * employeesPerPage, filteredEmployees.length)} de {filteredEmployees.length}
                </div>
                <SmartPagination currentPage={currentEmployeePage} totalPages={totalEmployeePages} onPageChange={setCurrentEmployeePage} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Employee Profile Modal */}
    <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {profileLoading && !selectedEmployee ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : selectedEmployee ? (
          <>
            {/* Profile header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-lg text-white">
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold">Perfil de Empleado</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-5 mt-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0 ring-2 ring-white/40">
                  <span className="text-2xl font-bold text-white">
                    {selectedEmployee.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{selectedEmployee.name}</h2>
                  <p className="text-blue-200 text-sm">{selectedEmployee.position}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-blue-100">
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {selectedEmployee.area}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {selectedEmployee.supervisor}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> ID: {selectedEmployee.id}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className={`text-3xl font-bold ${getAttendanceColor(selectedEmployee.attendanceRate)} bg-white px-3 py-1 rounded-lg`}>
                    {selectedEmployee.attendanceRate}%
                  </div>
                  <p className="text-blue-200 text-xs">
                    {hasActiveFilters ? "Asistencia filtrada" : "Asistencia general"}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={exportProfileToExcel}
                    disabled={profileExportLoading}
                    className="flex items-center gap-1.5 text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {profileExportLoading
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Download className="h-3 w-3" />}
                    Exportar perfil
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Unified stat + distribution cards */}
              {selectedEmployee.weeklyDistribution && (() => {
                type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
                const DAYS: { key: DayKey; label: string }[] = [
                  { key: "monday", label: "L" }, { key: "tuesday", label: "M" },
                  { key: "wednesday", label: "X" }, { key: "thursday", label: "J" },
                  { key: "friday", label: "V" },
                ];
                type CC = { wrap: string; border: string; hdr: string; icon: string; bar: string; barActive: string; badge: string; divider: string; activeBorder: string };
                const COLORS: Record<string, CC> = {
                  green:  { wrap: "bg-green-50",  border: "border-green-200",  hdr: "text-green-700",  icon: "text-green-500",  bar: "bg-green-200",  barActive: "bg-green-600",  badge: "bg-green-100 text-green-800",  divider: "border-green-200",  activeBorder: "ring-2 ring-green-500 border-green-400"  },
                  red:    { wrap: "bg-red-50",    border: "border-red-200",    hdr: "text-red-700",    icon: "text-red-400",    bar: "bg-red-200",    barActive: "bg-red-600",    badge: "bg-red-100 text-red-700",      divider: "border-red-200",    activeBorder: "ring-2 ring-red-500 border-red-400"      },
                  slate:  { wrap: "bg-slate-50",  border: "border-slate-200",  hdr: "text-slate-700",  icon: "text-slate-400",  bar: "bg-slate-200",  barActive: "bg-slate-600",  badge: "bg-slate-100 text-slate-700",  divider: "border-slate-200",  activeBorder: "ring-2 ring-slate-500 border-slate-400"  },
                  yellow: { wrap: "bg-yellow-50", border: "border-yellow-200", hdr: "text-yellow-700", icon: "text-yellow-500", bar: "bg-yellow-200", barActive: "bg-yellow-600", badge: "bg-yellow-100 text-yellow-700", divider: "border-yellow-200", activeBorder: "ring-2 ring-yellow-500 border-yellow-400" },
                };
                type CardDef = { title: string; icon: React.ReactNode; filterStatus: string; chartKey: keyof typeof selectedEmployee.weeklyDistribution; total: number; color: string; subtitle?: string };
                const cards: CardDef[] = [
                  { title: "A tiempo",    icon: <CheckCircle2 className="h-4 w-4" />, filterStatus: "on_time",    chartKey: "onTime",       total: sumDays(selectedEmployee.weeklyDistribution.onTime),      color: "green" },
                  { title: "Tardanzas",   icon: <TimerOff     className="h-4 w-4" />, filterStatus: "late",       chartKey: "lateArrivals", total: selectedEmployee.lateArrivals,                            color: "red",   subtitle: "> 7:15 AM" },
                  { title: "Ausencias",   icon: <UserX        className="h-4 w-4" />, filterStatus: "absent",     chartKey: "absences",     total: selectedEmployee.absences,                                color: "slate" },
                  { title: "Incompletos", icon: <AlertCircle  className="h-4 w-4" />, filterStatus: "incomplete", chartKey: "incomplete",   total: sumDays(selectedEmployee.weeklyDistribution.incomplete),  color: "yellow" },
                ];
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {cards.map((card) => {
                      const c = COLORS[card.color];
                      const data = selectedEmployee.weeklyDistribution[card.chartKey] as unknown as Record<string, number>;
                      const max = Math.max(...DAYS.map(d => data[d.key] || 0), 1);
                      const isCardActive = modalFilters.status === card.filterStatus;
                      return (
                        <div
                          key={card.filterStatus}
                          onClick={() => handleCardClick(card.filterStatus)}
                          className={`border rounded-lg p-3 cursor-pointer transition-all duration-150 select-none ${c.wrap} ${isCardActive ? c.activeBorder : `${c.border} hover:shadow-md`}`}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className={`flex items-center gap-1.5 text-xs font-semibold ${c.hdr}`}>
                              <span className={c.icon}>{card.icon}</span>
                              {card.title}
                              {card.subtitle && <span className="font-normal text-gray-400 ml-0.5">{card.subtitle}</span>}
                            </div>
                            {isCardActive && <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${c.badge}`}>activo</span>}
                          </div>
                          {/* Mini bar chart */}
                          <div className="flex items-end justify-between gap-1 mb-2">
                            {DAYS.map(({ key, label }) => {
                              const val = data[key] || 0;
                              const barH = val > 0 ? Math.max(Math.round((val / max) * 40), 4) : 0;
                              const isDayActive = isCardActive && modalFilters.dayOfWeek === key;
                              return (
                                <div
                                  key={key}
                                  className="relative flex flex-col items-center gap-0.5 flex-1 group cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); handleBarClick(card.filterStatus, key); }}
                                >
                                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-20">{val}</div>
                                  <div className="w-full flex items-end justify-center h-10">
                                    <div className={`w-full max-w-[12px] rounded-sm transition-all group-hover:opacity-75 ${isDayActive ? c.barActive : c.bar}`} style={{ height: barH }} />
                                  </div>
                                  <span className={`text-[10px] leading-none ${isDayActive ? `font-bold ${c.hdr}` : "text-gray-400"}`}>{label}</span>
                                </div>
                              );
                            })}
                          </div>
                          {/* Total badge */}
                          <div className={`pt-2 border-t flex justify-end ${c.divider}`}>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{card.total} total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Attendance bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-600">Tasa de asistencia</span>
                  <span className={getAttendanceColor(selectedEmployee.attendanceRate)}>{selectedEmployee.attendanceRate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getAttendanceBgColor(selectedEmployee.attendanceRate)}`}
                    style={{ width: `${selectedEmployee.attendanceRate}%` }}
                  />
                </div>
              </div>

              {/* Records */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Historial de Marcajes</h3>
                <div className="flex flex-wrap gap-3 items-center mb-4 p-3 bg-gray-50 rounded-lg border">
                  {/* Status select */}
                  <Select value={modalFilters.status} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="on_time">A Tiempo</SelectItem>
                      <SelectItem value="late">Tardanzas</SelectItem>
                      <SelectItem value="early_departure">Salida Temprana</SelectItem>
                      <SelectItem value="absent">Inasistencias</SelectItem>
                      <SelectItem value="incomplete">Incompletos</SelectItem>
                      <SelectItem value="early_arrival">Llegada Temprana</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Overtime toggle chip */}
                  <button
                    type="button"
                    onClick={handleOvertimeToggle}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all select-none ${
                      modalFilters.hasOvertime
                        ? "bg-blue-100 text-blue-700 border-blue-400 ring-1 ring-blue-400"
                        : "bg-white text-gray-500 border-gray-300 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    <Clock className="h-3 w-3" /> Horas extra
                  </button>

                  {/* Permission toggle chip */}
                  <button
                    type="button"
                    onClick={handlePermissionToggle}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all select-none ${
                      modalFilters.hasPermission
                        ? "bg-indigo-100 text-indigo-700 border-indigo-400 ring-1 ring-indigo-400"
                        : "bg-white text-gray-500 border-gray-300 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3" /> Con permiso
                  </button>

                  {/* Active day-of-week badge */}
                  {modalFilters.dayOfWeek && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-300">
                      {DAY_FULL[modalFilters.dayOfWeek]}
                      <button type="button" onClick={handleDayFilterClear} className="ml-0.5 hover:text-violet-900">
                        <XCircle className="h-3 w-3" />
                      </button>
                    </span>
                  )}

                  {/* Date range */}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500 shrink-0" />
                    <Input
                      type="date"
                      value={modalDateFrom}
                      onChange={(e) => handleModalDateChange(e.target.value, modalDateTo)}
                      className="w-36"
                    />
                    <span className="text-gray-400 text-sm">—</span>
                    <Input
                      type="date"
                      value={modalDateTo}
                      onChange={(e) => handleModalDateChange(modalDateFrom, e.target.value)}
                      className="w-36"
                    />
                  </div>

                  {/* Per-page select */}
                  <Select value={recordsPerPage.toString()} onValueChange={(v) => handleRecordsPerPageChange(Number.parseInt(v))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 por página</SelectItem>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="20">20 por página</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearModalFilters} className="text-gray-500 hover:text-gray-700">
                      <XCircle className="h-4 w-4 mr-1" /> Limpiar
                    </Button>
                  )}
                  {profileLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400 ml-auto" />
                  )}
                </div>

                {(() => {
                  // "Con Permiso" filtered client-side (backend JOIN pending).
                  // Status filter is handled server-side by the backend.
                  const displayRecords = modalFilters.hasPermission
                    ? selectedEmployee.records.filter(r => r.permission != null)
                    : selectedEmployee.records;

                  const permittedButEmpty =
                    modalFilters.hasPermission &&
                    displayRecords.length === 0 &&
                    selectedEmployee.records.length > 0;

                  return (
                    <>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">Fecha</TableHead>
                              <TableHead className="font-semibold">Entrada</TableHead>
                              <TableHead className="font-semibold">Salida</TableHead>
                              <TableHead className="font-semibold">Estado</TableHead>
                              <TableHead className="font-semibold">Notas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayRecords.map((record) => {
                              const effectiveStatus = getEffectiveStatus(record);
                              const overtime = getOvertimeHours(record.exitTime);
                              return (
                                <TableRow key={record.id ? record.id : `${record.date}-${record.status}`} className="hover:bg-blue-50/40 transition-colors">
                                  {/* Date cell: day name (primary) + date badge */}
                                  <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold text-gray-900 text-sm leading-tight">
                                        {getDayName(record.date)}
                                      </span>
                                      <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                                        {formatDateBadge(record.date)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {setHours(record.entryTime ? record.entryTime + ":00" : "") || <span className="text-gray-400">—</span>}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {(() => {
                                      const t = setHours(record.exitTime ? record.exitTime + ":00" : "");
                                      return t ? <span className={overtime > 0 ? "text-blue-600 font-semibold" : ""}>{t}</span> : <span className="text-gray-400">—</span>;
                                    })()}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getRecordStatusIcon(effectiveStatus)}
                                      <span className={`text-sm font-medium ${getRecordStatusColor(effectiveStatus)}`}>
                                        {getRecordStatusText(effectiveStatus)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    <div className="flex flex-wrap items-center gap-1">
                                      {/* Permission badge — clickable, shows type */}
                                      {record.permission && (() => {
                                        const perm = record.permission;
                                        const typeLabel = perm.type === "full_day"
                                          ? "Día completo"
                                          : perm.type === "late_arrival"
                                          ? "Llegada tarde"
                                          : perm.type === "early_departure"
                                          ? "Salida temprana"
                                          : perm.type === "partial"
                                          ? "Parcial"
                                          : perm.startTime && perm.endTime
                                          ? `${perm.startTime}–${perm.endTime}`
                                          : "Día completo";
                                        return onNavigateToPermission ? (
                                          <button
                                            type="button"
                                            onClick={() => onNavigateToPermission(perm.id)}
                                            className="inline-flex items-center gap-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-indigo-200 hover:text-indigo-900 transition-colors"
                                          >
                                            <ShieldCheck className="h-3 w-3" />
                                            Permiso — {typeLabel}
                                          </button>
                                        ) : (
                                          <span className="inline-flex items-center gap-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium px-1.5 py-0.5 rounded">
                                            <ShieldCheck className="h-3 w-3" />
                                            Permiso — {typeLabel}
                                          </span>
                                        );
                                      })()}
                                      {/* Vacation badge */}
                                      {record.vacation && (
                                        <span className="inline-flex items-center gap-0.5 bg-sky-100 text-sky-700 text-xs font-medium px-1.5 py-0.5 rounded">
                                          <Plane className="h-3 w-3" /> Vacaciones
                                        </span>
                                      )}
                                      {/* Holiday badge */}
                                      {record.holiday && (
                                        <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded">
                                          <Star className="h-3 w-3" />
                                          {record.holiday.name}
                                          {!record.holiday.isNational && <span className="opacity-60 ml-0.5">(empresa)</span>}
                                        </span>
                                      )}
                                      {record.notes && <span className="text-gray-500">{record.notes}</span>}
                                      {overtime > 0 && (
                                        <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded">
                                          <Clock className="h-3 w-3" /> +{overtime}h extra
                                        </span>
                                      )}
                                      {!record.permission && !record.vacation && !record.holiday && !record.notes && overtime === 0 && (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {permittedButEmpty && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-indigo-400">
                                  <ShieldCheck className="h-6 w-6 mx-auto mb-2 opacity-40" />
                                  No hay marcajes con permiso en esta página
                                </TableCell>
                              </TableRow>
                            )}
                            {!permittedButEmpty && displayRecords.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                                  No hay registros con los filtros aplicados
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {selectedEmployee.pagination.totalPages > 1 && (
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-sm text-gray-500">
                            {(selectedEmployee.pagination.page - 1) * selectedEmployee.pagination.limit + 1}–
                            {Math.min(selectedEmployee.pagination.page * selectedEmployee.pagination.limit, selectedEmployee.pagination.total)} de {selectedEmployee.pagination.total}
                          </p>
                          <SmartPagination
                            currentPage={selectedEmployee.pagination.page}
                            totalPages={selectedEmployee.pagination.totalPages}
                            onPageChange={handleRecordPageChange}
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  </div>
  );
}
