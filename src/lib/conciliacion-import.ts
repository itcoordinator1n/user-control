/**
 * conciliacion-import.ts — Parser del archivo contable (export SAP) en el
 * navegador. Porta la lógica verificada de
 * `Control de equipos/backend/import/importar_activos.js`:
 *   - detecta delimitador / lee XLSX (SheetJS)
 *   - mapea encabezados por sinónimos y posición (2ª "Área" → area_2)
 *   - normaliza serie, rescata serial embebido, clasifica tipo_activo
 *   - produce filas con nombres de columna txt_/dec_/dte_ que espera POST /import
 *   - calcula el reporte de calidad (idéntico al del CLI --dry-run)
 */

import * as XLSX from 'xlsx';
import type {
  ImportRow, ImportMeta, ImportReporte, ImportParseResult, TipoActivo,
} from '@/types/conciliacion';

// ─── Parseo delimitado (TSV/CSV con comillas RFC4180) ────────────────────────
function detectDelimiter(sample: string): string {
  const line = sample.split(/\r?\n/)[0] || '';
  const tabs = (line.match(/\t/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  if (tabs >= commas && tabs >= semis) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function parseDelimited(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let field = '', row: string[] = [], inQ = false, fieldStart = true;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"' && fieldStart) { inQ = true; fieldStart = false; }
      else if (c === delim) { row.push(field); field = ''; fieldStart = true; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; fieldStart = true; }
      else if (c === '\r') { /* skip */ }
      else { field += c; fieldStart = false; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => (x || '').trim() !== ''));
}

// ─── Encabezados ─────────────────────────────────────────────────────────────
function normHeader(h: unknown): string {
  return (h ?? '').toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const HEADER_MAP: Record<string, string> = {
  'act fijo': 'act_fijo', 'actfijo': 'act_fijo', 'activo fijo': 'act_fijo',
  'grupo': 'grupo',
  'denominacion grupo': 'denominacion_grupo',
  'fe capit 2': 'capitalizacion', 'fe capit': 'capitalizacion', 'fecha capitalizacion': 'capitalizacion',
  'atiguedad': 'antiguedad', 'antiguedad': 'antiguedad',
  'denominacion del activo fijo': 'denominacion_activo', 'denominacion activo': 'denominacion_activo',
  'descripcion 2': 'descripcion_2',
  'serie': 'serie_original',
  'estadoti': 'estado_ti', 'estado ti': 'estado_ti',
  'responsable': 'responsable_nombre', 'nombre': 'responsable_nombre', 'responsable nombre': 'responsable_nombre',
  'area': 'area_it',
  'estado': 'estado_contable',
  'accion': 'accion_contable', 'acccion': 'accion_contable',
  'nivel i': 'nivel_i',
  'ce coste': 'ce_coste', 'cecoste': 'ce_coste',
  'denominacion ceco': 'denominacion_ceco',
  'valor en libros': 'valor_en_libros',
  'costo real': 'costo_real',
  'depreciacion nor': 'depreciacion',
  'valor en libros noc': 'valor_libros_noc',
  'costo nor usd': 'costo_usd',
  'depreciacion nor usd': 'depreciacion_usd',
  'valor en libros nor usd': 'valor_libros_usd',
  'tipo de cambio': 'tipo_cambio',
  'proveedor': 'proveedor',
  'linea de producto': 'linea_producto',
  'tipo': 'tipo_archivo',
  'vida util': 'vida_util',
  'fecha de sustitucion': 'sustitucion',
  'tipo de compra': 'tipo_compra',
  'estatus nueva planta': 'estatus_nueva_planta',
  'mon': 'moneda',
};

function construirMapeo(headers: unknown[]): (string | null)[] {
  const map: (string | null)[] = [];
  let areaCount = 0;
  headers.forEach((h) => {
    const key = normHeader(h);
    let dest: string | null = HEADER_MAP[key] || null;
    if (dest === 'area_it') { areaCount++; if (areaCount === 2) dest = 'area_2'; }
    map.push(dest);
  });
  return map;
}

// ─── Helpers de valor ────────────────────────────────────────────────────────
function normSerie(s: unknown): string | null {
  if (s == null) return null;
  const t = String(s).trim().toUpperCase().replace(/[\s.\-]/g, '');
  return (t === '' || t === '0') ? null : t;
}

function extraerSerialDeTexto(denom: unknown): string | null {
  if (!denom) return null;
  const s = String(denom);
  const m = s.match(/\bSERIE[:\s]+([A-Z0-9]{5,20})\b/i) || s.match(/\bS[/.]?N[:\s]*([A-Z0-9]{5,20})\b/i);
  return m ? normSerie(m[1]) : null;
}

function parseFechaISO(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  return null;
}

function parseNum(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).replace(/[^0-9.\-]/g, '');
  if (s === '' || s === '-' || s === '.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const ENUM_ESTADO: Record<string, string> = { 'depreciado': 'depreciado', 'por depreciar': 'por_depreciar' };
const ENUM_ACCION: Record<string, string> = { 'dar de baja': 'dar_de_baja', 'inventariar': 'inventariar' };

// ─── Clasificación de tipo_activo ────────────────────────────────────────────
const TIPO_RULES: Array<[TipoActivo, RegExp]> = [
  ['mac', /\b(MACBOOK|IMAC|MAC ?MINI|APPLE|A1466|A1706|A1398)\b/i],
  ['servidor', /\b(SERVER|SERVIDOR|POWEREDGE|PROLIANT|RACK ?SERVER)\b/i],
  ['laptop', /\b(LAPTOP|NOTEBOOK|PORTATIL|LATITUDE|THINKPAD|ELITEBOOK|INSPIRON|ULTRABOOK|PROBOOK)\b/i],
  ['almacenamiento', /\b(STORAGE|HITACHI|NAS|SAN|ALMACENAMIENTO|DF800)\b/i],
  ['red', /\b(SWITCH|ROUTER|FIREWALL|FORTINET|FORTIGATE|ACCESS ?POINT|CATALYST|MIKROTIK|ROUTER ?OS)\b/i],
  ['monitor', /\b(MONITOR|PANTALLA|LCD|LED ?MONITOR)\b/i],
  ['impresora', /\b(IMPRESORA|PRINTER|PLOTTER|MULTIFUNCION|MULTIFUNCIONAL|EVOLIS|MATRICIAL|XEROX|SHARP MX)\b/i],
  ['proyector', /\b(PROYECTOR|PROJECTOR|BEAM)\b/i],
  ['ups', /\b(UPS|BATERIA|REGULADOR|POWER ?MODULE|MODULO DE PODER|EATON)\b/i],
  ['tv', /\b(TELEVISOR|SMART ?TV|\bTV\b)\b/i],
  ['camara', /\b(CAMARA|CAMERA|CCTV|DVR|NVR|SISTEMA DE CAMARAS)\b/i],
  ['computadora', /\b(CPU|DESKTOP|OPTIPLEX|COMPUTADOR|COMPUTADORA|TORRE|WORKSTATION|MINITOWER|SFF|ALL ?IN ?ONE|PC\b)\b/i],
];
function clasificarTipo(...textos: (string | null | undefined)[]): TipoActivo {
  const t = textos.filter(Boolean).join(' ');
  for (const [tipo, re] of TIPO_RULES) if (re.test(t)) return tipo;
  return 'otro';
}

const AUTO_AUDITABLE: TipoActivo[] = ['computadora', 'laptop', 'servidor'];

// ─── Leer archivo → matriz de celdas ─────────────────────────────────────────
async function leerTabla(file: File): Promise<{ table: string[][]; delimiter?: string }> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' });
    const table = rows
      .map((r) => (r as unknown[]).map((c) => (c == null ? '' : String(c))))
      .filter((r) => r.some((x) => x.trim() !== ''));
    return { table };
  }
  const text = await file.text();
  const delimiter = detectDelimiter(text);
  return { table: parseDelimited(text, delimiter), delimiter };
}

// ─── Entrada principal ───────────────────────────────────────────────────────
export async function parseArchivoContable(
  file: File,
  creadoPor?: string,
): Promise<ImportParseResult> {
  const { table, delimiter } = await leerTabla(file);
  if (table.length < 2) throw new Error('El archivo no tiene datos (se esperaban encabezados + filas).');

  const headers = table[0];
  const mapeo = construirMapeo(headers);
  const mapeoDetalle = headers.map((h, i) => ({ header: String(h).trim(), dest: mapeo[i] }));

  // Construir filas intermedias (raw = campos mapeados; derivados aparte)
  interface Fila {
    raw: Record<string, string>;
    serieExtraida: string | null;
    serieMatch: string | null;
    tipoActivo: TipoActivo;
    autoAuditable: boolean;
  }
  const filas: Fila[] = [];
  const seenActFijo = new Set<string>();
  let dupActFijo = 0;

  for (let r = 1; r < table.length; r++) {
    const cols = table[r];
    const raw: Record<string, string> = {};
    mapeo.forEach((dest, i) => { if (dest) raw[dest] = (cols[i] ?? '').trim(); });
    if (!raw.act_fijo) continue;
    if (seenActFijo.has(raw.act_fijo)) { dupActFijo++; continue; }
    seenActFijo.add(raw.act_fijo);

    const serieExtraida = normSerie(raw.serie_original) ? null : extraerSerialDeTexto(raw.denominacion_activo);
    const serieMatch = normSerie(raw.serie_original) || serieExtraida;
    const tipoActivo = clasificarTipo(raw.denominacion_activo, raw.denominacion_grupo, raw.linea_producto);
    filas.push({ raw, serieExtraida, serieMatch, tipoActivo, autoAuditable: AUTO_AUDITABLE.includes(tipoActivo) });
  }

  // Reporte de calidad
  const conSerie = filas.filter((f) => f.serieMatch).length;
  const rescatadas = filas.filter((f) => !normSerie(f.raw.serie_original) && f.serieExtraida).length;
  const serie0 = filas.filter((f) => !f.serieMatch).length;
  const serieCount: Record<string, number> = {};
  filas.forEach((f) => { if (f.serieMatch) serieCount[f.serieMatch] = (serieCount[f.serieMatch] || 0) + 1; });
  const dupSeries = Object.entries(serieCount).filter(([, n]) => n > 1) as Array<[string, number]>;
  const porTipo: Record<string, number> = {};
  filas.forEach((f) => { porTipo[f.tipoActivo] = (porTipo[f.tipoActivo] || 0) + 1; });
  const autoAud = filas.filter((f) => f.autoAuditable).length;

  const reporte: ImportReporte = {
    filas_total: filas.length,
    act_fijo_duplicados: dupActFijo,
    con_serie: conSerie,
    serie_0_o_vacia: serie0,
    rescatadas_del_texto: rescatadas,
    series_duplicadas_grupos: dupSeries.length,
    auto_auditables: autoAud,
    no_auto_auditables: filas.length - autoAud,
    por_tipo: porTipo,
  };

  // Filas para POST /import (nombres de columna txt_/dec_/dte_)
  const rows: ImportRow[] = filas.map(({ raw: f, serieExtraida, tipoActivo }) => ({
    txt_act_fijo: f.act_fijo ?? null,
    txt_grupo: f.grupo || null,
    txt_denominacion_grupo: f.denominacion_grupo || null,
    dte_capitalizacion: parseFechaISO(f.capitalizacion),
    txt_antiguedad: f.antiguedad || null,
    txt_denominacion_activo: f.denominacion_activo || null,
    txt_descripcion_2: f.descripcion_2 || null,
    txt_serie_original: f.serie_original || null,
    txt_estado_ti: f.estado_ti || null,
    txt_responsable_nombre: f.responsable_nombre || null,
    txt_area_it: f.area_it || null,
    txt_estado_contable: ENUM_ESTADO[normHeader(f.estado_contable)] || 'desconocido',
    txt_accion_contable: ENUM_ACCION[normHeader(f.accion_contable)] || 'ninguna',
    txt_nivel_i: f.nivel_i || null,
    txt_ce_coste: f.ce_coste || null,
    txt_denominacion_ceco: f.denominacion_ceco || null,
    txt_area_2: f.area_2 || null,
    dec_valor_en_libros: parseNum(f.valor_en_libros),
    dec_costo_real: parseNum(f.costo_real),
    dec_depreciacion: parseNum(f.depreciacion),
    dec_valor_libros_noc: parseNum(f.valor_libros_noc),
    dec_costo_usd: parseNum(f.costo_usd),
    dec_depreciacion_usd: parseNum(f.depreciacion_usd),
    dec_valor_libros_usd: parseNum(f.valor_libros_usd),
    dec_tipo_cambio: parseNum(f.tipo_cambio),
    txt_moneda: (f.moneda || '').slice(0, 3) || null,
    txt_proveedor: f.proveedor || null,
    txt_linea_producto: f.linea_producto || null,
    txt_tipo_archivo: f.tipo_archivo || null,
    txt_vida_util: f.vida_util || null,
    dte_sustitucion: parseFechaISO(f.sustitucion),
    txt_tipo_compra: f.tipo_compra || null,
    txt_estatus_nueva_planta: f.estatus_nueva_planta || null,
    txt_serie_extraida: serieExtraida,
    txt_tipo_activo: tipoActivo,
  }));

  const meta: ImportMeta = {
    txt_archivo: file.name,
    int_filas_serie_ok: conSerie,
    int_filas_serie_0: serie0,
    int_filas_dup: dupSeries.length,
    json_reporte: reporte,
    txt_creado_por: creadoPor ?? null,
  };

  return { rows, meta, reporte, mapeo: mapeoDetalle, delimiter, dupSeries };
}

// Exports para pruebas / reuso
export const _internal = { normSerie, extraerSerialDeTexto, clasificarTipo, detectDelimiter };
