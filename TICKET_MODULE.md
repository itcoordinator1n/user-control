# Frontend — Sistema de Tickets IT

> **Archivo:** `FRONTEND.md`
> **Relacionado con:** `DATABASE.md`, `BACKEND.md`
> **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query, Socket.io-client, Recharts

---

## Estado de implementación (actualizado 2026-04-14)

### ✅ Fase 1 — Fundación — COMPLETA
- `src/types/tickets.ts` — tipos completos (incluye Fase 2, 3 y 4)
- `src/middleware.ts` — matchers + permisos para todas las rutas de tickets
- `src/lib/ticket-api.ts` — cliente REST tipado con todos los endpoints (Fases 1–4)
- `src/hooks/useTimerStore.ts` — Zustand + persist (sobrevive refresh)
- `src/hooks/useNotificationStore.ts` — Zustand sin persist
- `src/hooks/useTicketSocket.ts` — 3 hooks: `useTicketSocket`, `useTimerSocket`, `useAdminSocket`
- `src/hooks/useTicketQueries.ts` — todas las queries/mutations TanStack (Fases 1–4)
- `src/provider/QueryProvider.tsx` — inyectado en `src/app/layout.tsx`
- `src/components/tickets/NotificationCenter.tsx` — dropdown con badge
- `src/components/tickets/StatusBadge.tsx`, `PriorityBadge.tsx`, `TicketCard.tsx`

### ✅ Fase 2 — Portal usuario + Chat + Tickets — COMPLETA
- `src/app/page/tickets/` — layout, lista, detalle, steps, new, improvement, knowledge
- `src/components/tickets/ChatTimeline.tsx` — burbujas + `isReadOnly` prop
- `src/components/tickets/TicketFilters.tsx`
- `src/components/app-sidebar.tsx` — sección "Soporte IT" agregada con 4 ítems

### ✅ Fase 3 — Kanban + Pomodoro + Documentación — COMPLETA
- `src/app/page/tech/` — layout con AFKDetector + PomodoroTimer + nav
- `src/app/page/tech/page.tsx` — KanbanBoard completo con 6 columnas (new→classified→assigned→in_progress→pending_user→resolved)
- `src/app/page/tech/[id]/page.tsx` — split view Chat + SolutionEditor
- `src/components/tickets/KanbanBoard.tsx` — @dnd-kit con VALID_TRANSITIONS correctas
- `src/components/tickets/PomodoroTimer.tsx` — SVG ring + heartbeat cada 15s
- `src/components/tickets/AFKDetector.tsx` — mouse/keyboard detection
- `src/components/tickets/SolutionEditor.tsx` — auto-save 30s + finalizeSolution
- `src/components/tickets/InterruptionModal.tsx`

### ✅ Fase 4 — Admin + Gerencia + Analítica — COMPLETA
- `src/app/page/ticket-admin/tree/page.tsx` — editor visual de nodos, deploy dialog, historial de versiones
- `src/app/page/ticket-admin/shadow/page.tsx` — reglas candidatas con accuracy bar, aprobar/descartar
- `src/app/page/ticket-admin/memory/page.tsx` — inspector por User ID: perfil, Redis context, segmentos, búsqueda
- `src/app/page/ticket-admin/users/page.tsx` — plataformas, permisos por plataforma, solicitudes de autorización
- `src/app/page/ticket-mgmt/page.tsx` — KPIs (6 cards) + 5 gráficas Recharts con date filter
- `src/app/page/ticket-mgmt/interruptions/page.tsx` — tendencia, por motivo, por técnico, peores horas
- `src/app/page/ticket-mgmt/reports/page.tsx` — filtros, tabla técnicos, exportar CSV, conversaciones
- `src/app/page/ticket-mgmt/gantt/page.tsx` — timeline horizontal por técnico + tabla de sesiones
- `src/app/page/tech/stats/page.tsx` — KPIs personales, foco diario, interrupciones, top categorías

### ⚠️ Páginas placeholder (sin endpoint backend confirmado)
- `src/app/page/ticket-admin/whatsapp/page.tsx` — pendiente: socket `/admin` eventos `wa:status` + `wa:qr`
- `src/app/page/ticket-admin/queues/page.tsx` — pendiente: endpoint BullMQ monitor
- `src/app/page/ticket-admin/taxonomy/page.tsx` — pendiente: endpoint editor de taxonomía

---

## Bugs conocidos y fixes aplicados

### 1. `path: '/ws'` en socket.io → 404
**Problema:** El backend usa el path por defecto `/socket.io/`, no `/ws`.
**Fix:** Remover la opción `path` del `io()` call en `useTicketSocket.ts`.

### 2. Kanban: drag siempre muestra error "Los tickets nuevos los asigna el sistema automáticamente"
**Problema:** `over.id` de @dnd-kit es el UUID del ticket destino cuando se suelta sobre una tarjeta, no el status de la columna.
**Fix aplicado en `KanbanBoard.tsx`:**
```typescript
const VALID_STATUSES = new Set(COLUMNS.map((c) => c.id));
const toStatus = VALID_STATUSES.has(overId as TicketStatus)
  ? (overId as TicketStatus)
  : (tickets.find((t) => t.id === overId)?.status ?? fromStatus);
```

### 3. `redirect()` en client component → "Rendered more hooks than during previous render"
**Problema:** `redirect()` de `next/navigation` en client layout causa error de hooks.
**Fix:** Usar `useRouter().replace()` en `useEffect` en `/page/ticket-admin/page.tsx`.

### 4. Timer API: `session_id` / `interruption_id` en el body → 422
**Problema:** El backend resuelve la sesión activa desde el JWT; no acepta IDs en el body.
**Fix:** Remover todos los IDs de los bodies en `pauseTimerSession`, `resumeTimerSession`, etc. Solo enviar `reason`, `reason_note`, `was_automatic`.

### 5. Socket heartbeat: `'timer:heartbeat'` → evento no reconocido
**Fix:** Cambiar a `'heartbeat'` (sin prefijo) en `PomodoroTimer.tsx`.

