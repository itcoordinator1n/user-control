# permits.md — Hoja de Ruta: Módulo de Permisos e Incapacidades

> **Generado el:** 2026-04-14  
> **Propósito:** Documento de planificación para desacoplar el flujo de Permisos Generales del flujo de Incapacidades Médicas, agregar la columna Motivo en el reporte Excel de RRHH, y sentar las bases para la gestión de estados y límites dinámicos.  
> **Regla:** Este documento es una hoja de ruta. No contiene código de implementación.

---

## Registro de Cambios Completados

### Backend — Fase 1 ✅ (2026-04-14)

Archivo modificado: `permissions.js`

#### Rutas afectadas

---

**`POST /api/permissions/request-permission` — MODIFICADA**

| Campo | Tipo | Requerido | Antes | Ahora |
|-------|------|-----------|-------|-------|
| `tipo` | string | No (default `'permiso'`) | No existía | `'permiso'` \| `'incapacidad'` |
| `documento` | File | Condicional | Siempre opcional | Obligatorio si `tipo === 'incapacidad'` |

Campos sin cambios: `startDateTime`, `endDateTime`, `reason`, `comment`.

Comportamiento nuevo:
- Si `tipo` no viene o no es reconocido → se normaliza a `'permiso'`
- Si `tipo === 'incapacidad'` y no hay archivo → responde `400`
- Si `tipo === 'permiso'` → `documentoFileName` se guarda como `null` aunque multer haya procesado un archivo
- El `INSERT` en BD usa el `tipoFinal` calculado en lugar del string hardcodeado `'permiso'`

> ⚠️ **Nota para el frontend:** El valor del campo es `'permiso'` (no `'general'`). Ajustar el plan original que usaba `'general'`.

---

**`GET /api/permissions/get-all-requests` — MODIFICADA**

Campo nuevo en cada objeto del array `permits`:
```json
{ "id": "PER-01", "tipo": "permiso", ... }
```
- `tipo` puede ser `"permiso"` o `"incapacidad"`
- El array `vacations` no cambia

---

**`GET /api/permissions/get-all-request-to-me` — MODIFICADA**

Mismo cambio que el anterior. Cada objeto del array `permits` ahora incluye:
```json
{ "id": "PER-01", "tipo": "permiso", "employeeName": "...", ... }
```

---

#### Pendiente — Backend Fase 2

- [ ] Fix del email hardcodeado (identificar dónde y reemplazar por el email del supervisor del empleado)
- [ ] `PATCH /api/permissions/:id/approve` — cambiar estado a `'aprobada'` + guardar comentario del aprobador
- [ ] `PATCH /api/permissions/:id/reject` — cambiar estado a `'rechazada'` + comentario obligatorio

---

### Frontend — Fase 2 ✅ (2026-04-14)

Archivos modificados: `attendance-management.tsx`, `permits-preview.tsx`, `requests-table.tsx`, `vacation-calendar.tsx`, `vacation-preview.tsx`, `signature-pad.tsx`

#### Resumen de cambios con impacto en backend

---

**Cambio 1 — Nuevo tipo: `"duelo"` (Permiso por duelo)**

El formulario ahora tiene un tercer tipo en el selector junto a `"permiso"` e `"incapacidad"`.

El frontend ya envía `tipo: "duelo"` al endpoint `POST /api/permissions/request-permission`.

Comportamiento del tipo duelo en el frontend:
- Usa **rango de fechas completas** (igual que `"incapacidad"`): `startDateTime = "YYYY-MM-DD 00:00:00"` / `endDateTime = "YYYY-MM-DD 23:59:59"`
- El adjunto (`documento`) es **opcional** — el usuario puede adjuntar acta o esquela pero no es obligatorio
- Se envía vía `multipart/form-data` igual que los otros tipos

**Lo que el backend debe agregar para `"duelo"`:**

| Regla | Detalle |
|-------|---------|
| Aceptar `tipo === 'duelo'` como valor válido | Actualmente solo acepta `'permiso'` e `'incapacidad'` — agregar `'duelo'` a los valores reconocidos |
| `documento` opcional | A diferencia de `'incapacidad'`, NO debe retornar `400` si no viene archivo |
| `documentoFileName` | Guardar si viene, `null` si no viene (mismo comportamiento que `'permiso'`) |
| Persistir en BD | El campo `txt_tipo` debe aceptar el valor `'duelo'` |

