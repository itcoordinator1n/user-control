// === Enums ===

export type TicketStatus =
  | 'new'
  | 'classified'
  | 'assigned'
  | 'in_progress'
  | 'pending_user'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'escalated';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketType = 'incident' | 'improvement_request' | 'question';

export type MessageSenderType = 'user' | 'bot' | 'technician';

export type InterruptionReason =
  | 'colleague_question'
  | 'urgent_ticket'
  | 'meeting'
  | 'break_personal'
  | 'task_switch'
  | 'system_issue'
  | 'afk_detected'
  | 'other';

export type PomodoroPhase = 'focus' | 'short_break' | 'long_break' | 'idle';

export type RootCause =
  | 'config_error'
  | 'hardware_failure'
  | 'software_bug'
  | 'user_error'
  | 'network_issue'
  | 'permission_issue'
  | 'external_service'
  | 'capacity'
  | 'unknown';

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
  group_code: string;
  assigned_to: string | null;
  assigned_to_name?: string;
  user_name?: string;
  source_channel: 'whatsapp' | 'web';
  satisfaction_score: number | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Respuesta de GET /api/tickets/:id — incluye datos extra del grupo + log + mensajes */
export interface TicketDetail extends Ticket {
  group_status: string;
  ticket_count: number;
  status_log: TicketStatusLogEntry[];
  messages: Message[];
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
  media_metadata: Record<string, unknown> | null;
  wa_status: 'sent' | 'delivered' | 'read' | null;
  created_at: string;
}

export interface TicketSolution {
  id: string;
  ticket_id: string;
  diagnosis: string;
  solution_applied: string;
  steps: string; // markdown
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
  from_status: TicketStatus | 'none';
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
  isPaused: boolean;
  activeInterruptionId: string | null;
  pauseStartedAt: string | null;
  pauseSeconds: number;
  isAFK: boolean;
  showReturnModal: boolean;
}

// === Socket events — reflejan los eventos reales del backend ===

export interface SocketEvents {
  // Eventos de ticket (namespace /notifications)
  'ticket:created': { ticketId: string; code: string; priority: TicketPriority; category: string };
  'ticket:user-message': { ticketId: string; code: string; preview: string };
  'ticket:priority-bumped': { ticketId: string; code: string; priority: TicketPriority };
  'ticket:flagged': { ticketId: string; code: string; reason: string };
  // Notificaciones generales (namespace /notifications)
  'notify:ticket_created': { ticketId: string; code: string; priority: TicketPriority; category: string };
  'notify:ticket_assigned': { ticketId: string; code: string; technicianName: string };
  'notify:ticket_resolved': { ticketId: string; code: string };
  // Timer (namespace /timer — Fase 3)
  'timer:sync': { sessionId: string; phase: PomodoroPhase; secondsRemaining: number };
  'timer:paused': { sessionId: string; interruptionId: string; reason: InterruptionReason };
  // Admin (namespace /admin — Fase 4)
  'wa:status': { status: 'connected' | 'disconnected' | 'qr_needed' };
  'wa:qr': { qr: string };
  'rule:graduated': { ruleId: string; accuracy: number; cases: number };
}

// === API response wrappers ===

export interface CursorResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// === Taxonomía de categorías ===

export const CATEGORY_TAXONOMY: Record<string, string[]> = {
  red:            ['wifi', 'lan', 'vpn', 'internet'],
  software:       ['sap', 'office365', 'navegador', 'impresion', 'antivirus', 'erp'],
  hardware:       ['computadora', 'monitor', 'teclado_mouse', 'impresora', 'telefono'],
  accesos:        ['contrasena', 'cuenta', 'plataforma', 'correo'],
  comunicaciones: ['teams', 'correo'],
  otros:          ['consulta', 'solicitud_mejora'],
};

export const ROOT_CAUSE_LABELS: Record<RootCause, string> = {
  config_error:     'Error de configuración',
  hardware_failure: 'Falla de hardware',
  software_bug:     'Bug de software',
  user_error:       'Error del usuario',
  network_issue:    'Problema de red',
  permission_issue: 'Problema de permisos',
  external_service: 'Servicio externo',
  capacity:         'Capacidad',
  unknown:          'Desconocido',
};
