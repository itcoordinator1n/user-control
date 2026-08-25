/**
 * Casos limite del calculo de horas reales (union de intervalos por operario).
 * Ejecutar: node scripts/check-horas-reales.ts
 */
import { calcularHorasReales, formatHMS } from "../src/lib/produccion-horas.ts";

const d = (hhmm: string) => `2026-08-25 ${hhmm}:00`;
const iv = (a: string, b: string | null) => ({ hora_inicio: d(a), hora_fin: b ? d(b) : null });

interface Caso { nombre: string; actividades: any[]; esperado: string }

const CASOS: Caso[] = [
  {
    nombre: "Solape total: 3 actividades a la vez, misma hora",
    actividades: [
      { fk_operario: 1, intervalos: [iv("08:00", "09:00")] },
      { fk_operario: 1, intervalos: [iv("08:00", "09:00")] },
      { fk_operario: 1, intervalos: [iv("08:00", "09:00")] },
    ],
    esperado: "1:00:00",
  },
  {
    nombre: "Solape parcial: 08-10 y 09-11",
    actividades: [
      { fk_operario: 1, intervalos: [iv("08:00", "10:00")] },
      { fk_operario: 1, intervalos: [iv("09:00", "11:00")] },
    ],
    esperado: "3:00:00",
  },
  {
    nombre: "Contencion: 08-12 contiene 09-10",
    actividades: [
      { fk_operario: 1, intervalos: [iv("08:00", "12:00")] },
      { fk_operario: 1, intervalos: [iv("09:00", "10:00")] },
    ],
    esperado: "4:00:00",
  },
  {
    nombre: "Disjuntos: 08-09 y 14-15 (no se fusionan)",
    actividades: [
      { fk_operario: 1, intervalos: [iv("08:00", "09:00")] },
      { fk_operario: 1, intervalos: [iv("14:00", "15:00")] },
    ],
    esperado: "2:00:00",
  },
  {
    nombre: "Contiguos: 08-09 y 09-10 (se fusionan, sin doble conteo)",
    actividades: [
      { fk_operario: 1, intervalos: [iv("08:00", "09:00")] },
      { fk_operario: 1, intervalos: [iv("09:00", "10:00")] },
    ],
    esperado: "2:00:00",
  },
  {
    nombre: "Intervalo abierto: se ignora",
    actividades: [
      { fk_operario: 1, intervalos: [iv("08:00", "09:00"), iv("10:00", null)] },
    ],
    esperado: "1:00:00",
  },
  {
    nombre: "Dos operarios distintos solapados: NO se fusionan entre si",
    actividades: [
      { fk_operario: 1, intervalos: [iv("08:00", "09:00")] },
      { fk_operario: 2, intervalos: [iv("08:00", "09:00")] },
    ],
    esperado: "2:00:00",
  },
  {
    nombre: "Caso real del plan: 1 persona, 3 actividades, 1 hora",
    actividades: [
      { fk_operario: 7, intervalos: [iv("08:00", "09:00")] },
      { fk_operario: 7, intervalos: [iv("08:00", "09:00")] },
      { fk_operario: 7, intervalos: [iv("08:00", "09:00")] },
    ],
    esperado: "1:00:00",
  },
  { nombre: "Sin actividades", actividades: [], esperado: "0:00:00" },
];

let fallos = 0;
for (const c of CASOS) {
  const real = formatHMS(calcularHorasReales(c.actividades));
  const ok = real === c.esperado;
  if (!ok) fallos++;
  console.log(`${ok ? "OK    " : "FALLO "} ${c.nombre}`);
  console.log(`         horas reales = ${real}${ok ? "" : `  (esperado ${c.esperado})`}`);
}
console.log(fallos === 0 ? "\nTodos los casos correctos." : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
