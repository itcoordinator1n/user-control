"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Clock,
  CalendarOff,
  DollarSign,
  Edit2,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Save,
  X,
  Building2,
  Globe,
  User,
  PauseCircle,
  PlayCircle,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import type {
  AreaSchedule,
  HolidayConfig,
  PayHoursException,
  ScheduleException,
} from "../../_types/dashboard.types";

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_SCHEDULES: AreaSchedule[] = [
  { area: "Planta",         startTime: "06:45", endTime: "16:45", graceMins: 30 },
  { area: "Administración", startTime: "07:00", endTime: "17:00", graceMins: 15 },
  { area: "Ventas",         startTime: "07:00", endTime: "16:00", graceMins: 15 },
  { area: "Logística",      startTime: "06:30", endTime: "16:30", graceMins: 30 },
];

const SEED_HOLIDAYS: HolidayConfig[] = [
  { id: 1, date: "2026-01-01", name: "Año Nuevo",               isNational: true,  areas: [] },
  { id: 2, date: "2026-04-14", name: "Jueves Santo",            isNational: true,  areas: [] },
  { id: 3, date: "2026-04-15", name: "Viernes Santo",           isNational: true,  areas: [] },
  { id: 4, date: "2026-09-15", name: "Día de la Independencia", isNational: true,  areas: [] },
  { id: 5, date: "2026-12-25", name: "Navidad",                 isNational: true,  areas: [] },
  { id: 6, date: "2026-05-01", name: "Día del Trabajo",         isNational: false, areas: ["Planta", "Logística"] },
];

const SEED_EXCEPTIONS: PayHoursException[] = [
  {
    id: 1, date: "2026-04-14", employeeKey: "EMP-001",
    employeeName: "Carlos Mejía", area: "Planta",
    reason: "Producción urgente — pedido exportación",
    status: "approved", approvedBy: "Ana Martínez", createdAt: "2026-04-10",
  },
  {
    id: 2, date: "2026-04-15", employeeKey: "EMP-034",
    employeeName: "Luis Rodríguez", area: "Logística",
    reason: "Despacho urgente de mercancía",
    status: "pending", createdAt: "2026-04-11",
  },
];