### 6. `useTimerStore` faltaba en `useTicketSocket.ts` → TS error
**Fix aplicado:** Agregar `import { useTimerStore } from './useTimerStore'` en línea 17.

### 7. ⚠️ PENDIENTE (backend): 403 "Se requiere uno de los roles: admin, technician"
**Problema:** El JWT del usuario tiene `permissions: ["TICKET:TECH"]` pero el backend verifica `role` (string). Son dos sistemas distintos.
**Estado:** El frontend implementa correctamente el guard por `permissions[]`. El backend debe aceptar el permiso `TICKET:TECH` O incluir `role: "technician"` en el JWT.
**Afecta:** Todas las rutas `/api/tickets/*` para técnicos.

### 8. ⚠️ PENDIENTE (runtime): `(platforms ?? []).map is not a function`
**Problema:** `fetchPlatforms` está tipado como `Promise<Platform[]>` pero el backend devuelve un objeto envuelto, posiblemente `{ data: Platform[] }` o `{ platforms: Platform[] }`.
**Fix pendiente:** Verificar la respuesta real del backend y ajustar el tipo de retorno en `ticket-api.ts`:
```typescript
// Opción A — si devuelve { data: Platform[] }:
export function fetchPlatforms(token: string): Promise<{ data: Platform[] }> { ... }
// En el hook usePlatforms:
const platforms = data?.data ?? [];

// Opción B — si devuelve { platforms: Platform[] }:
export function fetchPlatforms(token: string): Promise<{ platforms: Platform[] }> { ... }
const platforms = data?.platforms ?? [];
```
Lo mismo aplica a `fetchPermissions` y `fetchAuthorizationRequests` si también devuelven objetos envueltos.

---

## Pendientes para continuar

### Backend fixes requeridos (no frontend)
1. **Auth 403**: middleware del backend debe validar `permissions: ["TICKET:TECH"]` además del string `role`.
2. **Respuesta de `/platforms`**: confirmar si devuelve array bare o `{ data: [] }` y ajustar el tipo en `ticket-api.ts` + `usePlatforms` hook.
3. **WhatsApp endpoint**: no hay endpoint documentado para el estado del bot. El socket `/admin` ya emite `wa:status` y `wa:qr` — construir la página cuando el backend confirme la ruta REST de estado inicial.
4. **BullMQ queues**: construir `/page/ticket-admin/queues` cuando haya endpoint documentado.
5. **Taxonomy editor**: construir `/page/ticket-admin/taxonomy` cuando haya endpoint CRUD de taxonomía.

### Mejoras de UX pendientes (frontend)
- Confirmación al navegar fuera de `SolutionEditor` con cambios sin guardar (`beforeunload`)
- Upload de adjuntos en `SolutionEditor` (actualmente no hay endpoint en el spec)
- Encuesta de satisfacción `SatisfactionSurvey.tsx` al cerrar ticket (endpoint no documentado)
- `WhatsAppStatus.tsx` para `/page/ticket-admin/whatsapp` con QR live via socket `/admin`

### Al retomar: cómo continuar
1. Confirmar shape de respuesta del backend para `/platforms`, `/permissions`, `/authorization-requests`
2. Corregir los tipos y el hook `usePlatforms` según la respuesta real
3. Verificar que el backend fix de auth (403) esté aplicado y testear flujo completo del técnico
4. Implementar páginas placeholder (whatsapp, queues, taxonomy) cuando el backend esté listo

---

---

## Instrucciones para IA en IDE

```
CONTEXTO: Este módulo se integra en una aplicación Next.js EXISTENTE con TypeScript.
No es un proyecto nuevo — se agregan rutas, componentes y hooks al proyecto actual.

ESTRUCTURA EXISTENTE DEL FRONTEND:
src/
├── app/
│   ├── api/auth/[...nextauth]/
│   └── page/
│       ├── (auth)/
│       ├── admin/
│       ├── dashboard/
│       ├── products/
│       ├── profile/
│       ├── vacations-permits/
│       └── ...
├── components/
├── hooks/
├── lib/
├── provider/
├── types/
middleware.ts

EL MÓDULO DE TICKETS AGREGA:
- Rutas nuevas en src/app/page/ (tickets/, tech/, ticket-admin/, ticket-mgmt/)
- Componentes en src/components/tickets/
- Hooks en src/hooks/ (prefijo useTicket* o usePomodoro*)
- Types en src/types/tickets.ts

REGLAS DE CÓDIGO:
1. TypeScript estricto. No usar 'any' — definir interfaces para todo.
2. Seguir el patrón del proyecto existente para layouts, providers, y middleware.
3. El módulo NO tiene login propio. Usa NextAuth de la app existente.
4. Las rutas se protegen con el middleware.ts existente (agregar matchers).
5. Componentes server (RSC) para carga inicial pesada. Client components solo para interactividad.
6. Todas las llamadas API pasan por TanStack Query con cache + invalidación por socket.
7. Estado global mínimo con Zustand. Solo para: auth, timer, notificaciones, socket connection.
8. Forms con React Hook Form + Zod (schemas compartidos con backend en types/).
9. Estilos con Tailwind CSS. No CSS modules ni styled-components.
10. Socket.io-client se conecta desde un hook reutilizable. Las reconexiones son automáticas.
11. Componentes de UI reutilizables: usar los que ya existen en el proyecto. Solo crear nuevos si no hay equivalente.
12. Todas las rutas de API del backend están bajo: /api/tickets/...
13. NO usar localStorage para el timer — usar Zustand con persist middleware.

AL GENERAR COMPONENTES:
- Un archivo por componente. Nombre en PascalCase.
- Props tipadas con interface (no type alias).
- Exports nombrados (no default) excepto para pages (default export obligatorio).
- Hooks custom en archivos separados con prefijo 'use'.
- Los componentes del módulo de tickets van en src/components/tickets/.
- Los tipos del módulo van en src/types/tickets.ts.
```

---

## Estructura del módulo en el frontend

