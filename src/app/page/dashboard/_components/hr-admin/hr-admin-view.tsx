"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import * as hrApi from "@/lib/services/hr-admin.service";
import {
  ArrowLeft,
  Clock,
  CalendarOff,
  DollarSign,
  Timer,
  Plane,
  Layers,
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

/**
 * Escenarios de simulación. El backend solo acepta estas unidades y una cantidad
 * acotada, porque la fecha se concatena al SQL.
 */
const SIMULACIONES: { clave: string; etiqueta: string; unidad?: hrApi.UnidadSimulacion; cantidad?: number }[] = [
  { clave: "hoy",      etiqueta: "Hoy" },
  { clave: "2sem",     etiqueta: "En 2 semanas", unidad: "WEEK",  cantidad: 2 },
  { clave: "1mes",     etiqueta: "En 1 mes",     unidad: "MONTH", cantidad: 1 },
  { clave: "3meses",   etiqueta: "En 3 meses",   unidad: "MONTH", cantidad: 3 },
  { clave: "6meses",   etiqueta: "En 6 meses",   unidad: "MONTH", cantidad: 6 },
  { clave: "1anio",    etiqueta: "En 1 año",     unidad: "YEAR",  cantidad: 1 },
  { clave: "2anios",   etiqueta: "En 2 años",    unidad: "YEAR",  cantidad: 2 },
];

type Tab = "schedules" | "holidays" | "exceptions" | "timebank" | "vacations";

type ExceptionDraft = Omit<ScheduleException, "id" | "status" | "createdAt" | "createdBy">;

// ─── Component ────────────────────────────────────────────────────────────────
export function HRAdminView({ onBack }: HRAdminViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("schedules");

  // ── Schedules ────────────────────────────────────────────────────────────────
  const [schedules, setSchedules] = useState<AreaSchedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<AreaSchedule | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<AreaSchedule>({
    area: "", startTime: "", endTime: "", graceMins: 15,
  });

  // ── Area detail / exceptions ──────────────────────────────────────────────────
  const [schedExceptions, setSchedExceptions] = useState<ScheduleException[]>([]);
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

  // ── Vacaciones ───────────────────────────────────────────────────────────────
  const [vacaciones, setVacaciones] = useState<hrApi.VacacionesEmpleadoDTO[]>([]);
  const [vacExcluidos, setVacExcluidos] = useState<hrApi.VacacionesExcluidoDTO[]>([]);
  const [buscarVac, setBuscarVac] = useState("");
  const [simulacion, setSimulacion] = useState("hoy");
  const [ajusteEmpleado, setAjusteEmpleado] = useState<hrApi.VacacionesEmpleadoDTO | null>(null);
  const [ajusteValor, setAjusteValor] = useState("");

  // ── Grupos de horario ────────────────────────────────────────────────────────
  const [grupos, setGrupos] = useState<hrApi.ScheduleGroupDTO[]>([]);
  const [grupoDialog, setGrupoDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<hrApi.ScheduleGroupDTO | null>(null);
  const [grupoDraft, setGrupoDraft] = useState<{
    nombre: string; startTime: string; endTime: string; graceMins: number; areaIds: number[];
  }>({ nombre: "", startTime: "", endTime: "", graceMins: 15, areaIds: [] });

  // ── Destino de las horas fuera de jornada ────────────────────────────────────
  const [politicas, setPoliticas] = useState<hrApi.TimePolicyDTO[]>([]);
  const [politicaDialog, setPoliticaDialog] = useState(false);
  const [politicaDraft, setPoliticaDraft] = useState<{
    nombre: string; tipo: hrApi.TimePolicyDTO["tipo"]; dateFrom: string; dateTo: string; employeeIds: number[];
  }>({ nombre: "", tipo: "pago_vacaciones", dateFrom: "", dateTo: "", employeeIds: [] });
  const [empleados, setEmpleados] = useState<{ id: number; nombre: string; area: string }[]>([]);

  // ── Holidays ─────────────────────────────────────────────────────────────────
  const [holidays, setHolidays] = useState<HolidayConfig[]>([]);
  const [holidayDialog, setHolidayDialog] = useState(false);
  const [holidayDraft, setHolidayDraft] = useState<Omit<HolidayConfig, "id">>({
    date: "", name: "", isNational: true, areas: [],
  });

  // ── Pay-hours exceptions ──────────────────────────────────────────────────────
  const [exceptions, setExceptions] = useState<PayHoursException[]>([]);
  const [exceptionDialog, setExceptionDialog] = useState(false);
  const [exceptionDraft, setExceptionDraft] = useState<
    Omit<PayHoursException, "id" | "status" | "createdAt" | "approvedBy">
  >({ date: "", employeeId: undefined, employeeName: "", area: "", reason: "" });
  const [exceptionsFilter, setExceptionsFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // ─── Carga desde el API ───────────────────────────────────────────────────────
  // Hasta ahora esta pantalla trabajaba con datos semilla y estado local: lo que se
  // configuraba aquí no se guardaba en ningún lado.
  const { data: session } = useSession();
  const token = session?.user?.accessToken as string | undefined;
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!token) return;
    setCargando(true);
    setErrorApi(null);
    try {
      const [hor, grp, fes, pay, pol, emp] = await Promise.all([
        hrApi.getSchedules(token),
        hrApi.getScheduleGroups(token),
        hrApi.getHolidays(new Date().getFullYear(), token),
        hrApi.getPayExceptions(token),
        hrApi.getTimePolicies(token),
        hrApi.getEmployees(token),
      ]);
      // Las áreas sin horario configurado se descartan: no hay nada que mostrar ni editar.
      setSchedules(hor.filter(h => h.startTime && h.endTime).map(h => ({
        id: h.id, areaId: h.areaId, area: h.area,
        startTime: h.startTime as string, endTime: h.endTime as string,
        graceMins: h.graceMins ?? 15,
        grupoId: (h as { grupoId?: number | null }).grupoId ?? null,
        grupo: (h as { grupo?: string | null }).grupo ?? null,
        updatedAt: h.updatedAt, updatedBy: h.updatedBy,
      })));
      setGrupos(grp);
      setHolidays(fes.map(f => ({ id: f.id, date: f.date, name: f.name, isNational: f.isNational, areas: f.areas })));
      setExceptions(pay.map(e => ({
        id: e.id, date: e.date, employeeId: e.employeeId, employeeName: e.employeeName,
        area: e.area, reason: e.reason, status: e.status,
        approvedBy: e.approvedBy ?? undefined, createdAt: e.createdAt ?? "",
      })));
      setPoliticas(pol);
      setEmpleados(emp.map(e => ({ id: e.id, nombre: e.nombre, area: e.area })));
    } catch (e) {
      setErrorApi(e instanceof Error ? e.message : "No se pudo cargar la configuración");
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { void cargar(); }, [cargar]);

  /** Envuelve una acción de escritura: muestra el error y recarga si sale bien. */
  const ejecutar = async (accion: () => Promise<unknown>, alTerminar?: () => void) => {
    setErrorApi(null);
    try {
      await accion();
      await cargar();
      alTerminar?.();
    } catch (e) {
      setErrorApi(e instanceof Error ? e.message : "No se pudo guardar el cambio");
    }
  };

  /** Carga el saldo de vacaciones, opcionalmente proyectado a otra fecha. */
  const cargarVacaciones = useCallback(async (clave = "hoy") => {
    if (!token) return;
    const esc = SIMULACIONES.find((x) => x.clave === clave);
    try {
      const r = await hrApi.getVacationOverview(
        esc?.unidad && esc.cantidad ? { unidad: esc.unidad, cantidad: esc.cantidad } : undefined,
        token,
      );
      setVacaciones(r.employees);
      setVacExcluidos(r.excluded);
    } catch (e) {
      setErrorApi(e instanceof Error ? e.message : "No se pudo cargar el saldo de vacaciones");
    }
  }, [token]);

  useEffect(() => {
    // La simulación se recarga desde el propio selector, no aquí, para no pedir dos veces.
    if (activeTab === "vacations") void cargarVacaciones(simulacion);
  }, [activeTab, cargarVacaciones, simulacion]);

  const vacacionesFiltradas = vacaciones.filter((v) => {
    const q = buscarVac.trim().toLowerCase();
    return !q || v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q);
  });

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

  const saveSchedule = () =>
    ejecutar(
      () =>
        editingSchedule?.id
          // La fila se identifica por id, no por nombre de área: renombrar un área
          // dejaba huérfana la edición.
          ? hrApi.updateSchedule(editingSchedule.id, {
              startTime: scheduleDraft.startTime,
              endTime: scheduleDraft.endTime,
              graceMins: scheduleDraft.graceMins,
            }, token)
          : hrApi.createSchedule({
              area: scheduleDraft.area,
              startTime: scheduleDraft.startTime,
              endTime: scheduleDraft.endTime,
              graceMins: scheduleDraft.graceMins,
            }, token),
      () => { setScheduleDialog(false); setEditingSchedule(null); },
    );

  // ─── Area detail modal ────────────────────────────────────────────────────────
  const openAreaDetail = async (s: AreaSchedule) => {
    setDetailArea(s);
    setFocusedDate(null);
    setExceptionFormOpen(false);
    setCalendarMonth(new Date());
    // Las excepciones se piden por área, no todas de golpe: es como las expone el API.
    try {
      const filas = await hrApi.getScheduleExceptions(s.area, token);
      setSchedExceptions(filas.map((f) => ({
        id: f.id, areaId: f.areaId, area: f.area, date: f.date,
        entryTime: f.entryTime, exitTime: f.exitTime, reason: f.reason,
        status: f.status, createdAt: f.createdAt ?? "", createdBy: f.createdBy ?? undefined,
      })));
    } catch (e) {
      setErrorApi(e instanceof Error ? e.message : "No se pudieron cargar las excepciones");
    }
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

  const saveException = () =>
    ejecutar(
      () =>
        editingException
          ? hrApi.updateScheduleException(editingException.id, {
              entryTime: exDraft.entryTime, exitTime: exDraft.exitTime, reason: exDraft.reason,
            }, token)
          : hrApi.createScheduleException({ ...exDraft }, token),
      () => { setExceptionFormOpen(false); setEditingException(null); },
    );

  const toggleExceptionStatus = (id: number) => {
    const actual = schedExceptions.find((e) => e.id === id);
    if (!actual) return;
    void ejecutar(() => hrApi.updateScheduleException(
      id, { status: actual.status === "active" ? "paused" : "active" }, token));
  };

  const deleteException = (id: number) =>
    ejecutar(() => hrApi.deleteScheduleException(id, token), () => setFocusedDate(null));

  // ─── Holiday helpers ──────────────────────────────────────────────────────────
  const saveHoliday = () =>
    ejecutar(
      () => hrApi.createHoliday({ ...holidayDraft }, token),
      () => {
        setHolidayDialog(false);
        setHolidayDraft({ date: "", name: "", isNational: true, areas: [] });
      },
    );

  const deleteHoliday = (id: number) => ejecutar(() => hrApi.deleteHoliday(id, token));

  // ─── Pay-hours exception helpers ──────────────────────────────────────────────
  const savePayException = () =>
    ejecutar(
      () => hrApi.createPayException({
        date: exceptionDraft.date,
        // El backend espera el id numérico; el formulario pedía una clave de texto
        // libre tipo "EMP-001" que no correspondía con ningún empleado real.
        employeeId: Number(exceptionDraft.employeeId),
        area: exceptionDraft.area,
        reason: exceptionDraft.reason,
      }, token),
      () => {
        setExceptionDialog(false);
        setExceptionDraft({ date: "", employeeId: undefined, employeeName: "", area: "", reason: "" });
      },
    );

  const updateExceptionStatus = (id: number, status: "approved" | "rejected") =>
    ejecutar(() => hrApi.updatePayExceptionStatus(id, status, token));

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

        {errorApi && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{errorApi}</span>
            <button type="button" onClick={() => setErrorApi(null)} className="font-medium text-red-600 hover:text-red-900">
              Cerrar
            </button>
          </div>
        )}
        {cargando && (
          <p className="mb-4 text-sm text-gray-500">Cargando configuración…</p>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 border-b">
          {(
            [
              { key: "schedules",  label: "Horarios por Área",        icon: Clock       },
              { key: "holidays",   label: "Días Festivos / Libres",    icon: CalendarOff },
              { key: "exceptions", label: "Excepciones Pago de Horas", icon: DollarSign  },
              { key: "timebank",   label: "Horas Fuera de Jornada",    icon: Timer       },
              { key: "vacations",  label: "Días de Vacaciones",        icon: Plane       },
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

        {/* ── Vacaciones: vista general y ajustes ──────────────────────────── */}
        {activeTab === "vacations" && (
          <Card>
            <CardHeader>
              <div className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-sky-600" />
                    Días de Vacaciones — Vista General
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Saldo de toda la plantilla con su desglose. El ajuste es editable: sirve
                    para los días que alguien traía de antes de su fecha de contrato o para
                    reconciliar saldos llevados a mano.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Label className="text-xs text-gray-500">Simular</Label>
                  <Select
                    value={simulacion}
                    onValueChange={(v) => { setSimulacion(v); void cargarVacaciones(v); }}
                  >
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIMULACIONES.map((s) => (
                        <SelectItem key={s.clave} value={s.clave}>{s.etiqueta}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {simulacion !== "hoy" && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Simulación a <strong>{SIMULACIONES.find((s) => s.clave === simulacion)?.etiqueta.toLowerCase()}</strong>.
                    Los saldos de abajo son proyectados; no se guarda nada.
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Input
                    placeholder="Buscar por nombre o área…"
                    value={buscarVac}
                    onChange={(e) => setBuscarVac(e.target.value)}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {vacacionesFiltradas.length} de {vacaciones.length} empleados
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead className="text-center">Contrato</TableHead>
                    <TableHead className="text-center">Año</TableHead>
                    <TableHead className="text-center">
                      Devengado<br /><span className="font-normal text-gray-400">del año en curso</span>
                    </TableHead>
                    <TableHead className="text-center">Gozados</TableHead>
                    <TableHead className="text-center">Ajuste</TableHead>
                    <TableHead className="text-center">Saldo</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacacionesFiltradas.map((v) => (
                    <TableRow key={v.employeeId}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{v.area}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{v.hireDate}</TableCell>
                      <TableCell className="text-center">{v.serviceYear}</TableCell>
                      <TableCell className="text-center text-gray-600">{v.accruedThisYear}</TableCell>
                      <TableCell className="text-center text-gray-600">{v.daysTaken}</TableCell>
                      <TableCell className="text-center">
                        <span className={v.adjustment < 0 ? "text-red-600" : v.adjustment > 0 ? "text-green-700" : "text-gray-400"}>
                          {v.adjustment > 0 ? "+" : ""}{v.adjustment}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={v.balance < 0
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-green-100 text-green-800 border-green-200"}>
                          {v.balance}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ajustar días"
                          disabled={simulacion !== "hoy"}
                          onClick={() => { setAjusteEmpleado(v); setAjusteValor(String(v.adjustment)); }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {vacacionesFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        Sin resultados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Quien no entra en el cálculo. Antes desaparecía sin avisar y la pantalla
                  le mostraba 0 días, que se confunde con "ya las gastó todas". */}
              {vacExcluidos.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    {vacExcluidos.length} empleado{vacExcluidos.length === 1 ? "" : "s"} sin cálculo posible
                  </div>
                  <p className="text-xs text-amber-700 mb-2">
                    Les falta la fecha de contrato o el tipo de usuario, así que no se les puede
                    devengar nada. En su perfil verán 0 días hasta que se completen esos datos.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {vacExcluidos.map((e) => (
                      <span key={e.employeeId} className="inline-flex items-center gap-1 bg-white border border-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded">
                        {e.name}
                        <span className="text-amber-500">· {e.motivo}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Grupos de horario ────────────────────────────────────────────── */}
        {activeTab === "schedules" && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-600" />
                  Grupos de Horario
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Varias áreas que salen a la misma hora. El horario del grupo manda sobre
                  el propio del área; al eliminar el grupo, cada una vuelve al suyo.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingGrupo(null);
                  setGrupoDraft({ nombre: "", startTime: "", endTime: "", graceMins: 15, areaIds: [] });
                  setGrupoDialog(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Grupo
              </Button>
            </CardHeader>
            <CardContent>
              {grupos.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No hay grupos. Cada área usa su propio horario.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Áreas</TableHead>
                      <TableHead className="text-center">Entrada</TableHead>
                      <TableHead className="text-center">Salida</TableHead>
                      <TableHead className="text-center">Tolerancia</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupos.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.nombre}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {g.areas.length === 0
                              ? <span className="text-gray-400 text-xs">Sin áreas asignadas</span>
                              : g.areas.map((a) => (
                                  <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                                ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">{g.startTime}</TableCell>
                        <TableCell className="text-center font-mono">{g.endTime}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{g.graceMins} min</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingGrupo(g);
                              setGrupoDraft({
                                nombre: g.nombre, startTime: g.startTime, endTime: g.endTime,
                                graceMins: g.graceMins, areaIds: g.areaIds,
                              });
                              setGrupoDialog(true);
                            }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`¿Eliminar el grupo "${g.nombre}"? Cada área volverá a su horario propio.`))
                                  void ejecutar(() => hrApi.deleteScheduleGroup(g.id, token));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Horas fuera de jornada ───────────────────────────────────────── */}
        {activeTab === "timebank" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-amber-600" />
                  Destino de las Horas Fuera de Jornada
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Las horas que alguien se queda después de su salida se cuentan siempre, en
                  bloques de media hora. Aquí se decide a qué se destinan; sin una política
                  vigente solo se muestran.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setPoliticaDraft({ nombre: "", tipo: "pago_vacaciones", dateFrom: "", dateTo: "", employeeIds: [] });
                  setPoliticaDialog(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nueva Política
              </Button>
            </CardHeader>
            <CardContent>
              {politicas.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  No hay políticas. Las horas fuera de jornada se calculan y se muestran,
                  pero no se destinan a nada.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Política</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Empleados</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {politicas.map((pol) => (
                      <TableRow key={pol.id}>
                        <TableCell className="font-medium">{pol.nombre}</TableCell>
                        <TableCell>
                          <Badge className={pol.tipo === "pago_vacaciones"
                            ? "bg-sky-100 text-sky-800 border-sky-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"}>
                            {hrApi.ETIQUETA_TIPO_POLITICA[pol.tipo]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {pol.dateFrom === pol.dateTo ? pol.dateFrom : `${pol.dateFrom} — ${pol.dateTo}`}
                        </TableCell>
                        <TableCell className="text-sm max-w-[260px]">
                          {pol.empleados.length === 0
                            ? <span className="text-gray-400">—</span>
                            : <span className="text-gray-700">{pol.empleados.join(", ")}</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {pol.status === "active"
                            ? <Badge className="bg-green-100 text-green-800 border-green-200">Vigente</Badge>
                            : <Badge className="bg-gray-100 text-gray-700 border-gray-200">Cerrada</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title={pol.status === "active" ? "Cerrar" : "Reabrir"}
                              onClick={() => void ejecutar(() => hrApi.updateTimePolicyStatus(
                                pol.id, pol.status === "active" ? "closed" : "active", token))}
                            >
                              {pol.status === "active"
                                ? <PauseCircle className="h-4 w-4" />
                                : <PlayCircle className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`¿Eliminar la política "${pol.nombre}"?`))
                                  void ejecutar(() => hrApi.deleteTimePolicy(pol.id, token));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

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
                    <TableHead>Grupo</TableHead>
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
                        <TableCell>
                          {s.grupo
                            ? <Badge className="bg-violet-100 text-violet-800 border-violet-200">{s.grupo}</Badge>
                            : <span className="text-gray-400 text-xs">Horario propio</span>}
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
              <Button size="sm" onClick={() => { setExceptionDraft({ date: "", employeeId: undefined, employeeName: "", area: "", reason: "" }); setExceptionDialog(true); }} className="flex items-center gap-2">
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
                            <p className="text-xs text-gray-500">{ex.area}</p>
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
      {/* ── Dialog: ajuste manual de días de vacaciones ──────────────────── */}
      <Dialog open={!!ajusteEmpleado} onOpenChange={(open) => { if (!open) setAjusteEmpleado(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar días de vacaciones</DialogTitle>
          </DialogHeader>
          {ajusteEmpleado && (() => {
            const nuevo = Number(ajusteValor);
            const valido = ajusteValor.trim() !== "" && Number.isFinite(nuevo) && nuevo >= -365 && nuevo <= 365;
            // El saldo sin ajuste es el que sale del devengo puro; sobre él se aplica el
            // valor nuevo para que se vea el efecto antes de guardar.
            const sinAjuste = ajusteEmpleado.balance - ajusteEmpleado.adjustment;
            const saldoNuevo = Math.round((sinAjuste + (valido ? nuevo : 0)) * 100) / 100;
            return (
              <>
                <div className="space-y-4 py-2">
                  <div>
                    <p className="font-medium">{ajusteEmpleado.name}</p>
                    <p className="text-xs text-gray-500">
                      {ajusteEmpleado.area} · contrato {ajusteEmpleado.hireDate} · año {ajusteEmpleado.serviceYear}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-600">Días de sus {ajusteEmpleado.serviceYear - 1} año(s) completos</span><span className="font-mono">{ajusteEmpleado.daysFromPriorYears}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Devengado del año en curso</span><span className="font-mono">+{ajusteEmpleado.accruedThisYear}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Días gozados</span><span className="font-mono">−{ajusteEmpleado.daysTaken}</span></div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="text-gray-700 font-medium">Saldo sin ajuste</span>
                      <span className="font-mono font-semibold">{Math.round(sinAjuste * 100) / 100}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Ajuste manual (días)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ajusteValor}
                      onChange={(e) => setAjusteValor(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">
                      Admite decimales y valores negativos. Positivo suma días —por ejemplo los
                      que traía de antes de su contrato—; negativo los resta.
                    </p>
                    {!valido && ajusteValor.trim() !== "" && (
                      <p className="text-xs text-red-600">Debe ser un número entre −365 y 365.</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                    <span className="text-sm text-sky-800">Saldo resultante</span>
                    <span className={`font-mono font-bold ${saldoNuevo < 0 ? "text-red-600" : "text-sky-900"}`}>
                      {saldoNuevo}
                    </span>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setAjusteEmpleado(null)}>
                    <X className="h-4 w-4 mr-1" />Cancelar
                  </Button>
                  <Button
                    disabled={!valido}
                    onClick={() => {
                      setErrorApi(null);
                      hrApi.updateVacationAdjustment(ajusteEmpleado.employeeId, nuevo, token)
                        .then(() => cargarVacaciones(simulacion))
                        .then(() => setAjusteEmpleado(null))
                        .catch((e) => setErrorApi(e instanceof Error ? e.message : "No se pudo guardar el ajuste"));
                    }}
                  >
                    <Save className="h-4 w-4 mr-1" />Guardar
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: grupo de horario ─────────────────────────────────────── */}
      <Dialog open={grupoDialog} onOpenChange={setGrupoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGrupo ? "Editar Grupo" : "Nuevo Grupo de Horario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nombre del grupo</Label>
              <Input
                value={grupoDraft.nombre}
                onChange={(e) => setGrupoDraft((d) => ({ ...d, nombre: e.target.value }))}
                placeholder="Administrativo"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Entrada</Label>
                <Input type="time" value={grupoDraft.startTime}
                  onChange={(e) => setGrupoDraft((d) => ({ ...d, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Salida</Label>
                <Input type="time" value={grupoDraft.endTime}
                  onChange={(e) => setGrupoDraft((d) => ({ ...d, endTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Tolerancia</Label>
                <Input type="number" min={0} max={60} value={grupoDraft.graceMins}
                  onChange={(e) => setGrupoDraft((d) => ({ ...d, graceMins: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Áreas que comparten este horario</Label>
              <div className="border rounded-md max-h-56 overflow-y-auto divide-y">
                {schedules.map((a) => {
                  const marcada = grupoDraft.areaIds.includes(a.areaId as number);
                  // Un área solo puede estar en un grupo: si ya está en otro, se avisa
                  // para que no parezca que se perdió el cambio al guardar.
                  const enOtroGrupo = !!a.grupoId && a.grupoId !== editingGrupo?.id;
                  return (
                    <label key={a.areaId} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={marcada}
                        onChange={(e) => setGrupoDraft((d) => ({
                          ...d,
                          areaIds: e.target.checked
                            ? [...d.areaIds, a.areaId as number]
                            : d.areaIds.filter((x) => x !== a.areaId),
                        }))}
                      />
                      <span className="flex-1">{a.area}</span>
                      {enOtroGrupo && !marcada && (
                        <span className="text-xs text-amber-600">en «{a.grupo}»</span>
                      )}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                {grupoDraft.areaIds.length} área{grupoDraft.areaIds.length === 1 ? "" : "s"} seleccionada
                {grupoDraft.areaIds.length === 1 ? "" : "s"}. Las que se quiten vuelven a su horario propio.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGrupoDialog(false)}>
              <X className="h-4 w-4 mr-1" />Cancelar
            </Button>
            <Button
              onClick={() => void ejecutar(
                () => editingGrupo
                  ? hrApi.updateScheduleGroup(editingGrupo.id, grupoDraft, token)
                  : hrApi.createScheduleGroup(grupoDraft, token),
                () => { setGrupoDialog(false); setEditingGrupo(null); },
              )}
              disabled={!grupoDraft.nombre || !grupoDraft.startTime || !grupoDraft.endTime}
            >
              <Save className="h-4 w-4 mr-1" />Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: política de horas fuera de jornada ───────────────────── */}
      <Dialog open={politicaDialog} onOpenChange={setPoliticaDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Política de Horas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={politicaDraft.nombre}
                onChange={(e) => setPoliticaDraft((d) => ({ ...d, nombre: e.target.value }))}
                placeholder="Pago de vacaciones adeudadas — septiembre"
              />
            </div>
            <div className="space-y-1">
              <Label>¿A qué se destinan las horas?</Label>
              <Select
                value={politicaDraft.tipo}
                onValueChange={(v) => setPoliticaDraft((d) => ({ ...d, tipo: v as hrApi.TimePolicyDTO["tipo"] }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago_vacaciones">{hrApi.ETIQUETA_TIPO_POLITICA.pago_vacaciones}</SelectItem>
                  <SelectItem value="horas_extra">{hrApi.ETIQUETA_TIPO_POLITICA.horas_extra}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {politicaDraft.tipo === "pago_vacaciones"
                  ? "Para quien tomó vacaciones que no tenía y las devuelve quedándose."
                  : "Para cuando se acordó pagar el tiempo extra trabajado."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Desde</Label>
                <Input type="date" value={politicaDraft.dateFrom}
                  onChange={(e) => setPoliticaDraft((d) => ({ ...d, dateFrom: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Hasta</Label>
                <Input type="date" value={politicaDraft.dateTo}
                  onChange={(e) => setPoliticaDraft((d) => ({ ...d, dateTo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Empleados</Label>
              <div className="border rounded-md max-h-56 overflow-y-auto divide-y">
                {empleados.map((e) => (
                  <label key={e.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={politicaDraft.employeeIds.includes(e.id)}
                      onChange={(ev) => setPoliticaDraft((d) => ({
                        ...d,
                        employeeIds: ev.target.checked
                          ? [...d.employeeIds, e.id]
                          : d.employeeIds.filter((x) => x !== e.id),
                      }))}
                    />
                    <span className="flex-1">{e.nombre}</span>
                    <span className="text-xs text-gray-400">{e.area}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {politicaDraft.employeeIds.length} seleccionado
                {politicaDraft.employeeIds.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPoliticaDialog(false)}>
              <X className="h-4 w-4 mr-1" />Cancelar
            </Button>
            <Button
              onClick={() => void ejecutar(
                () => hrApi.createTimePolicy(politicaDraft, token),
                () => setPoliticaDialog(false),
              )}
              disabled={
                !politicaDraft.nombre || !politicaDraft.dateFrom ||
                !politicaDraft.dateTo || politicaDraft.employeeIds.length === 0
              }
            >
              <Save className="h-4 w-4 mr-1" />Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {schedules.map((s) => (
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
            {/* Un selector de empleados reales: antes se escribía a mano una clave tipo
                "EMP-001" que no correspondía con ningún registro, y el área se elegía
                aparte pudiendo no ser la suya. Ahora ambos salen del propio empleado. */}
            <div className="space-y-1">
              <Label>Empleado</Label>
              <Select
                value={exceptionDraft.employeeId ? String(exceptionDraft.employeeId) : ""}
                onValueChange={(v) => {
                  const emp = empleados.find((e) => String(e.id) === v);
                  setExceptionDraft((d) => ({
                    ...d,
                    employeeId: emp ? emp.id : undefined,
                    employeeName: emp ? emp.nombre : "",
                    area: emp ? emp.area : "",
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Buscar empleado" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {empleados.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nombre} — {e.area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {exceptionDraft.area && (
                <p className="text-xs text-gray-500">Área: {exceptionDraft.area}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Input value={exceptionDraft.reason} onChange={(e) => setExceptionDraft((d) => ({ ...d, reason: e.target.value }))} placeholder="Razón por la que laborará en festivo" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setExceptionDialog(false)}><X className="h-4 w-4 mr-1" />Cancelar</Button>
            <Button onClick={savePayException} disabled={!exceptionDraft.date || !exceptionDraft.employeeId || !exceptionDraft.area}>
              <Save className="h-4 w-4 mr-1" />Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