Resumen de reglas de validación para los 3 tipos:

| `tipo` | `documento` obligatorio | Estructura de fechas |
|--------|------------------------|----------------------|
| `'permiso'` | No | `startDateTime` y `endDateTime` con hora (ej. `2025-06-17 09:00:00`) |
| `'incapacidad'` | **Sí** — retorna `400` si no viene | Días completos (`00:00:00` / `23:59:59`) |
| `'duelo'` | No (opcional) | Días completos (`00:00:00` / `23:59:59`) |

---

**Cambio 2 — Campo `esCompensatorio` (pendiente de envío al backend)**

Se agregó un checkbox "Tiempo compensatorio" en el formulario de `tipo === 'permiso'`.

> ⚠️ **Estado actual:** El campo existe en el frontend pero **aún no se envía al backend**. Está preparado para cuando el backend lo soporte.

Cuando el backend esté listo, el frontend enviará:
```
esCompensatorio: "true" | "false"   (campo de texto en FormData)
```

**Lo que el backend deberá agregar en el futuro para `esCompensatorio`:**
- Columna en BD: `bool_compensatorio BOOLEAN DEFAULT FALSE`
- Aceptar el campo en el endpoint `POST /api/permissions/request-permission`
- Devolver el campo en `GET /api/permissions/get-all-requests` y `get-all-request-to-me`

---

**Cambio 3 — Días laborables en vacaciones (solo frontend)**

El cálculo de días laborables en el calendario y en la vista previa de vacaciones ahora excluye correctamente sábados y domingos mediante iteración día a día. Este cambio es **solo de UI** — no impacta ningún endpoint.

> Sin embargo, si el backend también calcula días al procesar la solicitud de vacaciones en `POST /api/permissions/request-vacations`, se recomienda aplicar la misma lógica para consistencia.

---

#### Rutas afectadas en Fase 2 (frontend → backend)

| Ruta | Tipo de cambio | Acción requerida en backend |
|------|---------------|----------------------------|
| `POST /api/permissions/request-permission` | Nuevo valor de campo | Aceptar `tipo: 'duelo'`, sin `400` si no hay archivo |
| `GET /api/permissions/get-all-requests` | Sin cambio de contrato | Asegurarse que `tipo` devuelva `'duelo'` para registros de ese tipo |
| `GET /api/permissions/get-all-request-to-me` | Sin cambio de contrato | Mismo que arriba |
| `POST /api/permissions/request-vacations` | Recomendación | Validar que el cálculo de días laborables excluya fines de semana |

---

#### Backend Fase 2 — Estado final ✅ (2026-04-14)

- [x] **`'duelo'` como tipo válido** — sin `400` por falta de archivo, fechas como días completos
- [x] **`bool_compensatorio`** — columna en BD, aceptado en POST como boolean/string, default `false`
- [x] **GET devuelve `tipo` y `compensatorio`** en cada objeto de `permits[]`

```json
{ "id": "PER-01", "tipo": "duelo", "compensatorio": false, ... }
```

- [x] Fix del email hardcodeado
- [x] `PATCH /api/permissions/:id/approve`
- [x] `PATCH /api/permissions/:id/reject`

---

### Backend — Fase 3 ✅ (2026-04-15)

Archivo modificado: `permissions.js`

#### DT-4 — Fix del aprobador en historial

El JOIN de `getAllRequests` usaba `a.id_usuario` (PK de login) pero `handleRequest` guarda `req.user.idEmployee` (`int_id_empleado`). Corregido a `a.int_id_empleado` → el nombre del aprobador ahora aparece correctamente en el historial de solicitudes.

---

#### Fix auxiliar — `handleRequest`

- `sendEmail` extraída a nivel módulo (reutilizable por los nuevos endpoints).
- Query de empleado ahora incluye `txt_correo_electronico AS email`.

---

#### Nuevos endpoints de gestión de estado