```
src/
├── app/page/
│   ├── tickets/                              ← Portal del usuario final
│   │   ├── layout.tsx                        ← Layout con sidebar/header del portal
│   │   ├── page.tsx                          ← Lista "Mis tickets"
│   │   ├── [id]/
│   │   │   ├── page.tsx                      ← Detalle del ticket + ChatTimeline (solo lectura)
│   │   │   └── steps/
│   │   │       └── page.tsx                  ← "Ver pasos" — solución documentada
│   │   ├── new/
│   │   │   └── page.tsx                      ← Nueva solicitud (incidencia desde web)
│   │   ├── improvement/
│   │   │   └── page.tsx                      ← Solicitud de mejora
│   │   └── knowledge/
│   │       └── page.tsx                      ← Knowledge base pública (soluciones reutilizables)
│   │
│   ├── tech/                                 ← Dashboard del técnico
│   │   ├── layout.tsx                        ← Layout con sidebar + NotificationCenter + TimerHeader
│   │   ├── page.tsx                          ← Kanban board
│   │   ├── [id]/
│   │   │   └── page.tsx                      ← Split view: Chat + Documentación en vivo + Timer
│   │   └── stats/
│   │       └── page.tsx                      ← Analítica personal: focus vs interrupciones
│   │
│   ├── ticket-admin/                         ← Panel de administración IT
│   │   ├── layout.tsx
│   │   ├── tree/
│   │   │   └── page.tsx                      ← Editor visual del árbol de decisión
│   │   ├── shadow/
│   │   │   └── page.tsx                      ← Reglas candidatas: métricas + aprobar/rechazar
│   │   ├── whatsapp/
│   │   │   └── page.tsx                      ← Estado del bot WhatsApp + QR live
│   │   ├── queues/
│   │   │   └── page.tsx                      ← Monitor de colas BullMQ
│   │   ├── memory/
│   │   │   └── page.tsx                      ← Inspector de conversaciones y memoria
│   │   ├── taxonomy/
│   │   │   └── page.tsx                      ← Editor del vocabulario controlado
│   │   └── users/
│   │       └── page.tsx                      ← Gestión de permisos y recursos
│   │
│   └── ticket-mgmt/                          ← Dashboard de gerencia
│       ├── layout.tsx
│       ├── page.tsx                          ← KPIs + alertas + overview
│       ├── gantt/
│       │   └── page.tsx
│       ├── reports/
│       │   └── page.tsx
│       └── interruptions/
│           └── page.tsx                      ← Análisis de tiempo perdido por interrupciones
│
├── components/tickets/
│   ├── ChatTimeline.tsx                      ← Historial de chat en burbujas
│   ├── PomodoroTimer.tsx                     ← Timer circular con interrupciones
│   ├── InterruptionModal.tsx                 ← Modal de razón al pausar (botones rápidos)
│   ├── ReturnFromAFKModal.tsx                ← Modal al volver de AFK
│   ├── InterruptionChart.tsx                 ← Gráficos de interrupciones (Recharts)
│   ├── KanbanBoard.tsx                       ← Tablero drag-and-drop por estado
│   ├── KanbanColumn.tsx                      ← Columna individual del Kanban
│   ├── TicketCard.tsx                        ← Tarjeta de ticket en el Kanban
│   ├── StatusBadge.tsx                       ← Badge de estado con color
│   ├── PriorityBadge.tsx                     ← Badge de prioridad (P1-P4)
│   ├── SolutionEditor.tsx                    ← Editor de documentación (markdown + campos)
│   ├── SolutionSteps.tsx                     ← Vista de pasos para el usuario final
│   ├── WhatsAppStatus.tsx                    ← Indicador de conexión + QR
│   ├── MemoryInspector.tsx                   ← Visor de segmentos y perfil acumulado
│   ├── NotificationCenter.tsx                ← Dropdown de notificaciones
│   ├── AFKDetector.tsx                       ← Componente invisible que detecta AFK
│   ├── TicketFilters.tsx                     ← Filtros para lista de tickets
│   ├── TicketTimeline.tsx                    ← Timeline de cambios de estado
│   ├── NewTicketForm.tsx                     ← Form para crear ticket desde web
│   ├── ImprovementRequestForm.tsx            ← Form para solicitud de mejora
│   └── SatisfactionSurvey.tsx                ← Encuesta de satisfacción
│
├── hooks/
│   ├── ...existing...
│   ├── useTicketSocket.ts                    ← Hook para Socket.io /notifications
│   ├── useTimerSocket.ts                     ← Hook para Socket.io /timer
│   ├── useAdminSocket.ts                     ← Hook para Socket.io /admin
│   ├── usePomodoro.ts                        ← Lógica del timer Pomodoro completo
│   ├── useAFKDetection.ts                    ← Detecta inactividad + visibilitychange
│   ├── useKanbanDrag.ts                      ← Lógica de drag-and-drop con validación
│   └── useTicketQueries.ts                   ← Queries TanStack reusables para tickets
│
├── types/
│   ├── ...existing...
│   └── tickets.ts                            ← Todos los tipos del módulo
│
└── lib/
    ├── ...existing...
    └── ticket-api.ts                         ← Funciones fetch tipadas para el API de tickets
```

---

## Tipos del módulo

