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

// --- Endpoints de Maestros ---

export async function getEmpleadosProduccion(): Promise<ProduccionEmpleado[]> {
  try {
    const res = await fetch(`${API_URL}/api/empleados/produccion`);
    if (!res.ok) throw new Error("Error fetching empleados");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    // Mock temporal mientras se crea el endpoint
    return [
      { int_id_empleado: 1, nombre_completo: "Juan Perez" },
      { int_id_empleado: 2, nombre_completo: "Maria Gomez" },
      { int_id_empleado: 3, nombre_completo: "Carlos Lopez" },
    ];
  }
}

export async function getProductos(): Promise<ProductoBasico[]> {
  try {
    const res = await fetch(`${API_URL}/api/productos`);
    if (!res.ok) throw new Error("Error fetching productos");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    // Mock
    return [
      { int_id_producto: 101, txt_nombre: "Acetaminofen 500mg", area_default: "Sólidos" },
      { int_id_producto: 102, txt_nombre: "Ibuprofeno 400mg", area_default: "Sólidos" },
      { int_id_producto: 103, txt_nombre: "Jarabe Tos 120ml", area_default: "Líquidos" },
      { int_id_producto: 104, txt_nombre: "Crema Cicatrizante", area_default: "Semisólidos" },
    ];
  }
}

// --- Endpoints CRUD Control ---

export async function getControlesTiempos(): Promise<ProduccionControl[]> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/controles`);
    if (!res.ok) throw new Error("Error fetching controles");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    // Mock data for testing history and excel exports
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 1); // Yesterday

    return [
      {
        id: "mock-ctrl-0",
        fecha: new Date(baseDate.getTime() - 86400000).toISOString(),
        proceso: "Operaciones",
        area: "Líquidos",
        n_lote: "LT-8888",
        op: "OP-300",
        fk_producto: 103,
        producto_nombre: "Jarabe Tos 120ml",
        observaciones: "Todo correcto",
        estado: "REVISADO",
        registrado_por: 1,
        registrado_por_nombre: "Admin Sistema",
        revisado_por: 2,
        revisado_por_nombre: "Jefe Manufactura",
        aprobado_por: null,
        aprobado_por_nombre: null,
        total_horas: 1.0,
        actividades: [
          {
            id: "act-0",
            categoria: "General",
            actividad_nombre: "Limpiar Area",
            fk_operario: 2,
            operario_nombre: "Maria Gomez",
            intervalos: [
              {
                id: "int-0",
                hora_inicio: new Date(baseDate.getTime() - 86400000).toISOString(),
                hora_fin: new Date(baseDate.getTime() - 86400000 + 3600000).toISOString()
              }
            ]
          }
        ]
      },
      {
        id: "mock-ctrl-1",
        fecha: baseDate.toISOString(),
        proceso: "Operaciones",
        area: "Líquidos",
        n_lote: "LT-9901",
        op: "OP-450",
        fk_producto: 103,
        producto_nombre: "Jarabe Tos 120ml",
        observaciones: "Producción completada sin novedades importantes.",
        estado: "FINALIZADO",
        registrado_por: 1,
        registrado_por_nombre: "Admin Sistema",
        revisado_por: null,
        revisado_por_nombre: null,
        aprobado_por: null,
        aprobado_por_nombre: null,
        total_horas: 3.5,
        actividades: [
          {
            id: "act-1",
            categoria: "General",
            actividad_nombre: "Lavar Frascos",
            fk_operario: 2,
            operario_nombre: "Maria Gomez",
            intervalos: [
              {
                id: "int-1",
                hora_inicio: new Date(baseDate.getTime() + 1000 * 60 * 60 * 8).toISOString(), // 08:00
                hora_fin: new Date(baseDate.getTime() + 1000 * 60 * 60 * 9.5).toISOString()   // 09:30 (1.5h)
              }
            ]
          },
          {
            id: "act-2",
            categoria: "General",
            actividad_nombre: "Envasar",
            fk_operario: 3,
            operario_nombre: "Carlos Lopez",
            intervalos: [
              {
                id: "int-2",
                hora_inicio: new Date(baseDate.getTime() + 1000 * 60 * 60 * 10).toISOString(), // 10:00
                hora_fin: new Date(baseDate.getTime() + 1000 * 60 * 60 * 11).toISOString()     // 11:00 (1.0h)
              },
              {
                id: "int-3",
                hora_inicio: new Date(baseDate.getTime() + 1000 * 60 * 60 * 11.5).toISOString(), // 11:30
                hora_fin: new Date(baseDate.getTime() + 1000 * 60 * 60 * 12.5).toISOString()     // 12:30 (1.0h)
              }
            ]
          }
        ]
      },
      {
        id: "mock-ctrl-2",
        fecha: new Date().toISOString(),
        proceso: "Operaciones",
        area: "Sólidos",
        n_lote: "LT-5544",
        op: "OP-112",
        fk_producto: 101,
        producto_nombre: "Acetaminofen 500mg",
        observaciones: null,
        estado: "EN_PROGRESO",
        registrado_por: 1,
        registrado_por_nombre: "Admin Sistema",
        revisado_por: null,
        revisado_por_nombre: null,
        aprobado_por: null,
        aprobado_por_nombre: null,
        total_horas: 0,
        actividades: [
          {
            id: "act-3",
            categoria: "General",
            actividad_nombre: "Fabricar",
            fk_operario: 1,
            operario_nombre: "Juan Perez",
            intervalos: [
              {
                id: "int-4",
                hora_inicio: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // Hace 45 min
                hora_fin: null // En progreso
              }
            ]
          }
        ]
      }
    ];
  }
}

export async function getControlTiemposById(id: string): Promise<ProduccionControl | null> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/controles/${id}`);
    if (!res.ok) throw new Error("Error fetching control detail");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return null;
  }
}

