import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * Exportación del reporte completo de asistencia.
 *
 * Vive aquí y no dentro de la vista porque hay DOS botones "Exportar a Excel": el de la
 * portada del dashboard y el de la vista de Asistencia. El de la portada no tenía
 * `onClick` y no descargaba nada; con la lógica compartida los dos hacen lo mismo y no
 * pueden volver a divergir.
 */

/** Traduce la etiqueta del filtro de período a un rango de fechas. */
export function periodoAFechas(period: string): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  switch (period) {
    case "Hoy": { const s = fmt(today); return { dateFrom: s, dateTo: s }; }
    case "Esta Semana": {
      const day = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
      return { dateFrom: fmt(start), dateTo: fmt(today) };
    }
    case "Este Mes":
      return { dateFrom: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), dateTo: fmt(today) };
    case "Último Trimestre": {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 3);
      return { dateFrom: fmt(start), dateTo: fmt(today) };
    }
    case "Este Año":
      return { dateFrom: fmt(new Date(today.getFullYear(), 0, 1)), dateTo: fmt(today) };
    default:
      return { dateFrom: "", dateTo: "" };
  }
}

/**
 * Formatea "HH:mm" o "HH:mm:ss" a "HH:mm:ss". No desplaza el huso: la API ya entrega
 * los marcajes en hora de Honduras.
 */
export function formatearHora(hora: string): string {
  if (!hora) return "";
  const [h, m, s] = hora.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s || 0)}`;
}

/** Diferencia entre dos horas "HH:mm[:ss]" como "Xh Ym". */
export function horasTrabajadas(entrada: string | null, salida: string | null): string {
  const e = (entrada || "").trim();
  const x = (salida || "").trim();
  if (!e || !x) return "—";
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return isNaN(h) || isNaN(m) ? NaN : h * 60 + m;
  };
  const diff = toMins(x) - toMins(e);
  if (isNaN(diff) || diff <= 0) return "—";
  const hh = Math.floor(diff / 60);
  const mm = diff % 60;
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`;
}

/**
 * Hora de salida usada solo como respaldo. El horario real lo define RR.HH. por área
 * (o por grupo de áreas) en Métricas → Configuración, y lo resuelve el backend.
 */
export const FIN_JORNADA = { h: 16, m: 45 };

/**
 * Horas extra de un día.
 *
 * `deBackend` es el valor ya calculado contra el horario del área y redondeado a
 * bloques de media hora; se usa cuando viene. El cálculo local es el respaldo para
 * respuestas antiguas y da por hecho que todos salen a las 16:45.
 */
export function horasExtra(salida: string | null, deBackend?: number): number {
  if (typeof deBackend === "number") return deBackend;
  if (!salida) return 0;
  const [h, m] = salida.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  const over = h * 60 + m - (FIN_JORNADA.h * 60 + FIN_JORNADA.m);
  return over > 0 ? Math.round((over / 60) * 10) / 10 : 0;
}

interface FilaMensual {
  fecha: string;
  int_id_empleado: number;
  nombre_empleado: string;
  area: string;
  entrada: string;
  salida: string;
}

export interface OpcionesExport {
  token: string;
  /** Nombre de área a filtrar, o null para todas las que el usuario pueda ver. */
  area?: string | null;
  dateFrom?: string;
  dateTo?: string;
  fileName?: string;
}

/**
 * Descarga el reporte completo de asistencia.
 *
 * @returns cuántas filas se exportaron. 0 significa que no había nada que descargar,
 *   y quien llama debe avisarlo: antes se devolvía en silencio y parecía que el botón
 *   estaba roto.
 */
export async function exportarAsistenciaCompleta({
  token,
  area,
  dateFrom,
  dateTo,
  fileName = "asistencias.xlsx",
}: OpcionesExport): Promise<number> {
  const params = new URLSearchParams();
  if (area) params.set("area", area);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/requests/get-monthly-attendance?${params}`,
    { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`El servidor respondió ${res.status} ${res.statusText}`);

  const datos: FilaMensual[] = await res.json();
  if (!datos.length) return 0;

  const workbook = new ExcelJS.Workbook();

  // ── Hoja 1: resumen ───────────────────────────────────────────────────────
  const resumen = workbook.addWorksheet("Resumen Asistencia");
  const porArea: Record<string, number> = {};
  const porEmpleado: Record<string, number> = {};
  datos.forEach((r) => {
    porArea[r.area] = (porArea[r.area] || 0) + 1;
    porEmpleado[r.nombre_empleado] = (porEmpleado[r.nombre_empleado] || 0) + 1;
  });
  const conMarcaje = datos.filter((r) => r.entrada && r.entrada !== "sin marcaje").length;
  const ordenadas = [...datos].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  resumen.addRows([
    ["Total de registros", datos.length],
    ["Días con marcaje", conMarcaje],
    ["Días sin marcaje", datos.length - conMarcaje],
    ["Empleados únicos", new Set(datos.map((r) => r.int_id_empleado)).size],
    ["Área filtrada", area || "Todas las áreas"],
    ["Período", dateFrom && dateTo ? `${dateFrom} — ${dateTo}` : "Sin filtro"],
    ["Primer registro", ordenadas[0]?.fecha?.toString() ?? ""],
    ["Último registro", ordenadas[ordenadas.length - 1]?.fecha?.toString() ?? ""],
    [],
    ["Registros por Área", "Cantidad"],
    ...Object.entries(porArea).sort((a, b) => b[1] - a[1]),
    [],
    ["Top 5 Empleados", "Registros"],
    ...Object.entries(porEmpleado).sort((a, b) => b[1] - a[1]).slice(0, 5),
  ]);
  resumen.columns = [{ width: 30 }, { width: 30 }];

  // ── Hoja 2: detalle ───────────────────────────────────────────────────────
  const detalle = workbook.addWorksheet("Detalle Registros");
  detalle.addTable({
    name: "DetalleTable",
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: { theme: "TableStyleMedium4", showRowStripes: true },
    columns: [
      { name: "Fecha", filterButton: true },
      { name: "ID Empleado", filterButton: true },
      { name: "Nombre", filterButton: true },
      { name: "Área", filterButton: true },
      { name: "Entrada", filterButton: true },
      { name: "Salida", filterButton: true },
      { name: "Horas Trabajadas", filterButton: true },
      { name: "Horas Extra", filterButton: true },
    ],
    rows: datos.map((r) => {
      // "sin marcaje" no es una hora: formatearHora lo descarta y queda "—".
      const entrada = formatearHora((r.entrada || "").trim());
      const salida = formatearHora((r.salida || "").trim());
      const extra = horasExtra(salida);
      return [
        r.fecha ? r.fecha.toString() : "",
        r.int_id_empleado,
        r.nombre_empleado,
        r.area,
        entrada || "—",
        salida || "—",
        horasTrabajadas(entrada, salida),
        extra > 0 ? extra : "",
      ];
    }),
  });
  detalle.columns = [
    { width: 14 }, { width: 14 }, { width: 32 }, { width: 24 },
    { width: 12 }, { width: 12 }, { width: 18 }, { width: 14 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName,
  );
  return datos.length;
}
