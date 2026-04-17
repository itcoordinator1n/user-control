# Dashboard Frontend — Estado Actual y Plan de Reestructuración

## 1. Estado Actual

### 1.1 Estructura de archivos

```
src/app/page/dashboard/
├── page.tsx                     (12 líneas — solo renderiza AttendanceDashboard)
├── attendance-dashboard.tsx     (5,048 líneas — MONOLITO)
├── permissions-dashboard.tsx    (1,736 líneas — MONOLITO secundario)
└── components/                  (carpeta vacía — sin uso)
```

> **Total: ~6,784 líneas en 2 archivos.** No existe ningún sub-componente extraído.

---

### 1.2 Las tres sub-vistas actuales

| Sub-vista | Líneas aprox. | Cómo se activa | Archivo actual |
|---|---|---|---|
| **Resumen Principal** (3 cards) | 1–2211 | Estado inicial | `attendance-dashboard.tsx` |
| **Detalle de Asistencias** | 2212–2955 | `showAttendanceDetail = true` | `attendance-dashboard.tsx` |
| **Análisis de Vacaciones** | 2961–5048 | `showVacationDetail = true` | `attendance-dashboard.tsx` |
| **Permisos** | línea 2957–2958 | `showPermissionsDetail = true` | `permissions-dashboard.tsx` |

#### Flujo de navegación actual
```
AttendanceDashboard (un solo componente)
  ├─ if (showAttendanceDetail) → return <bloque JSX asistencias>
  ├─ if (showPermissionsDetail) → return <PermissionsDashboard />
  ├─ if (showVacationDetail) → return <bloque JSX vacaciones>
  └─ else → return <resumen principal>
```

---

### 1.3 Fetches al montar — estado actual

```
useEffect #1 (mount) →  GET /api/requests/assistance-detail-resume     → cards resumen
                        GET /api/permissions/get-vacation-stats          → datos vacaciones
useEffect #2 (mount) →  GET /api/requests/get-monthly-attendance         → tabla asistencias
                        GET /api/attendance/attendance-history            → perfiles empleados
```

Los 4 fetches corren **siempre al montar**, sin importar qué vista abrirá el usuario.  
El endpoint de permisos (`/api/statistics/get-permissions-personal-statistics`) no enviaba Bearer header — **corregido** en `permissions-dashboard.tsx`.

---

### 1.4 Sistema de permisos — estado actual

El JWT decodificado expone en sesión:
```typescript
session.user.permissions  // string[] — ya existe ✅
session.user.area         // { name, color } — pendiente de agregar en backend (Fase 1 backend)
session.user.idEmployee   // number
```

**Problema:** ninguna sub-vista usa `permissions` ni `area` para decidir qué mostrar. El dashboard se muestra completo para cualquier usuario autenticado.

---

### 1.5 Inventario de problemas

| Problema | Archivo | Impacto |
|---|---|---|
| 5,048 líneas en un solo componente | `attendance-dashboard.tsx` | Mantenimiento imposible |
| 4 fetches al montar (sin demanda) | `attendance-dashboard.tsx:1703,1761` | Carga lenta siempre |
| Fetch de permisos sin Bearer header | `permissions-dashboard.tsx:528` | **Corregido ✅** |
| Sin guard de permisos ni área | Ambos archivos | Todos ven todo |
| `isClient` guard manual | `attendance-dashboard.tsx:2205` | Flash de null en SSR |
| Dos librerías de Excel (`xlsx` + `exceljs`) | `attendance-dashboard.tsx:4,67` | Bundle innecesario |
| ~800 líneas de mock data comentada | `attendance-dashboard.tsx:87–447` | Ruido, dificulta lectura |
| Import `string` de `zod` sin uso | `attendance-dashboard.tsx:68` | Warning de lint |
| `hoursDifference()` incompleta (bug) | `attendance-dashboard.tsx:1834` | Función rota sin usar |
| Sin skeleton/loading por sección | Ambos archivos | UX degradada en fetch lento |

---

## 2. Estructura Objetivo