```typescript
// src/types/tickets.ts

// === Enums ===

export type TicketStatus =
  | 'new' | 'classified' | 'assigned' | 'in_progress'
  | 'pending_user' | 'resolved' | 'closed' | 'reopened' | 'escalated';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketType = 'incident' | 'improvement_request' | 'question';

export type MessageSenderType = 'user' | 'bot' | 'technician';

export type InterruptionReason =
  | 'colleague_question' | 'urgent_ticket' | 'meeting'
  | 'break_personal' | 'task_switch' | 'system_issue'
  | 'afk_detected' | 'other';

export type PomodoroPhase = 'focus' | 'short_break' | 'long_break' | 'idle';

export type RootCause =
  | 'config_error' | 'hardware_failure' | 'software_bug'
  | 'user_error' | 'network_issue' | 'permission_issue'
  | 'external_service' | 'capacity' | 'unknown';

// === Entities ===

export interface Ticket {
  id: string;
  code: string;
  type: TicketType;
  user_id: string;
  category: string;
  subcategory: string;
  problem_type: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  ai_confidence: number | null;
  group_id: string;
  assigned_to: string | null;
  assigned_to_name?: string;       // joined from user service
  user_name?: string;              // joined from user service
  source_channel: 'whatsapp' | 'web';
  satisfaction_score: number | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  ticket_id: string | null;
  direction: 'inbound' | 'outbound';
  sender_type: MessageSenderType;
  sender_id: string;
  sender_name?: string;
  channel: 'whatsapp' | 'web';
  content_text: string | null;
  content_type: 'text' | 'image' | 'document' | 'audio' | 'video';
  media_url: string | null;
  wa_status: 'sent' | 'delivered' | 'read' | null;
  created_at: string;
}

export interface TicketSolution {
  id: string;
  ticket_id: string;
  diagnosis: string;
  solution_applied: string;
  steps: string;                    // markdown
  root_cause: RootCause;
  is_reusable: boolean;
  is_draft: boolean;
  attachments: Array<{ url: string; name: string; type: string }> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkSession {
  id: string;
  ticket_id: string;
  technician_id: string;
  type: PomodoroPhase;
  planned_seconds: number;
  actual_focus_seconds: number;
  total_pause_seconds: number;
  interruption_count: number;
  started_at: string;
  ended_at: string | null;
  was_completed: boolean;
  pomodoro_sequence: number;
}

export interface Interruption {
  id: string;
  session_id: string;
  ticket_id: string;
  reason: InterruptionReason;
  reason_note: string | null;
  was_automatic: boolean;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

export interface PomodoroConfig {
  focus_seconds: number;
  short_break_seconds: number;
  long_break_seconds: number;
  long_break_after: number;
  auto_start_break: boolean;
  sound_enabled: boolean;
  sound_volume: number;
  afk_timeout_seconds: number;
}

export interface TicketStatusLogEntry {
  id: string;
  from_status: TicketStatus;
  to_status: TicketStatus;
  changed_by: string;
  changed_by_name?: string;
  change_source: 'manual' | 'automatic' | 'escalation' | 'bot';
  reason: string | null;
  created_at: string;
}

export interface NotificationInbox {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ConversationSegment {
  id: string;
  topic: string;
  summary: string;
  message_count: number;
  first_msg_at: string;
  last_msg_at: string;
  ticket_id: string | null;
}

// === Store types ===

export interface TimerState {
  phase: PomodoroPhase;
  isRunning: boolean;
  activeSessionId: string | null;
  activeTicketId: string | null;
  activeTicketCode: string | null;
  secondsRemaining: number;
  pomodoroSequence: number;
  totalPomodorosToday: number;
  // Interruption state
  isPaused: boolean;
  activeInterruptionId: string | null;
  pauseStartedAt: string | null;
  pauseSeconds: number;            // contador visible de tiempo en pausa
  // AFK
  isAFK: boolean;
  showReturnModal: boolean;
}

// === Socket events ===

export interface SocketEvents {
  'ticket:created': { ticketId: string; code: string; priority: TicketPriority; category: string };
  'ticket:assigned': { ticketId: string; code: string; title: string; priority: TicketPriority };
  'ticket:status_changed': { ticketId: string; code: string; fromStatus: TicketStatus; toStatus: TicketStatus };
  'ticket:message': { ticketId: string; preview: string; senderType: MessageSenderType };
  'ticket:escalated': { ticketId: string; code: string; level: string };
  'group:activated': { groupId: string; code: string; count: number; category: string };
  'timer:sync': { sessionId: string; phase: PomodoroPhase; secondsRemaining: number };
  'timer:paused': { sessionId: string; interruptionId: string; reason: InterruptionReason };
  'wa:status': { status: 'connected' | 'disconnected' | 'qr_needed' };
  'wa:qr': { qr: string };
  'rule:graduated': { ruleId: string; accuracy: number; cases: number };
}
```

---

## Zustand stores

```typescript
// src/hooks/useTimerStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimerState, PomodoroPhase, InterruptionReason } from '@/types/tickets';

interface TimerActions {
  startFocus: (ticketId: string, ticketCode: string, sessionId: string, seconds: number) => void;
  tick: () => void;
  pause: (interruptionId: string, reason: InterruptionReason) => void;
  resume: () => void;
  completeCycle: () => void;
  switchTicket: (newTicketId: string, newTicketCode: string, newSessionId: string) => void;
  setAFK: (isAFK: boolean) => void;
  showReturn: () => void;
  discardAFK: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      // Initial state
      phase: 'idle',
      isRunning: false,
      activeSessionId: null,
      activeTicketId: null,
      activeTicketCode: null,
      secondsRemaining: 0,
      pomodoroSequence: 1,
      totalPomodorosToday: 0,
      isPaused: false,
      activeInterruptionId: null,
      pauseStartedAt: null,
      pauseSeconds: 0,
      isAFK: false,
      showReturnModal: false,

      startFocus: (ticketId, ticketCode, sessionId, seconds) => set({
        phase: 'focus',
        isRunning: true,
        activeSessionId: sessionId,
        activeTicketId: ticketId,
        activeTicketCode: ticketCode,
        secondsRemaining: seconds,
        isPaused: false,
      }),

      tick: () => {
        const state = get();
        if (!state.isRunning || state.isPaused) return;
        if (state.secondsRemaining <= 0) return;
        set({ secondsRemaining: state.secondsRemaining - 1 });
      },

      pause: (interruptionId, reason) => set({
        isPaused: true,
        activeInterruptionId: interruptionId,
        pauseStartedAt: new Date().toISOString(),
        pauseSeconds: 0,
      }),

      resume: () => set({
        isPaused: false,
        activeInterruptionId: null,
        pauseStartedAt: null,
        pauseSeconds: 0,
      }),

      completeCycle: () => set((state) => ({
        isRunning: false,
        phase: 'idle',
        secondsRemaining: 0,
        totalPomodorosToday: state.totalPomodorosToday + 1,
        pomodoroSequence: state.pomodoroSequence >= 4 ? 1 : state.pomodoroSequence + 1,
      })),

      switchTicket: (newTicketId, newTicketCode, newSessionId) => set({
        activeSessionId: newSessionId,
        activeTicketId: newTicketId,
        activeTicketCode: newTicketCode,
        isPaused: false,
        activeInterruptionId: null,
      }),

      setAFK: (isAFK) => set({ isAFK }),

      showReturn: () => set({ showReturnModal: true }),

      discardAFK: () => set({
        isPaused: false,
        activeInterruptionId: null,
        pauseStartedAt: null,
        pauseSeconds: 0,
        showReturnModal: false,
        isAFK: false,
      }),

      reset: () => set({
        phase: 'idle', isRunning: false, activeSessionId: null,
        activeTicketId: null, activeTicketCode: null, secondsRemaining: 0,
        isPaused: false, activeInterruptionId: null,
        pauseStartedAt: null, pauseSeconds: 0,
        isAFK: false, showReturnModal: false,
      }),
    }),
    {
      name: 'ticket-timer-store',
      // Persist para que el timer sobreviva refresh/tabs
    }
  )
);
```

