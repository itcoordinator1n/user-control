# Dashboard Backend — Estado Actual y Plan de Reestructuración

## 1. Estado Real de Endpoints

### 1.1 Mapa de endpoints del dashboard

| Endpoint | Auth backend | Filtra por área | Estado |
|---|---|---|---|
| `GET /api/requests/assistance-detail-resume` | ✅ JWT | ✅ por permisos | **Fase 2 completa** |
| `GET /api/requests/get-monthly-attendance` | ✅ JWT | ✅ por permisos | **Fase 2 completa** |
| `GET /api/attendance/attendance-history` | ✅ JWT | ✅ por permisos | **Fase 2 completa** (N+1 pendiente Fase 3) |
| `GET /api/permissions/get-vacation-stats` | ✅ JWT | ✅ por permisos | **Fase 2 completa** |
| `GET /api/statistics/get-permissions-personal-statistics` | ✅ JWT | ✅ por permisos | **Fase 2 completa** |

> Los contratos de respuesta no cambiaron — misma estructura, distinto volumen de datos según el rol del usuario.

---

### 1.2 JWT actual (`ticket-rbac.js:5`) — ✅ Fase 1 y 2 completas

```typescript
// Claims que incluye el JWT (ya estaban desde antes de las fases):
{
  id: number,
  idEmployee: number,
  permissions: string[],  // incluye strings dashboard:* desde Fase 2
  roles: [{ id: number, name: string }],
  area: { name: string, color?: string }  // ya existía — no requirió cambio en login
}
```

> El JWT ya tenía `area` y `permissions[]` desde el inicio. No fue necesario modificar el controlador de login. Los strings `dashboard:*` se emiten desde Fase 2.

---

### 1.3 Estructura de respuestas confirmadas

**`GET /api/requests/get-monthly-attendance`**
```typescript
// Array de registros:
{
  fecha: string,           // ISO date
  int_id_empleado: number,
  nombre_empleado: string,
  area: string,
  entrada: string | null,
  salida: string | null
}[]
```

**`GET /api/attendance/attendance-history`**
```typescript
{
  byUser: { [slug: string]: EmployeeProfile },  // keyed por slug del nombre
  attendanceData: AttendanceRecord[]
}
```

**`GET /api/statistics/get-permissions-personal-statistics`**
```typescript
{
  permissionsData: PermissionsDataType[],
  permissionRequests: PermissionRequestsType[]
}
// ✅ Coincide con las interfaces del frontend
```

**`GET /api/permissions/get-vacation-stats`**
```typescript
{
  stats: VacationDataInterface[],
  profiles: EmployeeVacationProfile[]
}
```

**`GET /api/requests/assistance-detail-resume`**
```typescript
// Estructura sin tipado definido en el frontend (usa `as any`)
// Pendiente de documentar forma exacta
```

---

## 2. Plan por Fases

---

### Fase 1 — Seguridad crítica
**Prerequisito de:** Fases 2, 3, 4

#### 1.1 Fix frontend del Bearer header — COMPLETADO ✅
El frontend ya envía el header `Authorization: Bearer <token>` al endpoint de permisos.

#### 1.2 Agregar `area` al JWT en el login

**Archivo:** controlador de login donde se llama `jwt.sign()`

```javascript
// Agregar al payload del JWT:
area: {
  id: user.int_fk_area,
  name: user.txt_nombre_area  // o el campo exacto de la BD
}
```

Esto habilita el filtrado de Fase 2 sin más cambios al middleware. El frontend ya tiene el mapeo preparado para recibirlo.

#### 1.3 Verificar propagación de `req.user.area`

Agregar un log temporal en uno de los controllers del dashboard para confirmar que `req.user.area` llega correctamente después del cambio en el login.

#### Checklist Fase 1 — COMPLETADA ✅
- [x] Frontend: Bearer header en `permissions-dashboard.tsx` ← ya hecho
- [x] `area` en JWT ← ya existía, no requirió cambio
- [x] `req.user.area` disponible en controllers ← confirmado
- [x] Frontend: `session.user.area` se mapea correctamente ← activado en `route.ts`

---

### Fase 2 — Control de acceso por área/permisos
**Prerequisito:** `req.user.area` disponible en el JWT (Fase 1)

#### 2.1 Crear middleware `dashboardAccess.js`

**Archivo nuevo:** `src/app/middlewares/dashboardAccess.js`