```
src/app/page/dashboard/
├── page.tsx                              ← sin cambios
├── _types/
│   └── dashboard.types.ts               ← todas las interfaces centralizadas
├── _hooks/
│   ├── use-dashboard-permissions.ts     ← lógica de acceso por rol/área
│   ├── use-attendance.ts                ← fetch bajo demanda
│   ├── use-vacations.ts                 ← fetch bajo demanda
│   └── use-permissions.ts              ← fetch bajo demanda
├── _components/
│   ├── shared/
│   │   ├── dashboard-skeleton.tsx       ← skeleton reutilizable
│   │   ├── area-filter.tsx              ← filtro de área reutilizable
│   │   ├── period-filter.tsx            ← filtro de período reutilizable
│   │   └── export-excel-button.tsx      ← botón export unificado (usa solo exceljs)
│   ├── summary/
│   │   └── dashboard-summary.tsx        ← 3 cards + guard de vistas
│   ├── attendance/
│   │   ├── attendance-view.tsx          ← vista completa extraída de attendance-dashboard.tsx
│   │   ├── attendance-area-cards.tsx    ← cards por área
│   │   └── attendance-table.tsx         ← tabla de registros + modal empleado
│   ├── vacations/
│   │   ├── vacation-view.tsx            ← vista completa extraída de attendance-dashboard.tsx
│   │   ├── vacation-area-cards.tsx      ← cards por área
│   │   └── vacation-table.tsx           ← tabla empleados + modal
│   └── permissions/
│       ├── permissions-view.tsx         ← migrado de permissions-dashboard.tsx
│       ├── permissions-area-cards.tsx   ← cards por área
│       └── permissions-table.tsx        ← tabla solicitudes + modal
└── attendance-dashboard.tsx             ← orquestador (~150 líneas al final)
```

---

## 3. Plan por Fases

Las fases están alineadas con las del backend. Cada una es prerequisito de la siguiente.

---

### Fase 1 — Seguridad crítica
**Alineada con:** Backend Fase 1  
**Prerequisito de:** Fases 2, 3, 4

#### 1.1 Fix del Bearer header — COMPLETADO ✅
El fetch de permisos ya tiene el `Authorization` header correcto.

#### 1.2 Actualizar tipo de sesión para incluir `area`
Cuando el backend agregue `area` al JWT, el tipo de sesión en NextAuth debe reflejarlo.

**Archivo:** `src/app/api/auth/[...nextauth]/route.ts`
```typescript
// Estado actual (comentado / incompleto en el token)
// Estado objetivo: descomentar y activar el mapeo de area
async session({ session, token }) {
  session.user.accessToken = token.accessToken as string
  session.user.permissions = (token.permissions as string[]) || []
  session.user.area = token.area as { name: string; color?: string } | null  // ← agregar
  session.user.idEmployee = token.idEmployee as string | number | undefined  // ← agregar
  return session
}
```

**Archivo:** `src/app/api/auth/[...nextauth]/route.ts` — bloque `jwt`:
```typescript
async jwt({ token, user }) {
  if (user) {
    token.accessToken = (user as any).token
    token.id = user.id
  }
  if (token.accessToken) {
    const payload: Pay = jwtDecode(token.accessToken as string)
    token.permissions = payload.permissions ?? []
    token.area = payload.area ?? null           // ← agregar (llega cuando backend lo emita)
    token.idEmployee = payload.idEmployee ?? null // ← agregar
  }
  return token
}
```

#### 1.3 Eliminar función rota `hoursDifference`
**Archivo:** `attendance-dashboard.tsx:1834–1844`  
La función nunca se terminó de implementar (la segunda fecha usa las variables de la primera), no se llama en ningún lugar, y genera confusión. Eliminarla.

#### Checklist Fase 1 — COMPLETADA ✅
- [x] Fix Bearer header en `permissions-dashboard.tsx:528`
- [x] Activar mapeo de `area` e `idEmployee` en el callback `session` de NextAuth
- [x] Activar mapeo de `area` e `idEmployee` en el callback `jwt` de NextAuth
- [x] Eliminar función `hoursDifference` incompleta
- [x] Confirmado: el JWT ya emitía `area: { name, color }` — activo desde Fase 1