**`PATCH /api/permissions/:id/approve`**

| | |
|---|---|
| **Body** | `{ approverComment?: string }` — opcional |
| **`:id`** | `int_id_solicitud` directo, **sin prefijo** `PER-` |
| **401** | Sin autenticación |
| **400** | ID no válido |
| **404** | Solicitud no encontrada |
| **409** | Ya procesada (no está en `pendiente`) |
| **403** | El usuario autenticado no es el jefe del solicitante |
| **200** | Objeto `PermitRequest` actualizado con `status: "aprobada"` |

**`PATCH /api/permissions/:id/reject`**

Igual que `/approve` con una diferencia:

| | |
|---|---|
| **Body** | `{ approverComment: string }` — **obligatorio** |
| **400 adicional** | Si `approverComment` está vacío o ausente |
| **200** | Objeto `PermitRequest` actualizado con `status: "rechazada"` |

**Lógica interna (`processRequest`)**

Verifica en una sola query: existencia + estado `pendiente` + jerarquía (`u.int_id_jefe = approverId`). Si todo pasa: `UPDATE` del estado + notificación WA fire-and-forget.

---

#### Pendiente — Frontend Fase 3 (a implementar)

- [ ] Botones **Aprobar / Rechazar** en `RequestDetailsModal` — visibles solo para el supervisor del solicitante
- [ ] El ID que se envía al endpoint debe ser el número sin el prefijo `"PER-"` (ej.: `"PER-42"` → `42`)
- [ ] Rechazo requiere `approverComment` obligatorio → mostrar campo de texto antes de confirmar
- [ ] Al aprobar/rechazar exitosamente: cerrar modal + refrescar la tabla
- [ ] Manejar códigos de error `403` (no eres el supervisor) y `409` (ya procesada) con mensajes claros al usuario

---

### Frontend — Fase 2b ✅ (2026-04-14)

Conectar `esCompensatorio` al backend ahora que el endpoint lo acepta.

Archivos modificados: `permits-preview.tsx`, `requests-table.tsx`

---

## Estado Actual — Diagnóstico

### Frontend (`attendance-management.tsx`)
- Una sola pestaña "Permisos" que mezcla todos los tipos de permiso bajo el mismo formulario.
- `FileUpload` siempre visible y **opcional** — no se distingue si el adjunto es obligatorio.
- La fecha es un solo `DatePicker` (un día), no un rango.
- El `reason` field es un `<input>` de texto libre sin categoría estructurada.
- El botón "Vista previa" habilita cuando `permitDate && startTime && endTime && reason` están llenos — ignora si hay adjunto o no.

### Submit (`permits-preview.tsx`)
- Endpoint único: `POST /api/permissions/request-permission` vía `FormData`.
- Campos enviados: `documento` (opcional, solo `files[0]`), `startDateTime`, `endDateTime`, `reason`, `comment`.
- **No hay campo `tipo` (general vs. incapacidad)** en el payload actual.
- El endpoint no distingue el tipo de permiso — asume tratamiento homogéneo.

### Listado (`requests-table.tsx`)
- Endpoint: `GET /api/permissions/get-all-requests` → `{ permits: PermitRequest[], vacations: VacationRequest[] }`.
- La interfaz `PermitRequest` tiene: `id, date, timeRange, reason, status, approver, submittedDate, responseDate?, comments?, employeeComments?, attachments?`.
- **No hay campo `tipo`** que distinga el permiso.
- Los `attachments` ya están tipados con `{ name, type, url }` — la estructura para descargar comprobantes existe en el tipo pero no se muestra activamente en la tabla.

### Dashboard / Exportación (`permissions-dashboard.tsx`)
- **Todo el data es mock estático** — `permissionsData`, `permissionsData2`, `permissionRequests` son arreglos hardcodeados.
- El `exportToExcel` ya define la columna `"Motivo"` en la hoja "Permisos Aprobados" (línea 710), pero toma datos de `permissionRequests` (mock), no de la API.
- La hoja "Detalle por Empleado" no conecta a datos reales.

---

## Fase 1 — Diseño de la API (Backend First)

