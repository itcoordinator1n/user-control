export interface ProduccionEmpleado {
  int_id_empleado: number;
  nombre_completo: string;
}

export interface ProductoBasico {
  int_id_producto: number;
  txt_nombre: string;
  area_default?: string; // Ej: "Líquidos", "Sólidos", "Semisólidos"
}

export interface ProduccionArea {
  id: number;
  nombre: string;
}

export interface ProduccionGrupo {
  id: number;
  nombre: string;
}

export interface ActividadCatalogo {
  id: number;
  nombre: string;
  fk_grupo: number;
}

export type MotivoPausa = "TRABAJO_TERMINADO" | "INTERRUPCION" | "PAUSA";

export interface ProduccionInterrupcion {
  id: string;
  fk_intervalo: string;
  motivo: string;
  hora_inicio: string;
  hora_fin: string | null;
}

export interface ProduccionIntervalo {
  id: string;
  hora_inicio: string;
  hora_fin: string | null;
  motivo_pausa?: MotivoPausa | null;
  observaciones?: string | null;
  interrupciones?: ProduccionInterrupcion[];
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

export async function getAreas(token?: string): Promise<ProduccionArea[]> {
  const res = await fetch(`${API_URL}/api/areas`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching areas" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function getAreasByProducto(productoId: number, token?: string): Promise<ProduccionArea[]> {
  const res = await fetch(`${API_URL}/api/areas/producto/${productoId}`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching product areas" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function getGruposPorArea(idArea: number, token?: string): Promise<ProduccionGrupo[]> {
  const res = await fetch(`${API_URL}/api/produccion/grupos/area/${idArea}`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching grupos" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function getActividadesPorGrupo(idGrupo: number, token?: string): Promise<ActividadCatalogo[]> {
  const res = await fetch(`${API_URL}/api/produccion/actividades-catalogo/grupo/${idGrupo}`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error fetching actividades" + ": " + res.status + " " + txt); }
  return res.json();
}

// --- Endpoints CRUD Catálogo ---

export async function getTodosLosGrupos(token?: string) {
  const res = await fetch(`${API_URL}/api/produccion/grupos`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error fetching todos los grupos: " + txt); }
  return res.json();
}

export async function createGrupo(nombre: string, token?: string) {
  const res = await fetch(`${API_URL}/api/produccion/grupos`, { method: "POST", headers: getHeaders(token), body: JSON.stringify({ nombre }) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error creating grupo: " + txt); }
  return res.json();
}

export async function updateGrupo(id: number, nombre: string, token?: string) {
  const res = await fetch(`${API_URL}/api/produccion/grupos/${id}`, { method: "PUT", headers: getHeaders(token), body: JSON.stringify({ nombre }) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error updating grupo: " + txt); }
  return res.json();
}

export async function deleteGrupo(id: number, token?: string) {
  const res = await fetch(`${API_URL}/api/produccion/grupos/${id}`, { method: "DELETE", headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error deleting grupo: " + txt); }
  return res.json();
}

export async function getTodasLasActividades(token?: string, fk_producto?: number) {
  const url = fk_producto 
    ? `${API_URL}/api/produccion/actividades-catalogo?fk_producto=${fk_producto}` 
    : `${API_URL}/api/produccion/actividades-catalogo`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error fetching actividades: " + txt); }
  return res.json();
}

export async function createActividadCatalogo(data: { nombre: string, fk_grupo: number }, token?: string) {
  const res = await fetch(`${API_URL}/api/produccion/actividades-catalogo`, { method: "POST", headers: getHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error creating actividad: " + txt); }
  return res.json();
}

export async function updateActividadCatalogo(id: number, data: { nombre?: string, fk_grupo?: number }, token?: string) {
  const res = await fetch(`${API_URL}/api/produccion/actividades-catalogo/${id}`, { method: "PUT", headers: getHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error updating actividad: " + txt); }
  return res.json();
}

export async function deleteActividadCatalogo(id: number, token?: string) {
  const res = await fetch(`${API_URL}/api/produccion/actividades-catalogo/${id}`, { method: "DELETE", headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error deleting actividad: " + txt); }
  return res.json();
}

export async function getProductosDeActividad(id: number, token?: string): Promise<number[]> {
  const res = await fetch(`${API_URL}/api/produccion/actividades-catalogo/${id}/productos`, { headers: getHeaders(token) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error fetching productos de actividad: " + txt); }
  return res.json();
}

export async function updateProductosDeActividad(id: number, productIds: number[], token?: string) {
  const res = await fetch(`${API_URL}/api/produccion/actividades-catalogo/${id}/productos`, { method: "PUT", headers: getHeaders(token), body: JSON.stringify({ productIds }) });
  if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error("Error updating productos de actividad: " + txt); }
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

// El backend toma el usuario del JWT (req.user.idEmployee), NO del body, y
// responde con el ProduccionControl ya actualizado. Devolvemos ese objeto para
// no reconstruir el estado a mano en la UI.
async function transicionEstado(
  id: string,
  accion: "revisar",
  token?: string
): Promise<ProduccionControl> {
  const res = await fetch(`${API_URL}/api/produccion/controles/${id}/${accion}`, {
    method: "PUT",
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    let msg = txt;
    try { msg = JSON.parse(txt)?.error ?? txt; } catch { /* respuesta no JSON */ }
    console.error("API ERROR", res.status, txt);
    // 422 = transición de estado inválida; el mensaje del backend es accionable
    throw new Error(msg || `Error al ${accion} el control (${res.status})`);
  }
  return res.json();
}

export async function marcarComoRevisado(id: string, token?: string): Promise<ProduccionControl> {
  return transicionEstado(id, "revisar", token);
}

/**
 * Devuelve el control al encargado para corrección.
 *
 * TODO: quitar el fallback cuando el backend exponga PUT /controles/:id/rechazar
 * (debe persistir rechazado_por + motivo_rechazo). Mientras tanto usamos
 * PUT /controles/:id, que acepta EN_PROGRESO en VALID_ESTADOS.
 */
export async function rechazarControl(
  id: string,
  motivo: string,
  token?: string
): Promise<ProduccionControl> {
  const res = await fetch(`${API_URL}/api/produccion/controles/${id}/rechazar`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ motivo }),
  });
  if (res.ok) return res.json();

  if (res.status !== 404) {
    const txt = await res.text().catch(() => "");
    let msg = txt;
    try { msg = JSON.parse(txt)?.error ?? txt; } catch { /* respuesta no JSON */ }
    throw new Error(msg || `Error al rechazar el control (${res.status})`);
  }

  // Fallback: el endpoint dedicado aún no existe
  const fb = await fetch(`${API_URL}/api/produccion/controles/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ estado: "EN_PROGRESO", observaciones: `DEVUELTO: ${motivo}` }),
  });
  if (!fb.ok) {
    const txt = await fb.text().catch(() => "");
    throw new Error("Error al devolver el control a corrección: " + txt);
  }
  return fb.json();
}

export interface ResumenEmailResult {
  enviados: string[];
  rechazados?: string[];
  advertencia?: string;
}

/**
 * Envía SOLO el resumen por grupo del control (el mismo bloque del Excel
 * final) a quienes pueden firmarlo. Los destinatarios los resuelve el backend
 * por permiso (PROD:VALIDATE), así que se configuran desde
 * Admin → Roles sin tocar código.
 *
 * No debe tumbar el cierre del registro: quien llama captura el error.
 */
export async function enviarResumenControl(
  id: string,
  urlDetalle?: string,
  token?: string
): Promise<ResumenEmailResult> {
  const res = await fetch(`${API_URL}/api/produccion/controles/${id}/resumen-email`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ urlDetalle }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error("Error enviando el resumen por correo: " + txt);
  }
  return res.json();
}

export async function getRevisionesPendientes(
  token?: string,
  estado?: ProduccionControl["estado"]
): Promise<ProduccionControl[]> {
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  const res = await fetch(`${API_URL}/api/produccion/controles/revisiones${qs}`, { headers: getHeaders(token) });
  if (!res.ok) {
    // Si falla el endpoint (porque aún no lo suben) tratar de filtrar de getAll
    console.warn("Endpoint revisiones falló, intentando filtro local...");
    const all = await getControlesTiempos(token);
    return all.filter(c => estado ? c.estado === estado : (c.estado === "FINALIZADO" || c.estado === "REVISADO"));
  }
  const data: ProduccionControl[] = await res.json();
  if (!estado) return data;
  // El backend todavía fija WHERE estado = 'FINALIZADO' e ignora ?estado. Si la
  // respuesta no corresponde a la cola pedida, resolvemos desde el listado
  // completo. Cuando el backend honre ?estado, este fallback deja de dispararse.
  const filtered = data.filter(c => c.estado === estado);
  if (filtered.length || data.every(c => c.estado === estado)) return filtered;
  const all = await getControlesTiempos(token);
  return all.filter(c => c.estado === estado);
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

export async function terminarIntervalo(
  id_intervalo: string,
  options: { motivo_pausa: MotivoPausa; observaciones?: string },
  token?: string
): Promise<ProduccionIntervalo> {
  const res = await fetch(`${API_URL}/api/produccion/intervalos/${id_intervalo}/terminar`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(options),
  });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error finishing interval" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function crearInterrupcion(
  fk_intervalo: string,
  motivo: string,
  token?: string
): Promise<ProduccionInterrupcion> {
  const res = await fetch(`${API_URL}/api/produccion/interrupciones`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ fk_intervalo, motivo }),
  });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error creating interrupcion" + ": " + res.status + " " + txt); }
  return res.json();
}

export async function terminarInterrupcion(
  id_interrupcion: string,
  token?: string
): Promise<ProduccionInterrupcion> {
  const res = await fetch(`${API_URL}/api/produccion/interrupciones/${id_interrupcion}/terminar`, {
    method: "PUT",
    headers: getHeaders(token),
  });
  if (!res.ok) { const txt = await res.text().catch(()=>""); console.error("API ERROR", res.status, txt); throw new Error("Error finishing interrupcion" + ": " + res.status + " " + txt); }
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

export async function deleteControl(id_control: string, token?: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/produccion/controles/${id_control}`, {
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
