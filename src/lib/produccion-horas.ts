/**
 * produccion-horas.ts — Horas reales de un control de tiempos.
 *
 * Un operario puede estar en varias actividades a la vez, asi que sumar los
 * intervalos de todas las actividades da HORAS-ACTIVIDAD: si alguien atiende
 * fabricacion y envasado durante la misma hora, esa hora se cuenta dos veces.
 * Es lo correcto para el formato (mide cuanto duro cada etapa), pero no es el
 * tiempo de reloj.
 *
 * Aqui se calcula ese tiempo real: por cada operario se fusionan sus intervalos
 * solapados y se suma la union. La suma sobre operarios son las horas-hombre
 * efectivas.
 *
 * Los intervalos abiertos (hora_fin null) se ignoran, igual que en el resto de
 * los calculos del modulo.
 */

export interface IntervaloLike {
  hora_inicio: string;
  hora_fin: string | null;
}

export interface ActividadLike {
  fk_operario: number;
  intervalos?: IntervaloLike[];
}

/** Fechas del servidor: "YYYY-MM-DD HH:mm:ss" o ISO. */
function parseFecha(s: string): number {
  return new Date(String(s).replace(" ", "T")).getTime();
}

/** Fusiona rangos solapados o contiguos y devuelve la duracion total cubierta. */
export function duracionUnion(rangos: Array<[number, number]>): number {
  if (!rangos.length) return 0;
  const ordenados = [...rangos].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [ini, fin] = ordenados[0];

  for (let i = 1; i < ordenados.length; i++) {
    const [s, e] = ordenados[i];
    if (s <= fin) {
      // Solapa o es contiguo: se extiende el tramo actual
      if (e > fin) fin = e;
    } else {
      total += fin - ini;
      [ini, fin] = [s, e];
    }
  }
  return total + (fin - ini);
}

/**
 * Horas-hombre reales del control, en milisegundos: la union de los intervalos
 * de cada operario, sumada sobre todos ellos.
 */
export function calcularHorasReales(actividades: ActividadLike[] | undefined): number {
  const porOperario = new Map<number, Array<[number, number]>>();

  (actividades ?? []).forEach((act) => {
    (act.intervalos ?? []).forEach((iv) => {
      if (!iv.hora_inicio || !iv.hora_fin) return;
      const ini = parseFecha(iv.hora_inicio);
      const fin = parseFecha(iv.hora_fin);
      if (!Number.isFinite(ini) || !Number.isFinite(fin) || fin <= ini) return;
      if (!porOperario.has(act.fk_operario)) porOperario.set(act.fk_operario, []);
      porOperario.get(act.fk_operario)!.push([ini, fin]);
    });
  });

  let total = 0;
  porOperario.forEach((rangos) => { total += duracionUnion(rangos); });
  return total;
}

/** "H:MM:SS", el mismo formato que usa el resumen del Excel. */
export function formatHMS(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