---

### Fase 2 — Separación de código + Control de acceso por área
**Alineada con:** Backend Fase 2  
**Prerequisito:** `session.user.area` disponible (Fase 1)

Esta es la fase de mayor cambio. El objetivo es **separar el monolito en componentes independientes** y aplicar simultáneamente los guards de permisos, porque la separación hace posible aplicarlos correctamente.

#### 2.1 Centralizar interfaces en `_types/dashboard.types.ts`

Mover todas las interfaces actuales (dispersas en ambos archivos) a un solo archivo:

```typescript
// _types/dashboard.types.ts
export interface AttendanceRecord { ... }
export interface EmployeeProfile { ... }
export interface VacationDataInterface { ... }
export interface EmployeeVacationProfile { ... }
export interface PermissionsDataType { ... }
export interface PermissionRequestsType { ... }
// + CardData interface (actualmente usa `as any`)
```

#### 2.2 Crear hook `use-dashboard-permissions.ts`

```typescript
// _hooks/use-dashboard-permissions.ts
import { useSession } from "next-auth/react"

export type DashboardView = "attendance" | "vacations" | "permissions"

// Normaliza nombre de área al formato que usa el backend en los strings de permiso:
// "Administración" → "administracion" (minúsculas, sin tildes)
function normalizeArea(area: string): string {
  return area
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function useDashboardPermissions() {
  const { data: session } = useSession()
  const permissions = session?.user?.permissions ?? []
  const userArea = session?.user?.area?.name ?? null

  const canView = (view: DashboardView): boolean => {
    if (permissions.length === 0) return true  // fallback permisivo: sin strings → ve todo
    switch (view) {
      case "attendance":   return permissions.includes("dashboard:attendance:view")
      case "vacations":    return permissions.includes("dashboard:vacations:view")
      case "permissions":  return permissions.includes("dashboard:permissions:view")
      default:             return false
    }
  }

  // true = el usuario solo ve su propia área (no tiene dashboard:all:view)
  const isAreaRestricted = permissions.length > 0
    && !permissions.includes("dashboard:all:view")

  // Área en formato normalizado para comparar con los strings dashboard:area:<nombre>:view
  const normalizedArea = userArea ? normalizeArea(userArea) : null

  return { canView, isAreaRestricted, userArea, normalizedArea, permissions }
}
```

> **Nombres de área en los strings del backend** (minúsculas, sin tildes):
> `planta` · `administracion` · `contabilidad` · `bodega`

#### 2.3 Extraer vista de Asistencias

**Origen:** `attendance-dashboard.tsx` líneas 2212–2955  
**Destino:** `_components/attendance/attendance-view.tsx`

El componente recibe como props:
```typescript
interface AttendanceViewProps {
  onBack: () => void
  allowedArea: string | null  // null = todas las áreas
}
```
Los estados de filtro, paginación y modal son locales al componente extraído.

#### 2.4 Extraer vista de Vacaciones

**Origen:** `attendance-dashboard.tsx` líneas 2961–5048  
**Destino:** `_components/vacations/vacation-view.tsx`

```typescript
interface VacationViewProps {
  onBack: () => void
  allowedArea: string | null
}
```

#### 2.5 Migrar Permisos

**Origen:** `permissions-dashboard.tsx` (1,736 líneas)  
**Destino:** `_components/permissions/permissions-view.tsx`

Sin cambios de lógica. Solo moverlo al nuevo lugar y actualizar el import en el orquestador.

```typescript
interface PermissionsViewProps {
  onBack: () => void
  allowedArea: string | null
}
```

#### 2.6 Crear `dashboard-summary.tsx` como orquestador

Reemplaza el bloque de resumen que hoy vive en `attendance-dashboard.tsx` (líneas 1–2211):