const SEED_SCHEDULE_EXCEPTIONS: ScheduleException[] = [
  {
    id: 1, area: "Planta", date: "2026-04-25",
    entryTime: null, exitTime: "14:00",
    reason: "Cierre anticipado — fin de semana largo",
    status: "active", createdAt: "2026-04-10",
  },
  {
    id: 2, area: "Planta", date: "2026-05-02",
    entryTime: "08:00", exitTime: "15:30",
    reason: "Mantenimiento de maquinaria",
    status: "paused", createdAt: "2026-04-12",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseLocalDate(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYYYYMMDD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface HRAdminViewProps {
  onBack: () => void;
}

type Tab = "schedules" | "holidays" | "exceptions";

type ExceptionDraft = Omit<ScheduleException, "id" | "status" | "createdAt" | "createdBy">;

// ─── Component ────────────────────────────────────────────────────────────────
export function HRAdminView({ onBack }: HRAdminViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("schedules");

  // ── Schedules ────────────────────────────────────────────────────────────────
  const [schedules, setSchedules] = useState<AreaSchedule[]>(SEED_SCHEDULES);
  const [editingSchedule, setEditingSchedule] = useState<AreaSchedule | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<AreaSchedule>({
    area: "", startTime: "", endTime: "", graceMins: 15,
  });

  // ── Area detail / exceptions ──────────────────────────────────────────────────
  const [schedExceptions, setSchedExceptions] = useState<ScheduleException[]>(SEED_SCHEDULE_EXCEPTIONS);
  const [detailArea, setDetailArea] = useState<AreaSchedule | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  /** date string ("YYYY-MM-DD") currently focused in the calendar */
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  /** exception being edited (null = create new) */
  const [editingException, setEditingException] = useState<ScheduleException | null>(null);
  const [exceptionFormOpen, setExceptionFormOpen] = useState(false);
  const [exDraft, setExDraft] = useState<ExceptionDraft>({
    area: "", date: "", entryTime: null, exitTime: null, reason: "",
  });

  // ── Holidays ─────────────────────────────────────────────────────────────────
  const [holidays, setHolidays] = useState<HolidayConfig[]>(SEED_HOLIDAYS);
  const [holidayDialog, setHolidayDialog] = useState(false);
  const [holidayDraft, setHolidayDraft] = useState<Omit<HolidayConfig, "id">>({
    date: "", name: "", isNational: true, areas: [],
  });

  // ── Pay-hours exceptions ──────────────────────────────────────────────────────
  const [exceptions, setExceptions] = useState<PayHoursException[]>(SEED_EXCEPTIONS);
  const [exceptionDialog, setExceptionDialog] = useState(false);
  const [exceptionDraft, setExceptionDraft] = useState<
    Omit<PayHoursException, "id" | "status" | "createdAt" | "approvedBy">
  >({ date: "", employeeKey: "", employeeName: "", area: "", reason: "" });
  const [exceptionsFilter, setExceptionsFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // ─── Schedule helpers ─────────────────────────────────────────────────────────
  const lateLimit = (s: AreaSchedule) => {
    const [h, m] = s.startTime.split(":").map(Number);
    const total = h * 60 + m + s.graceMins;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  const openEditSchedule = (s: AreaSchedule) => {
    setScheduleDraft({ ...s });
    setEditingSchedule(s);
    setScheduleDialog(true);
  };

  const saveSchedule = () => {
    if (editingSchedule) {
      setSchedules((prev) =>
        prev.map((s) => (s.area === editingSchedule.area ? scheduleDraft : s))
      );
    } else {
      setSchedules((prev) => [...prev, scheduleDraft]);
    }
    setScheduleDialog(false);
    setEditingSchedule(null);
  };

  // ─── Area detail modal ────────────────────────────────────────────────────────
  const openAreaDetail = (s: AreaSchedule) => {
    setDetailArea(s);
    setFocusedDate(null);
    setExceptionFormOpen(false);
    setCalendarMonth(new Date());
  };

  const areaExceptions = detailArea
    ? schedExceptions.filter((e) => e.area === detailArea.area)
    : [];

  const activeExDates = areaExceptions
    .filter((e) => e.status === "active")
    .map((e) => parseLocalDate(e.date));

  const pausedExDates = areaExceptions
    .filter((e) => e.status === "paused")
    .map((e) => parseLocalDate(e.date));

  const handleCalendarDayClick = (day: Date) => {
    const dateStr = toYYYYMMDD(day);
    const existing = areaExceptions.find((e) => e.date === dateStr);
    if (existing) {
      // highlight in the list
      setFocusedDate(dateStr);
      setExceptionFormOpen(false);
    } else {
      // open form for new exception on that date
      setFocusedDate(dateStr);
      setEditingException(null);
      setExDraft({
        area: detailArea!.area,
        date: dateStr,
        entryTime: null,
        exitTime: null,
        reason: "",
      });
      setExceptionFormOpen(true);
    }
  };

  const openEditException = (ex: ScheduleException) => {
    setEditingException(ex);
    setExDraft({
      area: ex.area,
      date: ex.date,
      entryTime: ex.entryTime,
      exitTime: ex.exitTime,
      reason: ex.reason,
    });
    setFocusedDate(ex.date);
    setExceptionFormOpen(true);
  };

  const saveException = () => {
    if (editingException) {
      setSchedExceptions((prev) =>
        prev.map((e) => (e.id === editingException.id ? { ...e, ...exDraft } : e))
      );
    } else {
      const nextId = Math.max(0, ...schedExceptions.map((e) => e.id)) + 1;
      setSchedExceptions((prev) => [
        ...prev,
        { id: nextId, ...exDraft, status: "active", createdAt: new Date().toISOString().slice(0, 10) },
      ]);
    }
    setExceptionFormOpen(false);
    setEditingException(null);
  };

  const toggleExceptionStatus = (id: number) => {
    setSchedExceptions((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: e.status === "active" ? "paused" : "active" } : e
      )
    );
  };

  const deleteException = (id: number) => {
    setSchedExceptions((prev) => prev.filter((e) => e.id !== id));
    if (focusedDate) setFocusedDate(null);
  };

  // ─── Holiday helpers ──────────────────────────────────────────────────────────
  const saveHoliday = () => {
    const nextId = Math.max(0, ...holidays.map((h) => h.id)) + 1;
    setHolidays((prev) => [...prev, { id: nextId, ...holidayDraft }]);
    setHolidayDialog(false);
    setHolidayDraft({ date: "", name: "", isNational: true, areas: [] });
  };

  const deleteHoliday = (id: number) =>
    setHolidays((prev) => prev.filter((h) => h.id !== id));

  // ─── Pay-hours exception helpers ──────────────────────────────────────────────
  const savePayException = () => {
    const nextId = Math.max(0, ...exceptions.map((e) => e.id)) + 1;
    setExceptions((prev) => [
      ...prev,
      { id: nextId, ...exceptionDraft, status: "pending", createdAt: new Date().toISOString().slice(0, 10) },
    ]);
    setExceptionDialog(false);
    setExceptionDraft({ date: "", employeeKey: "", employeeName: "", area: "", reason: "" });
  };

  const updateExceptionStatus = (id: number, status: "approved" | "rejected") => {
    setExceptions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status, approvedBy: "Usuario actual" } : e))
    );
  };

  const filteredExceptions =
    exceptionsFilter === "all"
      ? exceptions
      : exceptions.filter((e) => e.status === exceptionsFilter);

  const statusBadge = (status: PayHoursException["status"]) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-100 text-green-800 border-green-200">Aprobada</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800 border-red-200">Rechazada</Badge>;
      default:         return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Resumen
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administración de Recursos Humanos</h1>
            <p className="text-gray-600 text-sm">Configuración de horarios, días festivos y excepciones de pago</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b">
          {(
            [
              { key: "schedules",  label: "Horarios por Área",        icon: Clock       },
              { key: "holidays",   label: "Días Festivos / Libres",    icon: CalendarOff },
              { key: "exceptions", label: "Excepciones Pago de Horas", icon: DollarSign  },
            ] as { key: Tab; label: string; icon: React.ElementType }[]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Horarios por Área ─────────────────────────────────────────── */}
        {activeTab === "schedules" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Horarios de Entrada y Salida por Área
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Haz clic en una fila para ver y gestionar las excepciones de esa área
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingSchedule(null);
                  setScheduleDraft({ area: "", startTime: "", endTime: "", graceMins: 15 });
                  setScheduleDialog(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Área
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead className="text-center">Entrada</TableHead>
                    <TableHead className="text-center">Salida</TableHead>
                    <TableHead className="text-center">Tolerancia</TableHead>
                    <TableHead className="text-center">Límite tardanza</TableHead>
                    <TableHead className="text-center">Excepciones</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => {
                    const exCount = schedExceptions.filter((e) => e.area === s.area && e.status === "active").length;
                    return (
                      <TableRow
                        key={s.area}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => openAreaDetail(s)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {s.area}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">{s.startTime}</TableCell>
                        <TableCell className="text-center font-mono">{s.endTime}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{s.graceMins} min</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-orange-600">
                          {lateLimit(s)}
                        </TableCell>
                        <TableCell className="text-center">
                          {exCount > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              {exCount} activa{exCount !== 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSchedule(s);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ── Tab: Días Festivos ────────────────────────────────────────────── */}
        {activeTab === "holidays" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarOff className="h-5 w-5 text-amber-600" />
                Días Festivos y Libres
              </CardTitle>
              <Button size="sm" onClick={() => { setHolidayDraft({ date: "", name: "", isNational: true, areas: [] }); setHolidayDialog(true); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar Día
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-center">Alcance</TableHead>
                    <TableHead>Áreas</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.sort((a, b) => a.date.localeCompare(b.date)).map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono">{h.date}</TableCell>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell className="text-center">
                        {h.isNational ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 w-fit mx-auto">
                            <Globe className="h-3 w-3" />Nacional
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1 w-fit mx-auto">
                            <Building2 className="h-3 w-3" />Por área
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {h.areas.length === 0 ? "Todas las áreas" : h.areas.join(", ")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteHoliday(h.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ── Tab: Excepciones Pago de Horas ───────────────────────────────── */}
        {activeTab === "exceptions" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Excepciones — Pago de Horas (día festivo laboral)
              </CardTitle>
              <Button size="sm" onClick={() => { setExceptionDraft({ date: "", employeeKey: "", employeeName: "", area: "", reason: "" }); setExceptionDialog(true); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nueva Excepción
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Estado:</span>
                {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                  <button key={f} onClick={() => setExceptionsFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${exceptionsFilter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>
                    {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : f === "approved" ? "Aprobadas" : "Rechazadas"}
                    <span className="ml-1 opacity-70">({f === "all" ? exceptions.length : exceptions.filter((e) => e.status === f).length})</span>
                  </button>
                ))}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Aprobado por</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExceptions.map((ex) => (
                    <TableRow key={ex.id}>
                      <TableCell className="font-mono">{ex.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">{ex.employeeName}</p>
                            <p className="text-xs text-gray-500">{ex.employeeKey}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{ex.area}</TableCell>
                      <TableCell className="text-sm text-gray-700 max-w-[240px] truncate">{ex.reason}</TableCell>
                      <TableCell className="text-center">{statusBadge(ex.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{ex.approvedBy ?? "—"}</TableCell>
                      <TableCell>
                        {ex.status === "pending" && (
                          <div className="flex items-center gap-1 justify-center">
                            <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50" onClick={() => updateExceptionStatus(ex.id, "approved")}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => updateExceptionStatus(ex.id, "rejected")}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredExceptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No hay excepciones con el filtro seleccionado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Detalle de área + excepciones de horario
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!detailArea} onOpenChange={(open) => { if (!open) { setDetailArea(null); setExceptionFormOpen(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailArea && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  Excepciones de Horario — {detailArea.area}
                </DialogTitle>
              </DialogHeader>

              {/* Schedule summary strip */}
              <div className="flex items-center gap-6 px-1 py-2 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                <span className="flex items-center gap-1.5 text-blue-800">
                  <Clock className="h-4 w-4" />
                  <strong>Horario base:</strong>
                  &nbsp;{detailArea.startTime} – {detailArea.endTime}
                </span>
                <span className="text-blue-700">Tolerancia: {detailArea.graceMins} min</span>
                <span className="text-blue-700">Tardanza después de: {lateLimit(detailArea)}</span>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 mt-2">

                {/* ── Left: calendar ── */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Calendario</p>
                  <div className="border rounded-lg p-1 bg-white">
                    <Calendar
                      mode="single"
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      selected={focusedDate ? parseLocalDate(focusedDate) : undefined}
                      onDayClick={handleCalendarDayClick}
                      modifiers={{ active: activeExDates, paused: pausedExDates }}
                      modifiersClassNames={{
                        active: "!bg-amber-200 !text-amber-900 font-semibold rounded-md",
                        paused: "!bg-gray-200 !text-gray-500 rounded-md",
                      }}
                    />
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 px-1">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-amber-200 inline-block" />
                      Excepción activa
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-gray-200 inline-block" />
                      Pausada
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 px-1">
                    Haz clic en un día para agregar o ver su excepción.
                  </p>
                </div>

                {/* ── Right: exception list + form ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      Excepciones configuradas ({areaExceptions.length})
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1 h-7 text-xs"
                      onClick={() => {
                        setEditingException(null);
                        setFocusedDate(null);
                        setExDraft({ area: detailArea.area, date: "", entryTime: null, exitTime: null, reason: "" });
                        setExceptionFormOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Agregar
                    </Button>
                  </div>

                  {/* Exception form (inline) */}
                  {exceptionFormOpen && (
                    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-3">
                      <p className="text-sm font-medium text-blue-800">
                        {editingException ? "Editar excepción" : "Nueva excepción"}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Fecha</Label>
                          <Input
                            type="date"
                            value={exDraft.date}
                            onChange={(e) => setExDraft((d) => ({ ...d, date: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Motivo</Label>
                          <Input
                            value={exDraft.reason}
                            onChange={(e) => setExDraft((d) => ({ ...d, reason: e.target.value }))}
                            placeholder="Ej: Cierre anticipado"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Entrada override
                            <span className="text-gray-400 ml-1">(vacío = sin cambio)</span>
                          </Label>
                          <Input
                            type="time"
                            value={exDraft.entryTime ?? ""}
                            onChange={(e) =>
                              setExDraft((d) => ({ ...d, entryTime: e.target.value || null }))
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Salida override
                            <span className="text-gray-400 ml-1">(vacío = sin cambio)</span>
                          </Label>
                          <Input
                            type="time"
                            value={exDraft.exitTime ?? ""}
                            onChange={(e) =>
                              setExDraft((d) => ({ ...d, exitTime: e.target.value || null }))
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      {!exDraft.entryTime && !exDraft.exitTime && exDraft.date && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          Debes especificar al menos una hora de entrada o salida diferente.
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!exDraft.date || (!exDraft.entryTime && !exDraft.exitTime)}
                          onClick={saveException}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => { setExceptionFormOpen(false); setEditingException(null); }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Exception cards */}
                  {areaExceptions.length === 0 && !exceptionFormOpen && (
                    <div className="text-center py-8 text-gray-400 border rounded-lg border-dashed">
                      <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin excepciones configuradas</p>
                      <p className="text-xs">Haz clic en un día del calendario o usa el botón Agregar</p>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {areaExceptions
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((ex) => {
                        const isFocused = focusedDate === ex.date;
                        return (
                          <div
                            key={ex.id}
                            id={`ex-${ex.id}`}
                            className={`rounded-lg border p-3 transition-colors ${
                              isFocused
                                ? "border-blue-400 bg-blue-50"
                                : ex.status === "paused"
                                ? "border-gray-200 bg-gray-50 opacity-70"
                                : "border-amber-200 bg-amber-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-sm font-semibold">{ex.date}</span>
                                  {ex.status === "paused" ? (
                                    <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">Pausada</Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Activa</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 truncate">{ex.reason}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                  {ex.entryTime && (
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="h-3 w-3" />
                                      Entrada: <strong>{ex.entryTime}</strong>
                                    </span>
                                  )}
                                  {ex.exitTime && (
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="h-3 w-3" />
                                      Salida: <strong>{ex.exitTime}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                                  title={ex.status === "active" ? "Pausar" : "Reanudar"}
                                  onClick={() => toggleExceptionStatus(ex.id)}
                                >
                                  {ex.status === "active"
                                    ? <PauseCircle className="h-4 w-4" />
                                    : <PlayCircle className="h-4 w-4" />
                                  }
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-500 hover:text-amber-600"
                                  title="Editar"
                                  onClick={() => openEditException(ex)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                                  title="Eliminar"
                                  onClick={() => deleteException(ex.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: editar / crear horario ──────────────────────────────────── */}
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              {editingSchedule ? `Editar horario — ${editingSchedule.area}` : "Agregar área"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingSchedule && (
              <div className="space-y-1">
                <Label>Área</Label>
                <Input
                  value={scheduleDraft.area}
                  onChange={(e) => setScheduleDraft((d) => ({ ...d, area: e.target.value }))}
                  placeholder="Nombre del área"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Hora de entrada</Label>
                <Input type="time" value={scheduleDraft.startTime} onChange={(e) => setScheduleDraft((d) => ({ ...d, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Hora de salida</Label>
                <Input type="time" value={scheduleDraft.endTime} onChange={(e) => setScheduleDraft((d) => ({ ...d, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tolerancia de tardanza (minutos)</Label>
              <Input
                type="number" min={0} max={60}
                value={scheduleDraft.graceMins}
                onChange={(e) => setScheduleDraft((d) => ({ ...d, graceMins: parseInt(e.target.value) || 0 }))}
              />
              {scheduleDraft.startTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Tardanza después de{" "}
                  <strong>
                    {(() => {
                      const [h, m] = scheduleDraft.startTime.split(":").map(Number);
                      const total = h * 60 + m + scheduleDraft.graceMins;
                      return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
                    })()}
                  </strong>
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setScheduleDialog(false)}>
              <X className="h-4 w-4 mr-1" />Cancelar
            </Button>
            <Button onClick={saveSchedule} disabled={!scheduleDraft.startTime || !scheduleDraft.endTime}>
              <Save className="h-4 w-4 mr-1" />Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: agregar día festivo ──────────────────────────────────────── */}
      <Dialog open={holidayDialog} onOpenChange={setHolidayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-amber-600" />
              Agregar Día Festivo / Libre
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input type="date" value={holidayDraft.date} onChange={(e) => setHolidayDraft((d) => ({ ...d, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Nombre / Descripción</Label>
              <Input value={holidayDraft.name} onChange={(e) => setHolidayDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Ej: Día del Trabajo" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Día festivo nacional</Label>
                <p className="text-xs text-gray-500">{holidayDraft.isNational ? "Aplica a todas las áreas" : "Solo aplica a áreas seleccionadas"}</p>
              </div>
              <Switch checked={holidayDraft.isNational} onCheckedChange={(v) => setHolidayDraft((d) => ({ ...d, isNational: v, areas: v ? [] : d.areas }))} />
            </div>
            {!holidayDraft.isNational && (
              <div className="space-y-2">
                <Label className="text-sm">Áreas que aplica</Label>
                {SEED_SCHEDULES.map((s) => (
                  <label key={s.area} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={holidayDraft.areas.includes(s.area)}
                      onChange={(e) => setHolidayDraft((d) => ({ ...d, areas: e.target.checked ? [...d.areas, s.area] : d.areas.filter((a) => a !== s.area) }))}
                      className="rounded"
                    />
                    <span className="text-sm">{s.area}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setHolidayDialog(false)}><X className="h-4 w-4 mr-1" />Cancelar</Button>
            <Button onClick={saveHoliday} disabled={!holidayDraft.date || !holidayDraft.name}><Save className="h-4 w-4 mr-1" />Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: nueva excepción pago horas ──────────────────────────────── */}
      <Dialog open={exceptionDialog} onOpenChange={setExceptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Nueva Excepción — Pago de Horas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Fecha (día festivo que laborará)</Label>
              <Input type="date" value={exceptionDraft.date} onChange={(e) => setExceptionDraft((d) => ({ ...d, date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Clave empleado</Label>
                <Input value={exceptionDraft.employeeKey} onChange={(e) => setExceptionDraft((d) => ({ ...d, employeeKey: e.target.value }))} placeholder="EMP-001" />
              </div>
              <div className="space-y-1">
                <Label>Área</Label>
                <Select value={exceptionDraft.area} onValueChange={(v) => setExceptionDraft((d) => ({ ...d, area: v }))}>
                  <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
                  <SelectContent>
                    {SEED_SCHEDULES.map((s) => <SelectItem key={s.area} value={s.area}>{s.area}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nombre del empleado</Label>
              <Input value={exceptionDraft.employeeName} onChange={(e) => setExceptionDraft((d) => ({ ...d, employeeName: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Input value={exceptionDraft.reason} onChange={(e) => setExceptionDraft((d) => ({ ...d, reason: e.target.value }))} placeholder="Razón por la que laborará en festivo" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExceptionDialog(false)}><X className="h-4 w-4 mr-1" />Cancelar</Button>
            <Button onClick={savePayException} disabled={!exceptionDraft.date || !exceptionDraft.employeeKey || !exceptionDraft.employeeName || !exceptionDraft.area}>
              <Save className="h-4 w-4 mr-1" />Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