> El frontend no puede separarse correctamente sin que el backend soporte la distinción de tipos. Estos son los contratos que el equipo de backend debe definir antes de iniciar la Fase 2.

### 1.1 Campo `tipo` obligatorio en el modelo de Permiso

El modelo `Permission` en BD debe agregar un campo discriminador:

```
tipo: "permiso" | "incapacidad"
```

✅ **Implementado** — el backend usa `'permiso'` como valor por defecto (no `'general'`).

### 1.2 Endpoint de Creación — Dos contratos según tipo

**Opción A (Implementada): Mismo endpoint, `tipo` en el payload**

```
POST /api/permissions/request-permission
```

| Escenario | Content-Type | Campos obligatorios |
|-----------|-------------|---------------------|
| Permiso laboral | `multipart/form-data` | `tipo: "permiso"`, `startDateTime`, `endDateTime`, `reason` |
| Incapacidad médica | `multipart/form-data` | `tipo: "incapacidad"`, `startDateTime`, `endDateTime`, `documento` (archivo), `reason` |

Reglas de validación implementadas en backend:
- Si `tipo === "incapacidad"` y no viene `documento` → responde `400 Bad Request` ✅
- Si `tipo === "permiso"` → `documentoFileName` se guarda como `null` aunque multer procese el archivo ✅
- Si `tipo` no viene o no es reconocido → se normaliza a `'permiso'` ✅

### 1.3 Endpoint de Listado — Incluir `tipo` y `attachments`

```
GET /api/permissions/get-all-requests
```

Respuesta actual (`PermitRequest`) incluye:
```
tipo: "permiso" | "incapacidad"   ✅ implementado
attachments: Array<{ name: string; type: string; url: string }> | null   ⚠️ pendiente
```

`url` debe ser una ruta autenticada para descargar el comprobante (ver 1.4).

### 1.4 Endpoint de Descarga de Comprobante (nuevo)

```
GET /api/permissions/attachment/:requestId
Authorization: Bearer <token>
```

- Devuelve el archivo binario (PDF/imagen) con headers correctos (`Content-Disposition: attachment`).
- Solo accesible para: el empleado dueño, su supervisor, y roles RRHH.
- Si la solicitud no tiene adjunto → `404`.

### 1.5 Endpoint para el Dashboard de RRHH (conexión real)

```
GET /api/permissions/reports/summary
  ?startDate=YYYY-MM-DD
  &endDate=YYYY-MM-DD
  &area=<área>        (opcional)
  &tipo=general|incapacidad|all  (opcional, default: all)
```

Respuesta esperada:
```json
{
  "summary": [
    {
      "area": string,
      "supervisor": string,
      "totalPermissions": number,
      "totalHours": number,
      "totalEmployees": number,
      "averageHoursPerPermission": number,
      "averagePermissionsPerEmployee": number
    }
  ],
  "details": [
    {
      "area": string,
      "employeeName": string,
      "employeeId": string,
      "tipo": "general" | "incapacidad",
      "totalPermissions": number,
      "totalHours": number,
      "averageHours": number,
      "pendingPermissions": number,
      "lastPermission": string,
      "weeklyPattern": { monday, tuesday, wednesday, thursday, friday }
    }
  ],
  "requests": [
    {
      "id": string,
      "employeeName": string,
      "area": string,
      "tipo": "general" | "incapacidad",
      "requestDate": string,
      "startDate": string,
      "endDate": string,
      "hours": number,
      "status": "pendiente" | "aprobada" | "rechazada",
      "approvedBy": string,
      "reason": string,          // ← este campo es el que falta en el Excel actual
      "hasAttachment": boolean
    }
  ]
}
```

### 1.6 Endpoints de Gestión de Estado (para Fase 4 — Extras)

```
PATCH /api/permissions/:id/approve   { approverComment?: string }
PATCH /api/permissions/:id/reject    { approverComment: string  }  ← obligatorio
```

Responde con el objeto `PermitRequest` actualizado incluyendo el nuevo `status`.

---

## Fase 2 — Hoja de Ruta del Frontend

> Prerequisito: Backend completó los contratos de Fase 1.

### 2.1 Separar el formulario en dos flujos dentro de la pestaña "Permisos"