```typescript
// _components/summary/dashboard-summary.tsx
export function DashboardSummary() {
  const { canView, isAreaRestricted, userArea } = useDashboardPermissions()
  const [activeView, setActiveView] = useState<DashboardView | null>(null)

  // Cards de resumen — solo muestra las que el usuario puede ver
  return (
    <div>
      {canView("attendance") && (
        <Card onClick={() => setActiveView("attendance")} ... />
      )}
      {canView("vacations") && (
        <Card onClick={() => setActiveView("vacations")} ... />
      )}
      {canView("permissions") && (
        <Card onClick={() => setActiveView("permissions")} ... />
      )}
    </div>
  )
}
```

#### 2.7 Filtro de área bloqueado para usuarios restringidos

En cada vista extraída, cuando `isAreaRestricted = true`:
- El `Select` de área se renderiza en modo `disabled`
- El valor inicial es `userArea` (no "Todas")
- El label muestra el área sin opción de cambio

```typescript
<Select
  value={isAreaRestricted ? (userArea ?? selectedArea) : selectedArea}
  onValueChange={isAreaRestricted ? undefined : setSelectedArea}
  disabled={isAreaRestricted}
>
```

#### 2.8 Reducir `attendance-dashboard.tsx` al orquestador

Una vez extraídas las 3 vistas, el archivo original queda como orquestador de ~150 líneas:

```typescript
// attendance-dashboard.tsx (después)
export default function AttendanceDashboard() {
  const [activeView, setActiveView] = useState<DashboardView | null>(null)

  if (activeView === "attendance")
    return <AttendanceView onBack={() => setActiveView(null)} />
  if (activeView === "vacations")
    return <VacationView onBack={() => setActiveView(null)} />
  if (activeView === "permissions")
    return <PermissionsView onBack={() => setActiveView(null)} />

  return <DashboardSummary onNavigate={setActiveView} />
}
```

#### Checklist Fase 2
- [x] Crear `_types/dashboard.types.ts` con todas las interfaces
- [x] Crear `_hooks/use-dashboard-permissions.ts`
- [x] Extraer `AttendanceView` a `_components/attendance/attendance-view.tsx`
- [x] Extraer `VacationView` a `_components/vacations/vacation-view.tsx`
- [x] Mover `permissions-dashboard.tsx` a `_components/permissions/permissions-view.tsx`
- [x] Reducir `attendance-dashboard.tsx` al orquestador + vista resumen
- [x] Eliminar `isClient` guard manual — eliminado junto con el código muerto
- [x] Eliminar código muerto: ~1,385 líneas eliminadas (mock data, interfaces comentadas, vacationData shadowed)
- [x] Eliminar imports sin uso: `xlsx`, `string` de `zod`
- [x] Aplicar `canView()` en las 3 cards del resumen
- [x] Aplicar filtro de área bloqueado en las 3 vistas (`disabled` cuando `isAreaRestricted`)

---

### Fase 3 — Rendimiento
**Alineada con:** Backend Fase 3  
**Prerequisito:** Separación de Fase 2 completada, endpoint `/api/dashboard/summary` disponible en backend

#### 3.1 Hooks de fetch bajo demanda

Cada sub-vista obtiene sus datos a través de su propio hook, que solo hace el fetch cuando `enabled = true`:

```typescript
// _hooks/use-attendance.ts
export function useAttendanceData(enabled: boolean, area: string | null) {
  const { data: session } = useSession()
  const [data, setData] = useState<{ attendanceData: ..., byUser: ... } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !session?.user?.accessToken) return
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (area) params.set("area", area)

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/attendance-history?${params}`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [enabled, session?.user?.accessToken, area])

  return { data, loading, error }
}
```

El mismo patrón aplica para `use-vacations.ts` y `use-permissions.ts`.

Los hooks de Fase 2 (datos en el orquestador) se eliminan y cada vista llama a su propio hook.

#### 3.2 Consumir el nuevo endpoint `/api/dashboard/summary`

Cuando el backend habilite `GET /api/dashboard/summary`, reemplazar los 2 `useEffect` de carga inicial (que hacen 3 fetches paralelos) por uno solo:

```typescript
// _components/summary/dashboard-summary.tsx
useEffect(() => {
  if (!session?.user?.accessToken) return
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/summary`, {
    headers: { Authorization: `Bearer ${session.user.accessToken}` },
  })
    .then(r => r.json())
    .then(data => {
      setAttendanceSummary(data.attendance)
      setVacationSummary(data.vacations)
      setPermissionsSummary(data.permissions)
    })
}, [session?.user?.accessToken])
```

Esto reduce **3 fetches paralelos al montar** a **1 fetch**.

#### 3.3 Soporte de query params en los fetches

Cuando el backend habilite `?area=`, `?period=`, `?page=`, `?limit=`, los hooks deben pasarlos como parámetros. Los filtros de área y período dejan de ser puramente de cliente para convertirse en filtros de servidor.

```typescript
// Patrón de construcción de query en los hooks:
const params = new URLSearchParams()
if (area && area !== "Todas") params.set("area", area)
if (period) params.set("period", period)
if (page) params.set("page", String(page))
if (limit) params.set("limit", String(limit))
```

#### 3.4 Lazy loading con `dynamic()` de Next.js

Las 3 vistas se importan de forma diferida — el bundle de cada vista solo se carga cuando el usuario la abre:

```typescript
// attendance-dashboard.tsx (orquestador)
import dynamic from "next/dynamic"
import { DashboardSkeleton } from "./_components/shared/dashboard-skeleton"

const AttendanceView = dynamic(
  () => import("./_components/attendance/attendance-view").then(m => m.AttendanceView),
  { loading: () => <DashboardSkeleton />, ssr: false }
)
const VacationView = dynamic(
  () => import("./_components/vacations/vacation-view").then(m => m.VacationView),
  { loading: () => <DashboardSkeleton />, ssr: false }
)
const PermissionsView = dynamic(
  () => import("./_components/permissions/permissions-view").then(m => m.PermissionsView),
  { loading: () => <DashboardSkeleton />, ssr: false }
)
```

Esto también elimina el `isClient` guard manual actual.

#### 3.5 Skeleton loader y estado de error

Crear `_components/shared/dashboard-skeleton.tsx` con un skeleton visual para mientras carga cada vista, y mostrar un mensaje de error inline cuando el fetch falla (actualmente los errores son silenciosos en pantalla).

#### 3.6 Unificar librería de Excel

Eliminar el import de `xlsx` de `attendance-dashboard.tsx:4`. Ya se usa `exceljs` en ambos archivos. Mover la lógica de exportación a `_components/shared/export-excel-button.tsx` para que no se duplique entre vistas.

#### Checklist Fase 3
- [x] Crear `_hooks/use-attendance.ts` con `enabled` + `area` como parámetros
- [x] Crear `_hooks/use-vacations.ts` con `enabled` + `area`
- [x] Crear `_hooks/use-permissions.ts` con `enabled` + `area`
- [x] Eliminar los `useEffect` de fetching del orquestador — cada sub-vista llama su propio hook
- [x] Consumir `/api/dashboard/summary` en `DashboardSummary` — datos reales en las 3 cards
- [ ] Agregar soporte de `?page`, `?limit` en los hooks (pendiente backend)
- [x] `?area` pasado en `use-attendance.ts` y `use-vacations.ts`
- [x] `?period=YYYY-MM` pasado en `use-attendance.ts` (get-monthly-attendance)
- [x] Aplicar `dynamic()` en el orquestador para las 3 vistas
- [x] Crear `_components/shared/dashboard-skeleton.tsx`
- [x] Agregar estado de error visible en `AttendanceView` y `VacationView`
- [x] Eliminar import `xlsx` — ya eliminado en Fase 2
- [ ] Crear `_components/shared/export-excel-button.tsx` reutilizable (Fase 4)

---

### Fase 4 — Limpieza y documentación
**Alineada con:** Backend Fase 4  
**Prerequisito:** Fases 1–3 completadas

#### 4.1 Eliminar código muerto

| Qué | Dónde | Líneas aprox. |
|---|---|---|
| Mock data comentada (`// const example`, `// const employeeProfiles`) | `attendance-dashboard.tsx:87–521` | ~430 líneas |
| Interfaces comentadas (`// interface AttendanceDetail`) | `attendance-dashboard.tsx:450–461` | ~10 líneas |
| Mock data de permisos hardcodeada (`permissionsData2`) | `permissions-dashboard.tsx:46–511` | ~465 líneas |
| Import `string` de `zod` sin uso | `attendance-dashboard.tsx:68` | 1 línea |
| Función `hoursDifference` incompleta | `attendance-dashboard.tsx:1834` | ~10 líneas |
| `console.log` de debug | Ambos archivos | varios |

> Eliminar primero el código muerto de los monolitos antes de extraer (facilita la lectura durante Fase 2).  
> **Recomendación:** hacer esta limpieza al inicio de Fase 2, antes de extraer los bloques.

#### 4.2 Extraer componentes compartidos finales

Una vez estabilizadas las 3 vistas, identificar JSX repetido y extraer:

- `_components/shared/area-filter.tsx` — el `Select` de área aparece idéntico en las 3 vistas
- `_components/shared/period-filter.tsx` — el selector de período es igual en las 3 vistas
- Componentes de badge de estado (`getStatusBadge`, `getRiskBadge`) — lógica duplicada entre vistas

#### 4.3 Actualizar documentación

- Actualizar `docs/dashboard-frontend.md` marcando ítems completados
- Actualizar `docs/dashboard-backend.md` con el estado real de endpoints (quitar el "bug de seguridad" del backend — ya estaba resuelto)
- Confirmar la lista definitiva de strings `dashboard:*` cuando el backend los emita

#### Checklist Fase 4
- [x] Eliminar mock data comentada en `attendance-dashboard.tsx` — ya no existe (orquestador ~150 líneas)
- [x] Eliminar `permissionsData2` hardcodeada en `permissions-view.tsx` (~151 líneas)
- [x] Eliminar `permissionsData` hardcodeada en `permissions-view.tsx` (~189 líneas)
- [x] Eliminar `permissionRequests` hardcodeado en `permissions-view.tsx` (~50 líneas)
- [x] Eliminar `console.log` de debug en `permissions-view.tsx`
- [x] Extraer `area-filter.tsx` como componente compartido — usado en las 3 vistas + orquestador
- [x] Extraer `period-filter.tsx` como componente compartido — variante `attendance` / `general`
- [ ] Extraer lógica de badges de estado a utilidades
- [ ] Actualizar `docs/dashboard-backend.md` (corregir sección de bug de seguridad)
- [ ] Documentar strings `dashboard:*` definitivos cuando backend los publique

---

## 4. Resumen de Impacto por Fase

| Métrica | Antes | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
|---|---|---|---|---|---|
| Líneas en archivo principal | 5,048 | ~5,038 | ~150 | ~150 | ~150 |
| Fetch permisos con Bearer | ❌ | ✅ | ✅ | ✅ | ✅ |
| Guard de permisos | ❌ | ❌ | ✅ | ✅ | ✅ |
| Filtro por área bloqueado | ❌ | ❌ | ✅ | ✅ | ✅ |
| Fetches al montar | 4 siempre | 4 | 4 | 0–1 | 0–1 |
| Lazy loading sub-vistas | ❌ | ❌ | ❌ | ✅ | ✅ |
| Skeleton loader | ❌ | ❌ | ❌ | ✅ | ✅ |
| Librerías de Excel | 2 | 2 | 2 | 1 | 1 |
| Código muerto | ~800 líneas | ~800 | ~800 | ~800 | 0 |

---

## 5. Alineación con el Backend

| Fase Frontend | Fase Backend | Dependencia |
|---|---|---|
| **Fase 1** — Auth fix + tipos de sesión | **Fase 1** — `area` en JWT | Coordinado: el frontend activa el mapeo cuando el backend lo emita |
| **Fase 2** — Separación + RBAC | **Fase 2** — Filtrado por área en endpoints | Independiente: el frontend puede separar el código antes de que el backend filtre |
| **Fase 3** — Hooks + lazy loading | **Fase 3** — `/summary` + query params + paginación | Dependiente: los hooks de paginación y `?area=` requieren que el backend los soporte |
| **Fase 4** — Limpieza | **Fase 4** — Documentación | Independiente |