---

## Frontend Fase 1 — Fundación + Auth + Layout

> **Prerequisitos BD:** DB Fase 1 creada.
> **Prerequisitos Backend:** Backend Fase 1 completa (CRUD tickets + sockets setup).
> **Requerido por:** Frontend Fase 2.

### Qué se construye

1. **Route groups**: `tickets/`, `tech/`, `ticket-admin/`, `ticket-mgmt/` con layouts
2. **middleware.ts**: agregar matchers para rutas nuevas
3. **Types**: `src/types/tickets.ts` completo
4. **Socket hook**: `useTicketSocket.ts` — conexión + reconexión + auth
5. **API client**: `src/lib/ticket-api.ts` — funciones fetch tipadas
6. **TanStack Query**: provider (si no existe), queries base para tickets
7. **Zustand stores**: `useTimerStore`, `useNotificationStore`
8. **Componentes base**: `StatusBadge`, `PriorityBadge`, `TicketCard`, `NotificationCenter` (shell)
9. **Layout del técnico**: sidebar con navegación + header con timer placeholder

### middleware.ts — agregar matchers

```typescript
// Agregar a la configuración existente del middleware.ts:
export const config = {
  matcher: [
    // ...existing matchers...
    '/page/tickets/:path*',
    '/page/tech/:path*',
    '/page/ticket-admin/:path*',
    '/page/ticket-mgmt/:path*',
  ],
};

// En la lógica del middleware, verificar rol para rutas restringidas:
// /page/tech/* → solo rol 'technician' o 'admin'
// /page/ticket-admin/* → solo rol 'admin'
// /page/ticket-mgmt/* → solo rol 'manager' o 'admin'
// /page/tickets/* → cualquier usuario autenticado
```

### Socket hook base

```typescript
// src/hooks/useTicketSocket.ts
'use client';

import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useTicketSocket(namespace: string = '/notifications') {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const socket: Socket = useMemo(() => {
    return io(`${API_URL}${namespace}`, {
      path: '/ws',
      auth: { token: session?.accessToken },
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });
  }, [namespace, session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) return;
    socket.connect();
    return () => { socket.disconnect(); };
  }, [socket, session?.accessToken]);

  // Auto-invalidar queries por evento
  useEffect(() => {
    socket.on('ticket:created', () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    });
    socket.on('ticket:status_changed', ({ ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    });
    socket.on('ticket:message', ({ ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', ticketId] });
    });
    socket.on('ticket:assigned', () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    });

    return () => { socket.removeAllListeners(); };
  }, [socket, queryClient]);

  return socket;
}
```

---

## Frontend Fase 2 — Portal usuario + Chat + Tickets

> **Prerequisitos Backend:** Backend Fase 2 completa (WhatsApp + IA + mensajes).
> **Prerequisitos Frontend:** Frontend Fase 1 completa.

### Qué se construye

1. **Portal `/page/tickets`**: lista de tickets del usuario con filtros y estados
2. **Detalle `/page/tickets/[id]`**: info del ticket + ChatTimeline (solo lectura) + tabs
3. **Ver pasos `/page/tickets/[id]/steps`**: solución documentada visible
4. **Nueva solicitud `/page/tickets/new`**: form para crear ticket desde web
5. **Solicitud de mejora `/page/tickets/improvement`**: form dedicado
6. **Knowledge base `/page/tickets/knowledge`**: soluciones reutilizables buscables
7. **ChatTimeline component**: burbujas de chat por sender_type
8. **NotificationCenter**: funcional con toasts + badge

### ChatTimeline — componente

```typescript
// src/components/tickets/ChatTimeline.tsx
'use client';

import type { Message } from '@/types/tickets';

interface ChatTimelineProps {
  messages: Message[];
  isReadOnly?: boolean;           // true para portal usuario
  onSendReply?: (text: string) => void;  // solo para técnico
}

/**
 * Muestra el historial de mensajes en formato chat.
 *
 * REGLAS DE DISEÑO:
 * - Mensajes del usuario: alineados a la izquierda, fondo gris claro
 * - Mensajes del bot: alineados a la derecha, fondo azul suave
 * - Mensajes del técnico: alineados a la derecha, fondo azul fuerte + nombre visible
 * - Las imágenes se muestran como thumbnail clickable (abre DO Spaces URL en nueva tab)
 * - wa_status se muestra como ✓ (sent), ✓✓ (delivered), ✓✓ azul (read)
 * - Scroll automático al último mensaje
 * - Scroll infinito hacia arriba para historial largo (paginación cursor-based)
 * - Si isReadOnly=true, no mostrar campo de respuesta. Mostrar nota: "Para comunicarte, usá WhatsApp."
 * - Si isReadOnly=false, mostrar campo de texto + botón "Enviar" que llama onSendReply
 */
```