**Paso 1 — Agregar un selector de tipo al inicio del formulario**  
Antes de todos los campos, colocar un selector visible (p.ej. dos botones/tabs internos):
- `Permiso General` — ícono de reloj
- `Incapacidad Médica` — ícono de cruz/medical

El estado `permitType: "permiso" | "incapacidad"` controla qué campos se muestran.
> ⚠️ Usar `"permiso"` (no `"general"`) — es el valor que el backend persiste y devuelve.

**Paso 2 — Condicionar los campos según `permitType`**

| Campo | Permiso (`"permiso"`) | Incapacidad (`"incapacidad"`) |
|-------|---------|-------------|
| Fecha única (`DatePicker`) | ✅ visible | ❌ oculto |
| Hora inicio / fin (`TimePicker`) | ✅ visible | ❌ oculto |
| Rango de fechas (`VacationCalendar` o nuevo `DateRangePicker`) | ❌ oculto | ✅ visible |
| Motivo (`reason` input) | ✅ visible | ✅ visible |
| Comentarios detallados (`RichTextEditor`) | ✅ visible | ✅ visible |
| Adjunto (`FileUpload`) | ❌ oculto | ✅ visible + obligatorio |

**Paso 3 — Actualizar la condición `canShowPermitPreview`**

Actualmente: `permitDate && startTime && endTime && reason && isTimeRangeValid()`

Nueva lógica:
- Si `tipo === "permiso"`: misma condición actual (sin adjunto)
- Si `tipo === "incapacidad"`: `incapacidadStartDate && incapacidadEndDate && reason && files.length > 0`

El botón "Vista previa" debe permanecer deshabilitado para incapacidad si no hay archivo seleccionado. Mostrar un mensaje de error inline (como el de validación de horas) cuando el usuario intente avanzar sin adjunto.

### 2.2 Actualizar `PermitPreview` para soportar ambos tipos

**Paso 4 — Extender la interfaz `data` del componente**

```
data: {
  tipo: "permiso" | "incapacidad"
  // Para tipo "permiso":
  date?: Date
  startTime?: string
  endTime?: string
  // Para tipo "incapacidad":
  incapacidadStartDate?: Date
  incapacidadEndDate?: Date
  // Comunes:
  reason: string
  comments: string
  files: File[]
}
```

**Paso 5 — Renderizado condicional en `PermitPreview`**
- Si `tipo === "permiso"`: mostrar fecha + horario (layout actual).
- Si `tipo === "incapacidad"`: mostrar "Período de incapacidad: DD/MM/YYYY — DD/MM/YYYY" + sección de adjuntos obligatorios con label "Comprobante médico".

**Paso 6 — Actualizar `handleSubmit` en `PermitPreview`**
- Agregar `tipo` al `FormData` en todos los casos.
- Si `tipo === "incapacidad"`: construir `startDate`/`endDate` como fecha completa (sin hora); el campo de tiempo no aplica.
- Si `tipo === "permiso"` y no hay archivo: no agregar `documento` al FormData (comportamiento actual, solo formalizar).

### 2.3 Actualizar `RequestsTable` para mostrar el tipo

**Paso 7 — Agregar columna "Tipo" en la tabla**
- Vista desktop: nueva columna entre "Fecha/Horario" y "Motivo y Comentarios".
- Usar un `Badge` de color para distinguir: `"permiso"` → azul / `"incapacidad"` → naranja/rojo.

**Paso 8 — Mostrar ícono de adjunto descargable**
- En las filas donde `attachments?.length > 0`, mostrar un ícono de descarga.
- Al hacer click, usar la URL del adjunto (endpoint 1.4) para abrir/descargar el archivo.
- No romper el flujo del click en la fila (usar `e.stopPropagation()` en el botón de descarga).

**Paso 9 — Actualizar interfaz `PermitRequest` en el componente**
Agregar los campos `tipo` y validar que `attachments` se muestre condicionalmente solo para incapacidades.

### 2.4 Limpieza de estado al cambiar de tipo

