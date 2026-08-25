/**
 * produccion-perms.ts — Lógica pura de permisos del módulo Producción.
 *
 * Separada del hook para poder ejercitarla sin React ni sesión
 * (ver scripts/check-produccion-perms.ts).
 *
 * ── Por qué un interruptor y no una heurística ──────────────────────────────
 * Los slugs PROD:BOARD, PROD:VALIDATE y PROD:CATALOG todavía no
 * están sembrados en la tabla `permiso` del backend, así que nadie los trae en
 * su JWT y aplicar el gate de golpe haría desaparecer el Tablero, Revisiones y
 * el Catálogo para todo el mundo.
 *
 * Intentar deducirlo mirando si el usuario tiene alguno de esos slugs NO
 * funciona: eso es información por usuario, y no distingue "el sistema aún no
 * está sembrado" de "a este usuario no se le concedieron". Con esa heurística,
 * un encargado sin los slugs nuevos seguiría viendo todas las pestañas incluso
 * después del seed.
 *
 * Por eso el modo es explícito, igual que `EQUIPOS_RBAC_ENFORCE` en el backend
 * (`infarma_server/src/app/middlewares/requireEquiposPerm.js`):
 *   NEXT_PUBLIC_PROD_RBAC_ENFORCE = "true"  → se exigen los slugs
 *   cualquier otro valor / ausente          → default-allow (pre-seed)
 *
 * PROD:ADMIN concede las capacidades operativas (ver, registrar, tablero,
 * catálogo) pero NO firmar: validar y aprobar exigen su slug explícito, para
 * poder delegar el catálogo a un encargado sin habilitarlo a firmar sus
 * propios reportes.
 */

/** Slugs introducidos después del despliegue inicial del módulo. */
export const SLUGS_NUEVOS = ["PROD:BOARD", "PROD:VALIDATE", "PROD:CATALOG"];

export interface ProduccionPerms {
  /** true = se están exigiendo los slugs nuevos; false = default-allow pre-seed */
  enforced: boolean;
  canView: boolean;
  canRegister: boolean;
  canBoard: boolean;
  canValidate: boolean;
  canCatalog: boolean;
  canAdmin: boolean;
}

export function computeProduccionPerms(
  slugs: Iterable<string>,
  enforce: boolean
): ProduccionPerms {
  const all = new Set<string>(slugs);

  const has = (slug: string) => all.has(slug);
  const isAdmin = has("PROD:ADMIN");
  /** exige el slug solo cuando el RBAC del módulo está activo */
  const hasNuevo = (slug: string) => (enforce ? all.has(slug) : true);

  return {
    enforced: enforce,
    canView: isAdmin || has("PROD:VIEW") || has("PRODUCCION:TIEMPOS"),
    canRegister: isAdmin || has("PROD:REGISTER") || has("PRODUCCION:TIEMPOS"),
    canBoard: isAdmin || hasNuevo("PROD:BOARD"),
    // La trazabilidad es de una sola firma (registrado por / validado por),
    // asi que PROD:VALIDATE es el unico permiso de firma. PROD:ADMIN no la concede.
    canValidate: hasNuevo("PROD:VALIDATE"),
    canCatalog: isAdmin || hasNuevo("PROD:CATALOG"),
    canAdmin: isAdmin,
  };
}