### Portal usuario — página principal

```typescript
// src/app/page/tickets/page.tsx

/**
 * PÁGINA: Mis solicitudes de soporte
 *
 * LAYOUT:
 * - Header: "Mis solicitudes de soporte"
 * - Botones: [+ Nueva solicitud] [Solicitud de mejora]
 * - Lista de tickets del usuario logueado, ordenados por fecha desc
 * - Cada ticket muestra: código, categoría, prioridad (PriorityBadge), status (StatusBadge),
 *   técnico asignado (si hay), fecha, botón "Ver pasos" si tiene solución
 *
 * DATOS:
 * - GET /api/tickets?user_id={currentUser.id} via TanStack Query
 * - Se actualiza en real-time via Socket.io (ticket:status_changed)
 *
 * ACCIONES:
 * - Click en ticket → navega a /page/tickets/[id]
 * - [+ Nueva solicitud] → navega a /page/tickets/new
 * - [Solicitud de mejora] → navega a /page/tickets/improvement
 * - [Ver pasos] → navega a /page/tickets/[id]/steps
 */
```

### Detalle del ticket — usuario

```typescript
// src/app/page/tickets/[id]/page.tsx

/**
 * PÁGINA: Detalle del ticket (vista usuario final)
 *
 * LAYOUT:
 * - Header: código + categoría
 * - Info: estado, prioridad, técnico asignado, fechas
 * - Tabs: [Historial de chat] [Ver pasos]
 *
 * TAB "Historial de chat":
 * - ChatTimeline con isReadOnly=true
 * - Muestra todos los mensajes del ticket: usuario, bot, técnico
 * - NO permite enviar mensajes. Nota: "Para comunicarte, usá WhatsApp."
 *
 * TAB "Ver pasos":
 * - Si hay solución (ticket_solutions con is_draft=false):
 *   Muestra: diagnóstico, pasos en markdown renderizado, causa raíz
 * - Si no hay solución aún: "La solución aún no está documentada."
 *
 * DATOS:
 * - GET /api/tickets/{id} para info del ticket
 * - GET /api/tickets/messages?ticket_id={id} para mensajes
 * - GET /api/tickets/{id}/solution para solución (si existe)
 */
```

### Knowledge base — soluciones públicas

```typescript
// src/app/page/tickets/knowledge/page.tsx

/**
 * PÁGINA: Documentación de soluciones
 *
 * LAYOUT:
 * - Header: "Base de conocimiento"
 * - Barra de búsqueda (fulltext)
 * - Filtros: categoría, causa raíz
 * - Lista de soluciones reutilizables (is_reusable=true, is_draft=false)
 * - Cada entrada muestra: título (derivado del ticket), diagnóstico breve, categoría, causa raíz,
 *   veces referenciada, botón "Ver pasos"
 *
 * OBJETIVO: El usuario busca si su problema ya tiene solución documentada ANTES de crear un ticket.
 *
 * DATOS:
 * - GET /api/tickets/knowledge?q={search}&category={cat} via TanStack Query
 */
```

---

## Frontend Fase 3 — Kanban + Pomodoro + Documentación

> **Prerequisitos Backend:** Backend Fase 3 completa (Timer + interruptions + escalation).
> **Prerequisitos Frontend:** Frontend Fase 2 completa.

### Qué se construye

1. **Kanban board `/page/tech`**: drag-and-drop por estado con reglas de transición
2. **Vista ticket técnico `/page/tech/[id]`**: split view con chat + documentación + timer
3. **PomodoroTimer**: anillo circular + contador de pausa + audio
4. **InterruptionModal**: botones rápidos de razón al pausar
5. **ReturnFromAFKModal**: modal al volver de inactividad
6. **AFKDetector**: componente invisible que detecta inactividad
7. **SolutionEditor**: editor de documentación en vivo con auto-save
8. **Analítica `/page/tech/stats`**: gráficos de focus vs interrupciones

### Kanban board

```typescript
// src/components/tickets/KanbanBoard.tsx

/**
 * COMPONENTE: Tablero Kanban de tickets del técnico
 *
 * COLUMNAS (en orden):
 * 1. "Nuevos" (new) — solo visible, no droppable por el técnico
 * 2. "Asignados" (assigned) — tickets asignados al técnico
 * 3. "En progreso" (in_progress) — ticket con trabajo activo + timer posible
 * 4. "Esperando usuario" (pending_user) — esperando confirmación
 * 5. "Resueltos" (resolved) — cerrados, con documentación completa
 *
 * REGLAS DE DRAG-AND-DROP:
 * - assigned → in_progress: válido. Al soltar, ofrecer iniciar Pomodoro.
 * - in_progress → pending_user: válido SOLO si tiene al menos un borrador de solución.
 * - in_progress → assigned: válido pero requiere razón (modal).
 * - pending_user → in_progress: válido (usuario dice que no está resuelto).
 * - pending_user → resolved: BLOQUEADO si ticket_solutions.is_draft=true o no existe.
 * - resolved: no se puede mover fuera (estado final para el técnico).
 * - Cualquier otro movimiento: mostrar toast de error con explicación.
 *
 * VISUAL:
 * - La tarjeta en "En progreso" muestra el timer Pomodoro activo si está corriendo.
 * - Badge de pomodoros completados (🍅 × N) en las tarjetas trabajadas.
 * - Badge de interrupciones en la tarjeta actual.
 * - Contador de tickets por columna en el header.
 * - Se actualiza en real-time via Socket.io (ticket:status_changed, ticket:assigned).
 *
 * LIBRERÍA: @dnd-kit/core + @dnd-kit/sortable para drag-and-drop.
 */
```

### Vista de ticket del técnico — split view