**Paso 10 — Resetear campos irrelevantes al cambiar `permitType`**
Cuando el usuario cambia de "General" a "Incapacidad" (o viceversa):
- Limpiar los campos del otro flujo (fechas, horas, archivos del tipo anterior).
- Limpiar `reason` y `comments` si se considera conveniente (quizás no, para no perder texto).

---

## Fase 3 — Flujo del Dashboard y Exportación

> Prerequisito: Backend completó el endpoint `GET /api/permissions/reports/summary` (Fase 1.5).

### 3.1 Conectar `permissions-dashboard.tsx` a datos reales

**Paso 11 — Reemplazar los mocks con llamadas a API**

El componente `PermissionsDashboard` actualmente usa `permissionsData`, `permissionsData2` y `permissionRequests` como constantes locales hardcodeadas.

Plan de migración:
1. Crear un estado local `reportData` (o un hook `usePermissionsReport(filters)`).
2. Al montar el componente, llamar a `GET /api/permissions/reports/summary` con los filtros actuales.
3. Mapear la respuesta a las estructuras que las visualizaciones ya esperan (`summary`, `details`, `requests`).
4. Mientras carga, mostrar skeletons (ya existe el patrón en el proyecto — ver `useTicketQueries`).

**Paso 12 — Agregar filtros activos de fecha y área**
El dashboard ya tiene UI para filtros (ver componente Search/Filter). Conectar esos controles al estado de filtros para que disparen una nueva llamada a la API al cambiar.

### 3.2 Agregar "Motivo de Permiso" al reporte Excel

**Paso 13 — La columna "Motivo" ya existe en el código**

En `exportToExcel` (línea ~710 de `permissions-dashboard.tsx`), la hoja "Permisos Aprobados" ya define:
```
{ header: "Motivo", width: 40 }
```
Y en la iteración (línea ~725), ya se incluye `req.reason`.

El problema es que `permissionRequests` es mock y `req.reason` puede estar vacío/undefined en los datos reales si el backend no lo devuelve. Acción:
1. Asegurarse que el endpoint `reports/summary` devuelva `reason` en cada item del array `requests` (ver contrato 1.5).
2. Una vez conectado a datos reales (Paso 11), la columna "Motivo" funcionará automáticamente.

**No se necesita modificar la estructura del Excel** — solo conectar el data source real.

### 3.3 Agregar columna "Tipo de Permiso" al Excel

**Paso 14 — Nueva columna "Tipo" en la hoja "Permisos Aprobados"**

Agregar entre las columnas existentes:
```
{ header: "Tipo", width: 18 }  // "Permiso General" | "Incapacidad Médica"
```
Y en la fila:
```
req.tipo === "incapacidad" ? "Incapacidad Médica" : "Permiso General"
```

### 3.4 Permitir a RRHH descargar comprobantes de incapacidad

**Paso 15 — Columna/acción "Comprobante" en la UI del dashboard**

En la tabla de `permissionRequests` del dashboard, agregar:
- Una columna "Comprobante" con un ícono de descarga cuando `req.hasAttachment === true`.
- Al hacer click, navegar/fetch a `GET /api/permissions/attachment/:requestId` con el token del administrador.
- Si `hasAttachment === false`, mostrar "—" o ningún control.

**Paso 16 — Celda "Comprobante" en el Excel**

En la hoja "Permisos Aprobados" del Excel:
- Agregar columna `{ header: "Tiene Comprobante", width: 20 }`.
- Valor: `"Sí"` / `"No"` según `req.hasAttachment`.
- Opcionalmente: si el backend puede devolver URLs públicas con firma temporal (presigned URLs), escribir la URL como hipervínculo en la celda Excel usando `cell.value = { text: 'Ver archivo', hyperlink: url }` (ExcelJS lo soporta).

---

## Análisis de Viabilidad — Extras de Mejora

### Extra 1: Manejo de estados (Pendiente / Aprobado / Rechazado)

**¿Es viable con el código actual?**  
**Parcialmente.** La interfaz `PermitRequest` ya tiene `status: "pendiente" | "aprobada" | "rechazada"` y el componente `RequestStatusBadge` ya renderiza los tres estados con color diferenciado. La tabla y el modal de detalle (`RequestDetailsModal`) ya consumen este campo.

