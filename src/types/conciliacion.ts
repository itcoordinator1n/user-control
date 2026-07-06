/**
 * conciliacion.ts — Tipos del módulo Control de Equipos + Conciliación.
 * Los nombres de campo reflejan EXACTAMENTE las columnas que devuelve el
 * backend Express (prefijo /api/equipos). Convención: txt_/int_/bln_/dec_/dte_.
 */

// ─── Enums (valores reales de la BD) ─────────────────────────────────────────
export type EstadoBusqueda =
  | 'pendiente' | 'encontrado' | 'no_encontrado' | 'descartado' | 'baja_confirmada';
export type AccionContable = 'dar_de_baja' | 'inventariar' | 'ninguna';
export type EstadoContable = 'depreciado' | 'por_depreciar' | 'desconocido';
export type TipoActivo =
  | 'computadora' | 'laptop' | 'servidor' | 'monitor' | 'impresora' | 'proyector'
  | 'ups' | 'red' | 'almacenamiento' | 'tv' | 'camara' | 'mac' | 'otro';
export type MatchTipo = 'automatico' | 'manual' | 'etiqueta' | 'ninguno';
export type MatchConfianza = 'alta' | 'media' | 'baja';
export type EstadoRegistro = 'nuevo' | 'notificado' | 'registrado';
export type EstadoEquipo = 'activo' | 'baja' | string;

/** Origen de la serie derivado en el cliente (no viene del backend). */
export type SerieOrigen = 'columna' | 'extraida' | 'sin_serie';

// ─── Resumen (P1) ────────────────────────────────────────────────────────────
export interface ResumenConciliacion {
  total_activos: number;
  conciliado: number;
  en_libros_no_encontrado: number; // candidatos a baja (auto-auditables)
  nuevo_no_en_libros: number;      // candidatos a registrar
  revision_manual: number;
}

export interface ResumenPorCeco {
  txt_ce_coste: string | null;
  txt_denominacion_ceco: string | null;
  total: number;
  conciliado: number;
  baja: number;
  baja_confirmada: number;
  valor_en_libros: number | null;
}

export interface ResumenPorAccion {
  txt_accion_contable: AccionContable | null;
  total: number;
  conciliado: number;
}

// ─── Activo contable (P2 lista / P3 detalle) ─────────────────────────────────
export interface ActivoContable {
  id_activo_contable: number;
  txt_act_fijo: string;
  txt_denominacion_activo: string | null;
  txt_tipo_activo: TipoActivo;
  txt_serie_original: string | null;
  txt_serie_match: string | null;
  bln_auto_auditable: 0 | 1;
  txt_estado_contable: EstadoContable;
  txt_accion_contable: AccionContable;
  txt_estado_busqueda: EstadoBusqueda;
  int_fk_equipo: number | null;
  txt_match_tipo: MatchTipo;
  txt_match_confianza: MatchConfianza | null;
  txt_ce_coste: string | null;
  txt_denominacion_ceco: string | null;
  txt_responsable_nombre: string | null;
  dec_valor_en_libros: number | null;
  dte_conciliado: string | null;
  // Columnas que HOY no vienen en los SELECT (follow-up backend Fase A):
  txt_estado_ti?: string | null;
  txt_area_it?: string | null;
  txt_serie_extraida?: string | null;
  txt_notas_conciliacion?: string | null;
}

export interface ConciliacionMatch {
  id_match: number;
  int_fk_equipo: number;
  txt_tipo_match: MatchTipo;
  txt_confianza: MatchConfianza | null;
  int_fk_empleado_usuario: number | null;
  dte_match: string;
  txt_nota: string | null;
  bln_vigente: 0 | 1;
}

export interface ActivoDetalle {
  activo: ActivoContable;
  equipo: Equipo | null;
  historial: ConciliacionMatch[];
}

// ─── Equipo físico (inventario) ──────────────────────────────────────────────
export interface Equipo {
  id_equipo: number;
  txt_huella: string;
  txt_numero_serie: string | null;
  txt_serie_norm: string | null;
  txt_asset_tag: string | null;
  txt_fabricante: string | null;
  txt_modelo: string | null;
  txt_tipo_chasis: string | null;
  txt_nombre_equipo: string | null;
  txt_estado: EstadoEquipo;
  txt_estado_registro: EstadoRegistro;
  txt_act_fijo_asignado: string | null;
  int_fk_empleado: number | null;
  int_fk_area: number | null;
  int_fk_ultima_captura: number | null;
  dte_alta: string | null;
  dte_actualizacion: string | null;
  // JOINs opcionales (list/detalle):
  empleado_nombre?: string | null;
  area_nombre?: string | null;
}

export interface Captura {
  id_captura: number;
  dte_captura: string;
  txt_tecnico: string | null;
  txt_metodo: string | null;
  txt_agente_version: string | null;
  txt_so_nombre: string | null;
  txt_so_version?: string | null;
  txt_so_build?: string | null;
  txt_so_arquitectura?: string | null;
  txt_cpu_nombre: string | null;
  int_cpu_nucleos?: number | null;
  int_cpu_hilos?: number | null;
  int_ram_total_mb: number | null;
  txt_bios_version?: string | null;
  txt_placa_base?: string | null;
  txt_usuario_windows?: string | null;
  txt_antivirus?: string | null;
  bln_antivirus_activo?: 0 | 1;
  txt_win_licencia?: string | null;
  txt_bitlocker?: string | null;
  txt_tpm_version?: string | null;
  json_campos_faltantes?: unknown;
}

