/**
 * Servicio de la configuración de RR.HH. (Métricas → Configuración).
 *
 * Hasta ahora `hr-admin-view.tsx` funcionaba con datos semilla y estado local: los
 * horarios que se configuraban ahí nunca se guardaban. El backend (`/api/hr-admin/*`,
 * 12 handlers) estaba completo pero no lo llamaba nadie. Esto es el cableado.
 *
 * Sigue el patrón de `produccion.service.ts`: funciones sueltas que reciben el token,
 * lanzan `Error` con el mensaje del servidor y no guardan estado.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const BASE = `${API_URL}/api/hr-admin`;

function getHeaders(token?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Extrae el campo `error` que devuelve el backend; si no hay, usa el texto por defecto. */
async function mensajeError(res: Response, porDefecto: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || porDefecto;
  } catch {
    return `${porDefecto} (${res.status} ${res.statusText})`;
  }
}

async function pedir<T>(ruta: string, token: string | undefined, init: RequestInit, falla: string): Promise<T> {
  const res = await fetch(`${BASE}${ruta}`, { ...init, headers: getHeaders(token) });
  if (!res.ok) throw new Error(await mensajeError(res, falla));
  return res.json() as Promise<T>;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AreaScheduleDTO {
  id: number | null;
  areaId: number;
  area: string;
  startTime: string | null;
  endTime: string | null;
  graceMins: number | null;
  /** Grupo al que pertenece el área, si comparte jornada con otras. */
  grupo?: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface ScheduleGroupDTO {
  id: number;
  nombre: string;
  startTime: string;
  endTime: string;
  graceMins: number;
  areas: string[];
  areaIds: number[];
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface ScheduleExceptionDTO {
  id: number;
  areaId: number;
  area: string;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  reason: string;
  status: "active" | "paused";
  createdAt: string | null;
  createdBy: string | null;
}

export interface HolidayDTO {
  id: number;
  date: string;
  name: string;
  isNational: boolean;
  areas: string[];
}

export interface PayExceptionDTO {
  id: number;
  date: string;
  employeeId: number;
  employeeName: string;
  areaId: number;
  area: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy: string | null;
  createdAt: string | null;
}

/** Destino que se le da a las horas fuera de jornada de unas personas concretas. */
export interface TimePolicyDTO {
  id: number;
  nombre: string;
  tipo: "pago_vacaciones" | "horas_extra";
  dateFrom: string;
  dateTo: string;
  status: "active" | "closed";
  createdBy: string | null;
  createdAt: string | null;
  empleados: string[];
  empleadoIds: number[];
}

export const ETIQUETA_TIPO_POLITICA: Record<TimePolicyDTO["tipo"], string> = {
  pago_vacaciones: "Pago de vacaciones adeudadas",
  horas_extra: "Pago por tiempo extra",
};

export interface EmpleadoDTO {
  id: number;
  nombre: string;
  area: string;
  areaId: number | null;
}

/** Todos los empleados activos, para los selectores de esta pantalla. */
export const getEmployees = (token?: string) =>
  pedir<EmpleadoDTO[]>("/employees", token, { method: "GET" }, "No se pudieron cargar los empleados");

// ─── Horarios por área ────────────────────────────────────────────────────────

export const getSchedules = (token?: string) =>
  pedir<AreaScheduleDTO[]>("/schedules", token, { method: "GET" }, "No se pudieron cargar los horarios");

export const createSchedule = (
  datos: { area: string; startTime: string; endTime: string; graceMins: number },
  token?: string,
) => pedir<AreaScheduleDTO>("/schedules", token, { method: "POST", body: JSON.stringify(datos) },
  "No se pudo crear el horario");

export const updateSchedule = (
  id: number,
  datos: Partial<{ startTime: string; endTime: string; graceMins: number }>,
  token?: string,
) => pedir<AreaScheduleDTO>(`/schedules/${id}`, token, { method: "PUT", body: JSON.stringify(datos) },
  "No se pudo guardar el horario");

// ─── Grupos de horario ────────────────────────────────────────────────────────

export const getScheduleGroups = (token?: string) =>
  pedir<ScheduleGroupDTO[]>("/schedule-groups", token, { method: "GET" }, "No se pudieron cargar los grupos");

export const createScheduleGroup = (
  datos: { nombre: string; startTime: string; endTime: string; graceMins: number; areaIds: number[] },
  token?: string,
) => pedir<ScheduleGroupDTO>("/schedule-groups", token, { method: "POST", body: JSON.stringify(datos) },
  "No se pudo crear el grupo");

export const updateScheduleGroup = (
  id: number,
  datos: { nombre: string; startTime: string; endTime: string; graceMins: number; areaIds: number[] },
  token?: string,
) => pedir<ScheduleGroupDTO>(`/schedule-groups/${id}`, token, { method: "PUT", body: JSON.stringify(datos) },
  "No se pudo guardar el grupo");

export const deleteScheduleGroup = (id: number, token?: string) =>
  pedir<{ deleted: number }>(`/schedule-groups/${id}`, token, { method: "DELETE" },
    "No se pudo eliminar el grupo");

// ─── Excepciones de horario ───────────────────────────────────────────────────

export const getScheduleExceptions = (area: string, token?: string) =>
  pedir<ScheduleExceptionDTO[]>(`/schedule-exceptions?area=${encodeURIComponent(area)}`, token,
    { method: "GET" }, "No se pudieron cargar las excepciones");

export const createScheduleException = (
  datos: { area: string; date: string; entryTime: string | null; exitTime: string | null; reason: string },
  token?: string,
) => pedir<ScheduleExceptionDTO>("/schedule-exceptions", token, { method: "POST", body: JSON.stringify(datos) },
  "No se pudo crear la excepción");

export const updateScheduleException = (
  id: number,
  datos: Partial<{ entryTime: string | null; exitTime: string | null; reason: string; status: string }>,
  token?: string,
) => pedir<ScheduleExceptionDTO>(`/schedule-exceptions/${id}`, token, { method: "PUT", body: JSON.stringify(datos) },
  "No se pudo guardar la excepción");

export const deleteScheduleException = (id: number, token?: string) =>
  pedir<{ deleted: number }>(`/schedule-exceptions/${id}`, token, { method: "DELETE" },
    "No se pudo eliminar la excepción");

// ─── Festivos ─────────────────────────────────────────────────────────────────

export const getHolidays = (year: number | undefined, token?: string) =>
  pedir<HolidayDTO[]>(`/holidays${year ? `?year=${year}` : ""}`, token, { method: "GET" },
    "No se pudieron cargar los festivos");

export const createHoliday = (
  datos: { date: string; name: string; isNational: boolean; areas: string[] },
  token?: string,
) => pedir<HolidayDTO>("/holidays", token, { method: "POST", body: JSON.stringify(datos) },
  "No se pudo crear el festivo");

export const deleteHoliday = (id: number, token?: string) =>
  pedir<{ deleted: number }>(`/holidays/${id}`, token, { method: "DELETE" },
    "No se pudo eliminar el festivo");

// ─── Excepciones de pago (trabajó en festivo) ─────────────────────────────────

export const getPayExceptions = (token?: string) =>
  pedir<PayExceptionDTO[]>("/pay-exceptions", token, { method: "GET" },
    "No se pudieron cargar las excepciones de pago");

export const createPayException = (
  datos: { date: string; employeeId: number; area: string; reason: string },
  token?: string,
) => pedir<PayExceptionDTO>("/pay-exceptions", token, { method: "POST", body: JSON.stringify(datos) },
  "No se pudo crear la excepción");

export const updatePayExceptionStatus = (
  id: number,
  status: "approved" | "rejected",
  token?: string,
) => pedir<PayExceptionDTO>(`/pay-exceptions/${id}/status`, token, { method: "PUT", body: JSON.stringify({ status }) },
  "No se pudo actualizar el estado");

// ─── Destino de las horas fuera de jornada ───────────────────────────────────

export const getTimePolicies = (token?: string) =>
  pedir<TimePolicyDTO[]>("/time-policies", token, { method: "GET" },
    "No se pudieron cargar las políticas de horas");

export const createTimePolicy = (
  datos: {
    nombre: string;
    tipo: TimePolicyDTO["tipo"];
    dateFrom: string;
    dateTo: string;
    employeeIds: number[];
  },
  token?: string,
) => pedir<TimePolicyDTO>("/time-policies", token, { method: "POST", body: JSON.stringify(datos) },
  "No se pudo crear la política");

export const updateTimePolicyStatus = (id: number, status: "active" | "closed", token?: string) =>
  pedir<{ id: number; status: string }>(`/time-policies/${id}/status`, token,
    { method: "PUT", body: JSON.stringify({ status }) }, "No se pudo actualizar la política");

export const deleteTimePolicy = (id: number, token?: string) =>
  pedir<{ deleted: number }>(`/time-policies/${id}`, token, { method: "DELETE" },
    "No se pudo eliminar la política");