**¿Qué falta?**
- El backend necesita los endpoints `PATCH /:id/approve` y `PATCH /:id/reject` (Fase 1.6).
- El frontend necesita identificar si el usuario tiene rol de supervisor/RRHH para mostrar botones de acción en `RequestDetailsModal`. Actualmente no hay lógica de permisos por rol en esa vista.
- **Contexto faltante requerido:** Esquema del JWT / sesión para saber qué roles vienen en `session.user`. Con eso se puede planificar la capa de autorización en el frontend.

**Estimación de complejidad:** Media — la UI de estados ya está construida, el gap es el rol + los endpoints de acción.

### Extra 2: Límites dinámicos (días disponibles)

**¿Es viable con el código actual?**  
**Sí para vacaciones, No completamente para permisos.**

Para vacaciones, ya existe: `GET /api/permissions/vacation-days` → `{ diasVacaciones }`, y `VacationCalendar` recibe `availableDays` como prop y puede mostrar advertencia.

Para permisos, no existe actualmente ningún concepto de "límite de horas/días de permiso general" ni de "días de incapacidad cubiertos". Esto requiere:
1. Saber qué política aplica en Infarma (¿cuántos días de permiso general por año? ¿hay tope de incapacidades?).
2. Un endpoint que devuelva los saldos disponibles por tipo: `/api/permissions/balances` → `{ generalHoursAvailable, incapacidadDaysUsed, ... }`.

**Contexto faltante requerido:** Las políticas de RRHH de Infarma sobre límites de permisos generales y las reglas de incapacidad médica. Sin ese contexto no se puede definir qué validar ni cómo calcularlo en el backend.

**Estimación de complejidad:** Alta — depende completamente de la definición de las reglas de negocio.

---

## Resumen de Dependencias entre Fases

```
Fase 1 (Backend)
    │
    ├── 1.1 Campo tipo en modelo BD
    ├── 1.2 POST request-permission soporta tipo + validación
    ├── 1.3 GET get-all-requests devuelve tipo + attachments
    ├── 1.4 GET attachment/:requestId  ─────────────────────────────────┐
    └── 1.5 GET reports/summary con reason, tipo, hasAttachment          │
                                                                         │
Fase 2 (Frontend — requiere 1.1, 1.2, 1.3)                             │
    │                                                                    │
    ├── Selector tipo en formulario                                      │
    ├── Condicionar campos por tipo                                      │
    ├── Validación adjunto obligatorio para incapacidad                  │
    ├── PermitPreview diferenciado por tipo                              │
    ├── RequestsTable con columna tipo + ícono descarga ◄────────────────┘
    └── Reset de estado al cambiar tipo
                                                                         
Fase 3 (Dashboard — requiere 1.5)
    │
    ├── Conectar mocks a API real
    ├── Columna Motivo en Excel (solo conexión, ya existe la columna)
    ├── Columna Tipo en Excel (nueva)
    └── Descarga de comprobantes desde RRHH (requiere 1.4)
```

---

## Preguntas Abiertas (Antes de Implementar)

1. **Diseño UX del selector de tipo:** ¿Dos botones tipo toggle al inicio del formulario, o un `<Select>` desplegable? ¿O directamente dos sub-tabs dentro de la pestaña Permisos?
2. **¿El formulario de incapacidad usa el calendario de vacaciones (`VacationCalendar`) para seleccionar el rango, o se crea un `DateRangePicker` independiente?** El `VacationCalendar` tiene lógica de `availableDays` que no aplica para incapacidades.
3. **Rol del supervisor en el portal de empleados:** ¿El supervisor también usa esta misma app para aprobar/rechazar? ¿O existe un portal separado?
4. **Política de límites de Infarma:** Necesaria para el Extra 2. ¿Cuántos días de permiso general al año? ¿Hay diferencia entre tipo de permiso (médico vs. personal vs. académico)?
5. **Almacenamiento de archivos:** ¿El backend ya tiene un storage configurado (S3, local, etc.) para los adjuntos, o esto también es pendiente? Afecta si las URLs del endpoint 1.4 son temporales (presigned) o permanentes.