export async function createControlTiempos(data: {
  proceso: string;
  area: string;
  n_lote: string;
  op: string;
  fk_producto: number;
  registrado_por: number;
}): Promise<ProduccionControl> {
  // Simulacion si falla el backend
  try {
    const res = await fetch(`${API_URL}/api/produccion/controles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error creating control");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    // Return mock
    return {
      id: "mock-" + Date.now(),
      fecha: new Date().toISOString(),
      proceso: data.proceso,
      area: data.area,
      n_lote: data.n_lote,
      op: data.op,
      fk_producto: data.fk_producto,
      producto_nombre: "Producto Sel",
      observaciones: null,
      estado: "EN_PROGRESO",
      registrado_por: data.registrado_por,
      registrado_por_nombre: "Usuario Actual",
      revisado_por: null,
      revisado_por_nombre: null,
      aprobado_por: null,
      aprobado_por_nombre: null,
      actividades: [],
      total_horas: 0
    };
  }
}

export async function updateControlTiempos(id: string, observaciones: string, estado?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/controles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observaciones, estado }),
    });
    return res.ok;
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return true; // mock success
  }
}

export async function marcarComoRevisado(id: string, fk_usuario: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/controles/${id}/revisar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fk_usuario }),
    });
    return res.ok;
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return true; // mock success
  }
}

export async function marcarComoAprobado(id: string, fk_usuario: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/controles/${id}/aprobar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fk_usuario }),
    });
    return res.ok;
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return true; // mock success
  }
}

export async function getRevisionesPendientes(): Promise<ProduccionControl[]> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/controles/revisiones`);
    if (!res.ok) throw new Error("Error fetching revisiones");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    // Mock logic: fetch all and filter FINALIZADO or REVISADO
    const all = await getControlesTiempos();
    return all.filter(c => c.estado === "FINALIZADO" || c.estado === "REVISADO");
  }
}

// --- Endpoints Actividades e Intervalos ---

export async function addActividad(data: {
  fk_control: string;
  categoria: string;
  actividad_nombre: string;
  fk_operario: number;
  operario_nombre: string;
}): Promise<ProduccionActividad> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/actividades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error adding actividad");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return {
      id: "act-" + Date.now(),
      categoria: data.categoria,
      actividad_nombre: data.actividad_nombre,
      operario_nombre: data.operario_nombre,
      fk_operario: data.fk_operario,
      intervalos: []
    };
  }
}

export async function iniciarIntervalo(fk_actividad: string): Promise<ProduccionIntervalo> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/intervalos/iniciar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fk_actividad }),
    });
    if (!res.ok) throw new Error("Error starting interval");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return {
      id: "int-" + Date.now(),
      hora_inicio: new Date().toISOString(),
      hora_fin: null
    };
  }
}

export async function terminarIntervalo(id_intervalo: string): Promise<ProduccionIntervalo> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/intervalos/${id_intervalo}/terminar`, {
      method: "PUT"
    });
    if (!res.ok) throw new Error("Error finishing interval");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return {
      id: id_intervalo,
      hora_inicio: new Date(Date.now() - 3600000).toISOString(),
      hora_fin: new Date().toISOString()
    };
  }
}

export async function deleteActividad(id_actividad: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/actividades/${id_actividad}`, {
      method: "DELETE"
    });
    return res.ok;
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return true; // mock success
  }
}

export async function deleteIntervalo(id_intervalo: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/intervalos/${id_intervalo}`, {
      method: "DELETE"
    });
    return res.ok;
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    return true; // mock success
  }
}

// --- Tablero de Ocupación ---

export async function getOcupacionGlobal(): Promise<OcupacionGlobal[]> {
  try {
    const res = await fetch(`${API_URL}/api/produccion/ocupacion-global`);
    if (!res.ok) throw new Error("Error fetching ocupacion");
    return res.json();
  } catch (error) {
    console.warn("API falló, usando datos simulados...");
    // Mock temporal para el tablero
    return [
      {
        area: "Líquidos",
        operarios: [
          {
            operario_nombre: "Juan Perez",
            actividad_nombre: "Lavar frascos",
            hora_inicio: new Date(Date.now() - 1500000).toISOString(),
            proceso: "Operaciones",
            producto_nombre: "Jarabe Tos 120ml",
            n_lote: "LT-204"
          }
        ]
      },
      {
        area: "Sólidos",
        operarios: [
          {
            operario_nombre: "Maria Gomez",
            actividad_nombre: "Codificar",
            hora_inicio: new Date(Date.now() - 500000).toISOString(),
            proceso: "Operaciones",
            producto_nombre: "Acetaminofen 500mg",
            n_lote: "LT-899"
          }
        ]
      },
      {
        area: "Semisólidos",
        operarios: []
      }
    ];
  }
}
