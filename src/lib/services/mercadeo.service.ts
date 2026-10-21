/**
 * Servicio del módulo de Mercadeo (BI del asistente de farmacia).
 *
 * Sigue el patrón de `hr-admin.service.ts`: funciones sueltas que reciben el token,
 * lanzan `Error` con el mensaje del servidor y no guardan estado. La base es
 * `${API_URL}/api/bi` y cada endpoint vive bajo `/mercadeo/*`.
 *
 * Los tipos de abajo son el CONTRATO con el backend: no los cambien sin coordinar.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const BASE = `${API_URL}/api/bi`;

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

// ─── Parámetros comunes ───────────────────────────────────────────────────────

export interface Periodo {
  desde: string;
  hasta: string;
  excluirAnomalos: boolean;
}

export interface RangoParams {
  desde?: string;
  hasta?: string;
  excluirAnomalos?: boolean;
}

/** Serializa los parámetros de rango a query string (omite los vacíos). */
function query(params?: RangoParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.desde) qs.set("desde", params.desde);
  if (params.hasta) qs.set("hasta", params.hasta);
  if (params.excluirAnomalos !== undefined) qs.set("excluirAnomalos", String(params.excluirAnomalos));
  const texto = qs.toString();
  return texto ? `?${texto}` : "";
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DemandaDTO {
  periodo: Periodo;
  productos: {
    idProducto: number;
    nombre: string;
    categoria: string | null;
    impresiones: number;
    top1: number;
    usuarios: number;
    precioPromedio: number | null;
  }[];
  categorias: { categoria: string; impresiones: number; productos: number }[];
  terminos: { termino: string; veces: number }[];
  intenciones: { intencion: string; mensajes: number }[];
  ciudades: { ciudad: string; departamento: string | null; consultas: number }[];
}

export interface OportunidadesDTO {
  periodo: Periodo;
  noCubierta: { termino: string; veces: number; usuarios: number; pediatrico: number }[];
  catalogoSinDemanda: {
    idProducto: number;
    nombre: string;
    categoria: string | null;
    precio: number | null;
  }[];
  competidores: { marca: string; menciones: number }[];
  segmentos: { pediatrico: number; urgencia: number; premium: number };
  /** Tamaño del catálogo completo, para leer "N sin demanda de M". Lo manda el backend
   *  a propósito: un total escrito a mano en el panel envejece sin que nadie lo note. */
  catalogoTotal: number;
}

export interface ExperienciaDTO {
  periodo: Periodo;
  embudo: { sesiones: number; resultado: number; detalle: number; precio: number; farmacia: number };
  fallo: { mensajes: number; fallidos: number; pct: number };
  ux: { categoria: string; sesiones: number; scorePromedio: number }[];
  turnos: { turnos: number; sesiones: number }[];
  cadenas: { cadena: string; impresiones: number }[];
}

export interface OperacionDTO {
  periodo: Periodo;
  volumen: { mensajes: number; sesiones: number; usuarios: number; diasConDatos: number };
  costo: {
    totalUsd: number;
    porMensaje: number;
    porModelo: { modelo: string; mensajes: number; usd: number }[];
  };
  latencia: { mediaMs: number; p50Ms: number; p95Ms: number };
  respaldo: { mensajes: number; pct: number };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /api/bi/mercadeo/demanda — qué busca y pide la gente. */
export async function fetchDemanda(token: string, params?: RangoParams): Promise<DemandaDTO> {
  return pedir<DemandaDTO>(
    `/mercadeo/demanda${query(params)}`,
    token,
    { method: "GET" },
    "No se pudo cargar la demanda",
  );
}

/** GET /api/bi/mercadeo/oportunidades — demanda no cubierta, catálogo muerto, competidores. */
export async function fetchOportunidades(token: string, params?: RangoParams): Promise<OportunidadesDTO> {
  return pedir<OportunidadesDTO>(
    `/mercadeo/oportunidades${query(params)}`,
    token,
    { method: "GET" },
    "No se pudieron cargar las oportunidades",
  );
}

/** GET /api/bi/mercadeo/experiencia — embudo, tasa de fallo, UX por categoría. */
export async function fetchExperiencia(token: string, params?: RangoParams): Promise<ExperienciaDTO> {
  return pedir<ExperienciaDTO>(
    `/mercadeo/experiencia${query(params)}`,
    token,
    { method: "GET" },
    "No se pudo cargar la experiencia",
  );
}

/** GET /api/bi/mercadeo/operacion — volumen, costo, latencia, uso de respaldo. */
export async function fetchOperacion(token: string, params?: RangoParams): Promise<OperacionDTO> {
  return pedir<OperacionDTO>(
    `/mercadeo/operacion${query(params)}`,
    token,
    { method: "GET" },
    "No se pudo cargar la operación",
  );
}