```javascript
// Lee req.user.permissions y req.user.area
// Determina qué áreas puede ver el usuario:
//   - dashboard:all:view en permissions → req.allowedAreas = 'all'
//   - dashboard:area:<nombre>:view → req.allowedAreas = [<nombre>]
//   - fallback (sin strings dashboard:*) → req.allowedAreas = [req.user.area.name]
// Expone req.allowedAreas: string[] | 'all'

function dashboardAccess(req, res, next) {
  const permissions = req.user?.permissions ?? []
  const userArea = req.user?.area?.name ?? null

  if (permissions.includes("dashboard:all:view")) {
    req.allowedAreas = "all"
  } else {
    const areaPerms = permissions
      .filter(p => p.startsWith("dashboard:area:") && p.endsWith(":view"))
      .map(p => p.replace("dashboard:area:", "").replace(":view", ""))

    req.allowedAreas = areaPerms.length > 0 ? areaPerms : (userArea ? [userArea] : [])
  }

  next()
}
```

#### 2.2 Aplicar filtrado en los 5 endpoints

Registrar el middleware y modificar cada controller para usar `req.allowedAreas`:

```javascript
// Patrón a aplicar en cada query:
const whereClause = req.allowedAreas === "all"
  ? ""
  : `AND a.txt_nombre_area IN (${req.allowedAreas.map(() => "?").join(",")})`
const params = req.allowedAreas === "all" ? [] : req.allowedAreas
```

**Archivos a modificar:**
- `requests.js` → `assistanceDetailResume`, `getMonthlyAttendance`
- `attendance.js` → `getUsersHistory`
- `permissions.js` → `getVacationStats`
- `statistics.js` → `getPermissionsPersonalStatistics`

#### 2.3 Emitir strings `dashboard:*` en el login

Al generar el JWT, incluir los permisos de dashboard según el rol del usuario:

| String | Quién lo recibe |
|---|---|
| `dashboard:view` | Cualquier usuario con acceso al dashboard |
| `dashboard:attendance:view` | Supervisores, RRHH, Admin |
| `dashboard:vacations:view` | Supervisores, RRHH, Admin |
| `dashboard:permissions:view` | Supervisores, RRHH, Admin |
| `dashboard:all:view` | Admin global únicamente |
| `dashboard:area:planta:view` | Supervisor de Planta |
| `dashboard:area:administracion:view` | Supervisor de Administración |
| `dashboard:area:contabilidad:view` | Supervisor de Contabilidad |
| `dashboard:area:bodega:view` | Supervisor de Bodega |
| `dashboard:export:excel` | Usuarios con permiso de exportación |

#### Checklist Fase 2 — COMPLETADA ✅
- [x] Middleware de filtrado por área creado y registrado en las 5 rutas
- [x] `assistanceDetailResume` filtra por `allowedAreas`
- [x] `getMonthlyAttendance` filtra por área
- [x] `getUsersHistory` filtra por área
- [x] `getVacationStats` filtra por área
- [x] `getPermissionsPersonalStatistics` filtra por área
- [x] Strings `dashboard:*` emitidos en el JWT según rol del usuario

---

### Fase 3 — Rendimiento
**Prerequisito:** Fase 2 completada (filtrado activo)

#### 3.1 Resolver N+1 en `getUsersHistory`

**Problema:** `attendance.js:274` hace una query por cada empleado dentro de un `forEach`. Para 50 empleados = 51 queries al servidor de base de datos.

**Solución:** Una sola query con `JOIN` que traiga todos los usuarios y sus asistencias, luego agrupar en memoria:

```javascript
// Antes (N+1):
const employees = await getEmployees()
for (const emp of employees) {
  emp.records = await getAttendanceForEmployee(emp.id) // ← query por cada uno
}

// Después (1 query):
const rows = await db.query(`
  SELECT u.*, a.*
  FROM usuarios u
  LEFT JOIN asistencias a ON a.int_fk_empleado = u.int_id_empleado
  WHERE a.fecha BETWEEN ? AND ?
  ${allowedAreasClause}
  ORDER BY u.int_id_empleado, a.fecha
`)
const byUser = rows.reduce((acc, row) => {
  const key = slugify(row.nombre_empleado)
  if (!acc[key]) acc[key] = { ...employeeFields(row), records: [] }
  if (row.fecha) acc[key].records.push(attendanceFields(row))
  return acc
}, {})
```

#### 3.2 Paginación server-side en `getUsersHistory`

Agregar soporte de `?page=1&limit=50`:

```javascript
// Response con paginación:
{
  attendanceData: AttendanceRecord[],
  byUser: { [slug: string]: EmployeeProfile },
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

#### 3.3 Soporte de query params en todos los endpoints

| Endpoint | Parámetros a soportar |
|---|---|
| `getMonthlyAttendance` | `?period=` (today/week/month/quarter/year) |
| `getUsersHistory` | `?area=`, `?page=`, `?limit=` |
| `getVacationStats` | `?area=` |
| `getPermissionsPersonalStatistics` | `?area=`, `?period=` |

Mapping de `period` a rango de fechas:
```javascript
const periodMap = {
  today:   [startOfDay, endOfDay],
  week:    [startOfWeek, endOfWeek],
  month:   [startOfMonth, endOfMonth],
  quarter: [startOfQuarter, endOfQuarter],
  year:    [startOfYear, endOfYear],
}
```

#### 3.4 Nuevo endpoint `GET /api/dashboard/summary`

**Archivos nuevos:**
- `src/app/controllers/dashboard.js`
- `src/app/routes/dashboard.js` (registrar en `app.js`)

Consolida en una sola respuesta los datos de las 3 cards del resumen. Elimina 3 de los 4 fetches paralelos del frontend al cargar la pantalla principal:

```javascript
// dashboard.js — getSummary()
// Aplica req.allowedAreas para filtrar
// Ejecuta 3 queries en paralelo (Promise.all)
// Devuelve:
{
  attendance: {
    totalPresent: number,
    percentage: number,
    trend: number,
    byArea: { area: string, present: number, total: number }[]
  },
  vacations: {
    totalDaysUsed: number,
    totalAccumulated: number,
    byArea: { area: string, daysUsed: number }[]
  },
  permissions: {
    totalApproved: number,
    totalPending: number,
    totalRejected: number,
    byArea: { area: string, total: number }[]
  }
}
```

#### 3.5 Caché opcional con TTL corto

Si `contextManager.js` ya tiene Redis + fallback en memoria, cachear la respuesta de `/api/dashboard/summary`:

```javascript
const cacheKey = `dashboard:summary:${req.allowedAreas === "all" ? "all" : req.allowedAreas.join(",")}`
const TTL = 3 * 60 // 3 minutos
```

#### Checklist Fase 3
- [ ] Reescribir `getUsersHistory` para eliminar N+1 (una sola query con JOIN)
- [ ] Agregar paginación a `getUsersHistory` (`?page`, `?limit`)
- [ ] Agregar `?period` a `getMonthlyAttendance`
- [ ] Agregar `?area`, `?period` a `getVacationStats`
- [ ] Agregar `?area`, `?period` a `getPermissionsPersonalStatistics`
- [ ] Crear `src/app/controllers/dashboard.js` con `getSummary`
- [ ] Crear `src/app/routes/dashboard.js` y registrar en `app.js`
- [ ] (Opcional) Cachear `/api/dashboard/summary` con TTL 3 min usando `contextManager.js`

---

### Fase 4 — Documentación
**Prerequisito:** Fases 1–3 completadas

#### Checklist Fase 4
- [ ] Documentar la forma exacta de respuesta de `assistance-detail-resume` (actualmente el frontend usa `as any`)
- [ ] Documentar qué claims incluye el JWT actualizado: `id`, `idEmployee`, `area`, `permissions`, `roles`
- [ ] Publicar la lista definitiva de strings `dashboard:*` al equipo de frontend
- [ ] Actualizar `docs/dashboard-backend.md` marcando ítems completados por fase
- [ ] Confirmar con el frontend los query params soportados y sus valores exactos

---

## 3. Resumen de Impacto por Fase

| Métrica | Antes | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
|---|---|---|---|---|---|
| Endpoint permisos con auth | ✅ (ya tenía) | ✅ | ✅ | ✅ | ✅ |
| Frontend envía Bearer a permisos | ❌ | ✅ | ✅ | ✅ | ✅ |
| `area` en JWT | ❌ | ✅ | ✅ | ✅ | ✅ |
| Filtrado por área en endpoints | ❌ | ❌ | ✅ | ✅ | ✅ |
| Strings `dashboard:*` en JWT | ❌ | ❌ | ✅ | ✅ | ✅ |
| N+1 en `getUsersHistory` | ❌ (N queries) | ❌ | ❌ | ✅ (1 query) | ✅ |
| Paginación server-side | ❌ | ❌ | ❌ | ✅ | ✅ |
| Endpoint `/api/dashboard/summary` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Documentación de respuestas | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Alineación con el Frontend

| Fase Backend | Fase Frontend | Dependencia |
|---|---|---|
| **Fase 1** — `area` en JWT | **Fase 1** — Mapeo en NextAuth | Coordinado: el frontend activa el mapeo cuando el backend emita `area` |
| **Fase 2** — Filtrado por área | **Fase 2** — Guard de permisos, filtro bloqueado | Independiente en código; los guards del frontend funcionan con o sin filtrado backend |
| **Fase 3** — `/summary` + query params | **Fase 3** — Hooks por demanda + lazy loading | Dependiente: el frontend consume `?area=`, `?period=`, `/summary` cuando estén disponibles |
| **Fase 4** — Documentación | **Fase 4** — Limpieza de código muerto | Independiente |
