export interface ProduccionEmpleado {
  int_id_empleado: number;
  nombre_completo: string;
}

export interface ProductoBasico {
  int_id_producto: number;
  txt_nombre: string;
  area_default?: string; // Ej: "Líquidos", "Sólidos", "Semisólidos"
}

export interface ProduccionIntervalo {
  id: string;
  hora_inicio: string;
  hora_fin: string | null;
}

export interface ProduccionActividad {
  id: string;
  categoria: string;
  actividad_nombre: string;
  operario_nombre: string;
  fk_operario: number;
  intervalos: ProduccionIntervalo[];
}

export interface ProduccionControl {
  id: string;
  fecha: string;
  proceso: string;
  area: string;
  n_lote: string;
  op: string;
  fk_producto: number;
  producto_nombre: string;
  observaciones: string | null;
  estado: "EN_PROGRESO" | "FINALIZADO" | "REVISADO" | "APROBADO";
  registrado_por: number;
  registrado_por_nombre: string;
  revisado_por: number | null;
  revisado_por_nombre: string | null;
  aprobado_por: number | null;
  aprobado_por_nombre: string | null;
  actividades: ProduccionActividad[];
  total_horas: number;
}

export interface OcupacionOperario {
  operario_nombre: string;
  actividad_nombre: string;
  hora_inicio: string;
  proceso: string;
  producto_nombre: string;
  n_lote: string;
}

export interface OcupacionGlobal {
  area: string;
  operarios: OcupacionOperario[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const getHeaders = (token?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// --- Endpoints de Maestros ---

export async function getEmpleadosProduccion(token?: string): Promise<ProduccionEmpleado[]> {
  const res = await fetch(`${API_URL}/api/empleados/produccion`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching empleados" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function getProductos(token?: string): Promise<ProductoBasico[]> {
  const res = await fetch(`${API_URL}/api/productos`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching productos" + ": " + res.status + " " + txt); }
  return res.json();
}

// --- Endpoints CRUD Control ---

export async function getControlesTiempos(token?: string): Promise<ProduccionControl[]> {
  const res = await fetch(`${API_URL}/api/produccion/controles`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching controles" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function getControlTiemposById(id: string, token?: string): Promise<ProduccionControl | null> {
  const res = await fetch(`${API_URL}/api/produccion/controles/${id}`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching control detail" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function createControlTiempos(data: {
  proceso: string;
  area: string;
  n_lote: string;
  op: string;
  fk_producto: number;
  registrado_por: number;
}, token?: string): Promise<ProduccionControl> {
  const res = await fetch(`${API_URL}/api/produccion/controles`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error creating control" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function updateControlTiempos(id: string, observaciones: string, estado?: string, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/produccion/controles/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ observaciones, estado }),
  });
  return res.ok;
}

export async function marcarComoRevisado(id: string, fk_usuario: number, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/produccion/controles/${id}/revisar`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ fk_usuario }),
  });
  return res.ok;
}

export async function marcarComoAprobado(id: string, fk_usuario: number, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/produccion/controles/${id}/aprobar`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ fk_usuario }),
  });
  return res.ok;
}

export async function getRevisionesPendientes(token?: string): Promise<ProduccionControl[]> {
  const res = await fetch(`${API_URL}/api/produccion/controles/revisiones`, { headers: getHeaders(token) });
  if (!res.ok) {
    // Si falla el endpoint (porque aún no lo suben) tratar de filtrar de getAll
    console.warn("Endpoint revisiones falló, intentando filtro local...");
    const all = await getControlesTiempos(token);
    return all.filter(c => c.estado === "FINALIZADO" || c.estado === "REVISADO");
  }
  return res.json();
}

// --- Endpoints Actividades e Intervalos ---

export async function addActividad(data: {
  fk_control: string;
  categoria: string;
  actividad_nombre: string;
  fk_operario: number;
  operario_nombre: string;
}, token?: string): Promise<ProduccionActividad> {
  const res = await fetch(`${API_URL}/api/produccion/actividades`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error adding actividad" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function iniciarIntervalo(fk_actividad: string, token?: string): Promise<ProduccionIntervalo> {
  const res = await fetch(`${API_URL}/api/produccion/intervalos/iniciar`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ fk_actividad }),
  });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error starting interval" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function terminarIntervalo(id_intervalo: string, token?: string): Promise<ProduccionIntervalo> {
  const res = await fetch(`${API_URL}/api/produccion/intervalos/${id_intervalo}/terminar`, {
    method: "PUT",
    headers: getHeaders(token),
  });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error finishing interval" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function deleteActividad(id_actividad: string, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/produccion/actividades/${id_actividad}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return res.ok;
}

export async function deleteIntervalo(id_intervalo: string, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/produccion/intervalos/${id_intervalo}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return res.ok;
}

// --- Tablero de Ocupación ---

export async function getOcupacionGlobal(token?: string): Promise<OcupacionGlobal[]> {
  const res = await fetch(`${API_URL}/api/produccion/ocupacion-global`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching ocupacion" + ": " + res.status + " " + txt); }
  return res.json();
}