```typescript
// src/app/page/tech/[id]/page.tsx

/**
 * PÁGINA: Ticket abierto (vista técnico)
 *
 * LAYOUT (split horizontal):
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ← Tablero    IT-2024-00342 | P2 | WiFi    🍅 18:23 | ⏸    │
 * ├─────────────────────────────┬────────────────────────────────┤
 * │                             │                                │
 * │   PANEL IZQUIERDO           │   PANEL DERECHO                │
 * │   Historial de chat         │   Documentación en vivo        │
 * │   (ChatTimeline con         │   (SolutionEditor)             │
 * │    isReadOnly=false)        │                                │
 * │                             │   - Diagnóstico [textarea]     │
 * │   El técnico puede:         │   - Solución [textarea]        │
 * │   - Ver todos los mensajes  │   - Pasos [markdown editor]    │
 * │   - Enviar mensaje al       │   - Causa raíz [select]        │
 * │     usuario (→ WhatsApp)    │   - ¿Reutilizable? [toggle]    │
 * │                             │   - Adjuntos [upload]          │
 * │                             │                                │
 * │                             │   [Guardar borrador] auto c/30s│
 * │                             │   [Marcar como resuelto] *     │
 * │                             │                                │
 * ├─────────────────────────────┴────────────────────────────────┤
 * │  CONTEXTO: Área: Contabilidad | Equipo: HP G7 | OS: Win 11  │
 * │  Tickets previos: 3 | Grupo: G-0047 (5 afectados)           │
 * └──────────────────────────────────────────────────────────────┘
 *
 * * "Marcar como resuelto" solo aparece cuando:
 *   - Diagnóstico, solución, pasos y causa raíz están llenos
 *   - is_draft se pone en false
 *   - Hace PATCH /api/tickets/{id}/status con to_status='resolved'
 *   - Si la validación del backend falla (documentación incompleta), se muestra toast de error
 *
 * TIMER:
 * - El PomodoroTimer está en el header, siempre visible.
 * - Si el técnico llegó aquí desde el Kanban (drag a in_progress), el timer puede estar corriendo.
 * - Si no hay timer activo, mostrar botón "Iniciar Pomodoro" en el header.
 * - Al pausar: InterruptionModal aparece.
 * - Al detectar AFK: se pausa automáticamente. Al volver: ReturnFromAFKModal.
 *
 * AUTO-SAVE:
 * - SolutionEditor hace POST/PATCH /api/tickets/{id}/solution cada 30 segundos si hubo cambios.
 * - Indicador visual: "Guardado ✓" o "Guardando..." o "Sin guardar".
 * - Al navegar fuera: si hay cambios sin guardar, confirmar con el usuario.
 */
```

### PomodoroTimer

```typescript
// src/components/tickets/PomodoroTimer.tsx

/**
 * COMPONENTE: Timer Pomodoro circular
 *
 * VISUAL:
 * - Anillo SVG circular que se vacía conforme pasa el tiempo
 * - Centro: minutos:segundos
 * - Debajo del anillo: código del ticket vinculado + fase actual
 * - Badge: pomodoro actual de la serie (ej: 3/4)
 * - CUANDO ESTÁ PAUSADO:
 *   - El anillo cambia de color (rojo/naranja)
 *   - Aparece un segundo contador: "Pausa: 2:34" que sube
 *   - La razón de la pausa se muestra debajo
 *
 * CONTROLES:
 * - Botón Play/Pause principal
 * - Al pausar → abre InterruptionModal para seleccionar razón
 * - Al completar ciclo → sonido (Web Audio API: 880→1100→1320 Hz)
 *   → POST /api/tickets/timer/complete
 *   → inicia break automáticamente (si auto_start_break=true)
 *
 * ESTADO:
 * - Lee y escribe en useTimerStore (Zustand con persist)
 * - Cada segundo: tick() en un useEffect con setInterval
 * - Heartbeat: cada 15s envía timer:heartbeat via Socket.io /timer
 *
 * AFK:
 * - AFKDetector corre en paralelo
 * - Al detectar AFK: POST /api/tickets/timer/pause con reason='afk_detected', was_automatic=true
 * - Al volver: ReturnFromAFKModal pregunta si fue interrupción o seguía trabajando
 *
 * MULTI-TAB:
 * - Socket.io /timer namespace sincroniza estado entre tabs
 * - Si se abre otra tab, recibe timer:sync y actualiza el store
 */
```

### InterruptionModal

```typescript
// src/components/tickets/InterruptionModal.tsx

/**
 * COMPONENTE: Modal de razón de interrupción
 *
 * APARECE: Cuando el técnico hace click en "Pausar" en el PomodoroTimer.
 *
 * LAYOUT:
 * - Título: "¿Por qué pausás?"
 * - 6 botones grandes en grid 2×3:
 *   [👥 Colega preguntó]    [🚨 Ticket urgente]
 *   [📅 Reunión]            [☕ Pausa personal]
 *   [💻 Problema técnico]   [❓ Otro]
 * - Si selecciona "Otro": aparece input de texto para nota libre
 * - Un click en cualquier botón:
 *   1. POST /api/tickets/timer/pause con { reason }
 *   2. Actualiza useTimerStore
 *   3. Cierra el modal
 *   4. El PomodoroTimer muestra estado pausado con contador rojo
 *
 * UX: Debe ser MUY rápido. Un click y listo. No forms largos.
 */
```

### SolutionEditor

```typescript
// src/components/tickets/SolutionEditor.tsx

/**
 * COMPONENTE: Editor de documentación de solución
 *
 * CAMPOS:
 * 1. Diagnóstico (textarea) — OBLIGATORIO — ¿Cuál era el problema real?
 * 2. Solución aplicada (textarea) — OBLIGATORIO — ¿Qué se hizo?
 * 3. Pasos de solución (markdown editor) — OBLIGATORIO — Pasos numerados
 * 4. Causa raíz (select) — OBLIGATORIO — Enum de RootCause
 * 5. ¿Reutilizable? (toggle) — Si sirve para otros
 * 6. Adjuntos (file upload → DO Spaces) — Opcional
 *
 * COMPORTAMIENTO:
 * - Auto-save cada 30s si hubo cambios (POST /api/tickets/{id}/solution con is_draft=true)
 * - Indicador: "Guardado ✓" / "Guardando..." / "Sin guardar (cambios pendientes)"
 * - Botón "Guardar borrador" para guardar manualmente
 * - Botón "Marcar como resuelto" (solo si todos los campos obligatorios están llenos)
 *   → PATCH /api/tickets/{id}/solution/finalize (is_draft=false)
 *   → luego PATCH /api/tickets/{id}/status { to_status: 'resolved' }
 *   → si el backend rechaza (documentación incompleta), toast de error
 *
 * MARKDOWN:
 * - Para el campo "pasos", usar un editor simple de markdown.
 * - Preview en tiempo real al lado del editor.
 * - No necesita ser un editor full WYSIWYG — textarea con preview es suficiente.
 *
 * VALIDACIÓN (client-side):
 * - React Hook Form + Zod schema
 * - Campos obligatorios marcados visualmente
 * - Botón "Marcar como resuelto" disabled hasta que todos los campos sean válidos
 */
```

