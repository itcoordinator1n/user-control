/**
 * Comprobación determinista de la matriz de accesos del módulo Producción.
 * Ejecutar: node scripts/check-produccion-perms.ts
 */
import { computeProduccionPerms } from "../src/app/page/produccion/_hooks/produccion-perms.ts";

interface Esperado {
  historial: boolean; nuevoRegistro: boolean; tablero: boolean;
  revisiones: boolean; actividades: boolean; firmar: boolean;
}

interface Caso { nombre: string; slugs: string[]; enforce: boolean; esperado: Esperado }

const CASOS: Caso[] = [
  {
    nombre: "Encargado de área",
    slugs: ["PROD:VIEW", "PROD:REGISTER"], enforce: true,
    esperado: { historial: true, nuevoRegistro: true, tablero: false, revisiones: false, actividades: false, firmar: false },
  },
  {
    nombre: "Jefe (valida y aprueba)",
    slugs: ["PROD:VIEW", "PROD:BOARD", "PROD:VALIDATE", "PROD:APPROVE"], enforce: true,
    esperado: { historial: true, nuevoRegistro: false, tablero: true, revisiones: true, actividades: false, firmar: true },
  },
  {
    nombre: "Administrador (todos los slugs)",
    slugs: ["PROD:VIEW", "PROD:REGISTER", "PROD:BOARD", "PROD:VALIDATE", "PROD:APPROVE", "PROD:CATALOG", "PROD:ADMIN"], enforce: true,
    esperado: { historial: true, nuevoRegistro: true, tablero: true, revisiones: true, actividades: true, firmar: true },
  },
  {
    nombre: "Encargado + catálogo → NO debe poder firmar",
    slugs: ["PROD:VIEW", "PROD:REGISTER", "PROD:CATALOG"], enforce: true,
    esperado: { historial: true, nuevoRegistro: true, tablero: false, revisiones: false, actividades: true, firmar: false },
  },
  {
    nombre: "PROD:ADMIN sin slugs de firma → ya no es comodín",
    slugs: ["PROD:ADMIN"], enforce: true,
    esperado: { historial: true, nuevoRegistro: true, tablero: true, revisiones: false, actividades: true, firmar: false },
  },
  {
    nombre: "Pre-seed (enforce=false) → default-allow, nada desaparece",
    slugs: ["PRODUCCION:TIEMPOS"], enforce: false,
    esperado: { historial: true, nuevoRegistro: true, tablero: true, revisiones: true, actividades: true, firmar: true },
  },
  {
    nombre: "Encargado pre-seed → también ve todo (regresión aceptada antes del seed)",
    slugs: ["PROD:VIEW", "PROD:REGISTER"], enforce: false,
    esperado: { historial: true, nuevoRegistro: true, tablero: true, revisiones: true, actividades: true, firmar: true },
  },
];

const CLAVES: (keyof Esperado)[] = ["historial", "nuevoRegistro", "tablero", "revisiones", "actividades", "firmar"];

let fallos = 0;
for (const { nombre, slugs, enforce, esperado } of CASOS) {
  const p = computeProduccionPerms(slugs, enforce);
  const real: Esperado = {
    historial: p.canView,
    nuevoRegistro: p.canRegister,
    tablero: p.canBoard,
    revisiones: p.canValidate || p.canApprove,
    actividades: p.canCatalog,
    firmar: p.canValidate || p.canApprove,
  };
  const errores = CLAVES.filter((k) => real[k] !== esperado[k])
    .map((k) => `${k}: esperado ${esperado[k]}, obtenido ${real[k]}`);

  console.log(`${errores.length ? "FALLO " : "OK    "} ${nombre}  [enforce=${enforce}]`);
  console.log(`         ${CLAVES.map((k) => `${k}=${real[k] ? "si" : "NO"}`).join("  ")}`);
  for (const e of errores) { console.log(`         -> ${e}`); fallos++; }
}

console.log(fallos === 0
  ? "\nTodos los perfiles se comportan como se espera."
  : `\n${fallos} discrepancia(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