export interface EquipoDetalleComponentes {
  memoria?: Array<Record<string, unknown>>;
  discos?: Array<Record<string, unknown>>;
  red?: Array<Record<string, unknown>>;
  gpu?: Array<Record<string, unknown>>;
  monitores?: Array<Record<string, unknown>>;
  software?: Array<Record<string, unknown>>;
}

export interface EquipoDetalle {
  equipo: Equipo;
  captura: Captura | null;
  detalle: EquipoDetalleComponentes;
}

// ─── Vistas de conciliación ──────────────────────────────────────────────────
export interface CandidatoBaja {
  txt_act_fijo: string;
  txt_denominacion_activo: string | null;
  txt_tipo_activo: TipoActivo;
  txt_serie_original: string | null;
  txt_serie_match: string | null;
  txt_accion_contable: AccionContable;
  txt_estado_contable: EstadoContable;
  dec_valor_en_libros: number | null;
  txt_ce_coste: string | null;
  txt_denominacion_ceco: string | null;
  txt_responsable_nombre: string | null;
  txt_estado_busqueda: EstadoBusqueda;
  dte_conciliado: string | null;
  int_conciliado_por: number | null;
  txt_motivo: string;
}

export interface PorRegistrar {
  id_equipo: number;
  txt_numero_serie: string | null;
  txt_serie_norm: string | null;
  txt_fabricante: string | null;
  txt_modelo: string | null;
  txt_tipo_chasis: string | null;
  txt_nombre_equipo: string | null;
  int_fk_empleado: number | null;
  int_fk_area: number | null;
  txt_estado: EstadoEquipo;
  txt_estado_registro: EstadoRegistro;
  txt_act_fijo_asignado: string | null;
  dte_alta: string | null;
  txt_denominacion_sugerida: string | null;
}

export interface Conciliado {
  txt_act_fijo: string;
  txt_denominacion_activo: string | null;
  txt_tipo_activo: TipoActivo;
  txt_serie_match: string | null;
  txt_accion_contable: AccionContable;
  dec_valor_en_libros: number | null;
  txt_ce_coste: string | null;
  txt_denominacion_ceco: string | null;
  int_fk_equipo: number;
  txt_numero_serie: string | null;
  txt_nombre_equipo: string | null;
  txt_estado_equipo: EstadoEquipo;
  txt_match_tipo: MatchTipo;
  txt_match_confianza: MatchConfianza | null;
  txt_estado_ti: string | null;
  txt_responsable_nombre: string | null;
  txt_area_it: string | null;
}

export interface RevisionManual {
  txt_act_fijo: string;
  txt_denominacion_activo: string | null;
  txt_tipo_activo: TipoActivo;
  txt_serie_original: string | null;
  txt_serie_match: string | null;
  txt_accion_contable: AccionContable;
  dec_valor_en_libros: number | null;
  txt_ce_coste: string | null;
  txt_denominacion_ceco: string | null;
}

export interface Ambiguo {
  id_activo_contable: number;
  txt_act_fijo: string;
  txt_serie_match: string | null;
  equipos_coincidentes: number;
}

// ─── Filtros / payloads ──────────────────────────────────────────────────────
export interface ActivosFiltros {
  q?: string;
  estado?: EstadoBusqueda | '';
  tipo?: TipoActivo | '';
  ceco?: string;
  autoAuditable?: boolean;
  limite?: number;
  offset?: number;
}

export interface MatchPayload {
  idEquipo: number;
  matchTipo?: MatchTipo;
  matchConfianza?: MatchConfianza | null;
  nota?: string | null;
}

export interface PatchActivoPayload {
  txt_notas_conciliacion?: string | null;
  txt_tipo_activo?: TipoActivo;
  txt_accion_contable?: AccionContable;
  txt_estado_ti?: string | null;
}

// ─── Resultados de mutaciones ────────────────────────────────────────────────
export interface MatchResult { ok: boolean; id_match: number; }
export interface OkResult { ok: boolean; }
export interface AutoMatchResult {
  candidatos: number;
  enlazados: number;
  omitidos_placeholder: number;
  errores: number;
}
export interface ImportResult {
  loteId: number;
  insertados: number;
  actualizados: number;
  sinCambio: number;
}

// ─── Import (P7) ─────────────────────────────────────────────────────────────
/** Fila lista para POST /conciliacion/import (columnas txt_/dec_/dte_ de SAP). */
export type ImportRow = Record<string, string | number | null>;

export interface ImportMeta {
  txt_archivo?: string | null;
  int_filas_serie_ok?: number;
  int_filas_serie_0?: number;
  int_filas_dup?: number;
  json_reporte?: ImportReporte | null;
  txt_creado_por?: string | null;
}

export interface ImportReporte {
  filas_total: number;
  act_fijo_duplicados: number;
  con_serie: number;
  serie_0_o_vacia: number;
  rescatadas_del_texto: number;
  series_duplicadas_grupos: number;
  auto_auditables: number;
  no_auto_auditables: number;
  por_tipo: Record<string, number>;
}

export interface ImportParseResult {
  rows: ImportRow[];
  meta: ImportMeta;
  reporte: ImportReporte;
  /** Mapeo detectado: encabezado original -> campo destino (o null si se ignora). */
  mapeo: Array<{ header: string; dest: string | null }>;
  delimiter?: string;
  dupSeries: Array<[string, number]>;
}