---

## Frontend Fase 4 — Admin + Gerencia + Analítica

> **Prerequisitos Backend:** Backend Fase 4 completa.
> **Prerequisitos Frontend:** Frontend Fase 3 completa.

### Qué se construye

1. **Editor del árbol `/page/ticket-admin/tree`**: canvas interactivo de nodos
2. **Shadow rules `/page/ticket-admin/shadow`**: lista de reglas candidatas con métricas
3. **WhatsApp status `/page/ticket-admin/whatsapp`**: estado + QR live
4. **Queue monitor `/page/ticket-admin/queues`**: contadores de jobs + dead letter
5. **Memory inspector `/page/ticket-admin/memory`**: buscar usuario → segmentos + perfil
6. **Taxonomy editor `/page/ticket-admin/taxonomy`**: agregar/deprecar categorías
7. **User management `/page/ticket-admin/users`**: permisos y recursos
8. **Dashboard gerencia `/page/ticket-mgmt`**: KPIs + métricas
9. **Gantt `/page/ticket-mgmt/gantt`**: diagrama de proyectos
10. **Reports `/page/ticket-mgmt/reports`**: reportes filtrables por área/categoría/período
11. **Interruptions dashboard `/page/ticket-mgmt/interruptions`**: análisis de tiempo perdido
12. **Tech stats `/page/tech/stats`**: analítica personal del técnico

### Dashboard de gerencia — KPIs

```typescript
// src/app/page/ticket-mgmt/page.tsx

/**
 * PÁGINA: Dashboard de gerencia
 *
 * LAYOUT:
 * - Top row: 4 KPI cards:
 *   1. Tickets abiertos (live counter via socket)
 *   2. SLA compliance % (tickets resueltos dentro del tiempo)
 *   3. Tiempo promedio de resolución (horas)
 *   4. Satisfacción promedio (1-5 estrellas)
 *
 * - Middle row: 2 charts:
 *   1. Volumen de tickets por día (últimos 30 días) — Line chart
 *   2. Distribución por categoría — Pie chart
 *
 * - Bottom row:
 *   1. Tickets escalados activos (tabla con detalles)
 *   2. Técnicos con mayor carga (ranking)
 *
 * - Alertas en tiempo real (via socket):
 *   - Ticket P1 sin atender > 15 min
 *   - Grupo de incidencia activado
 *   - Técnico con 3+ interrupciones en 1 hora
 *
 * DATOS:
 * - GET /api/tickets/analytics/dashboard via TanStack Query (staleTime: 5min)
 * - Sockets para live counters y alertas
 *
 * CHARTS: Recharts (ya en el stack del proyecto)
 */
```

### Analítica de interrupciones — gerencia

```typescript
// src/app/page/ticket-mgmt/interruptions/page.tsx

/**
 * PÁGINA: Análisis de tiempo perdido por interrupciones
 *
 * GRÁFICOS (Recharts):
 * 1. Stacked bar chart: focus vs pause por día (últimos 30 días) — por todo el equipo
 * 2. Pie chart: distribución de razones de interrupción — global
 * 3. Heatmap: interrupciones por hora del día y día de la semana
 * 4. Ranking: técnicos más interrumpidos
 * 5. Correlación: tickets con más interrupciones vs tiempo de resolución (scatter plot)
 *
 * FILTROS:
 * - Rango de fechas
 * - Técnico específico o todos
 * - Categoría de ticket
 *
 * MÉTRICAS CLAVE:
 * - Total horas perdidas en interrupciones esta semana
 * - Promedio de interrupciones por Pomodoro
 * - Ratio focus/pausa del equipo
 * - Costo de context-switching: cantidad de task_switch por semana
 *
 * DATOS:
 * - GET /api/tickets/analytics/interruptions via TanStack Query
 */
```

### Analítica personal del técnico

```typescript
// src/app/page/tech/stats/page.tsx

/**
 * PÁGINA: Mi productividad
 *
 * GRÁFICOS:
 * 1. Pomodoros completados: hoy / esta semana / este mes (números grandes)
 * 2. Bar chart: focus vs pause por día (últimos 14 días)
 * 3. Pie chart: mis interrupciones por razón
 * 4. Line chart: mi mejor hora de foco (GROUP BY hora, tasa de was_completed)
 * 5. Table: tiempo promedio por categoría de ticket
 * 6. Stat: ciclos completos vs interrumpidos (tasa de was_completed)
 *
 * DATOS:
 * - GET /api/tickets/analytics/technician/{myId} via TanStack Query (staleTime: 2min)
 */
```

---

## Resumen de dependencias entre fases

```
Frontend Fase 1 ←── Backend Fase 1 ←── DB Fase 1
       ↓
Frontend Fase 2 ←── Backend Fase 2
       ↓
Frontend Fase 3 ←── Backend Fase 3 ←── DB Fase 2
       ↓
Frontend Fase 4 ←── Backend Fase 4 ←── DB Fase 3
```

Cada fase de frontend requiere que la fase correspondiente de backend esté completa. Cada fase de backend requiere que la fase correspondiente de BD esté migrada. Las fases de BD pueden ejecutarse antes que todo (son solo SQL).
