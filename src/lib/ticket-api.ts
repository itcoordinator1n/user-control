/**
 * ticket-api.ts — Cliente REST tipado para el módulo de tickets.
 * Refleja exactamente los endpoints disponibles en Backend Fase 2.
 */

import type {
  Ticket,
  TicketDetail,
  TicketStatus,
  TicketType,
  TicketPriority,
  TicketStatusLogEntry,
  Message,
  TicketSolution,
  RootCause,
  NotificationInbox,
  CursorResponse,
} from '@/types/tickets';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/tickets`;

async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? err.message ?? 'API error');
  }

  return res.json() as Promise<T>;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string;
  category?: string;
  user_id?: string;
  cursor?: string;
  limit?: number;
}

export function fetchTickets(
  token: string,
  filters?: TicketFilters
): Promise<CursorResponse<Ticket>> {
  const params: Record<string, string> = {};
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params[k] = String(v);
    });
  }
  const query = new URLSearchParams(params).toString();
  return apiFetch<CursorResponse<Ticket>>(`?${query}`, token);
}

/** GET /api/tickets/:id — devuelve ticket + group info + status_log + messages */
export function fetchTicket(token: string, id: string): Promise<TicketDetail> {
  return apiFetch<TicketDetail>(`/${id}`, token);
}

export interface CreateTicketPayload {
  type: TicketType;
  category: string;
  subcategory: string;
  problem_type?: string;
  priority: TicketPriority;
  description: string;
  source_channel?: 'web';
}

export function createTicket(token: string, payload: CreateTicketPayload): Promise<Ticket> {
  return apiFetch<Ticket>('', token, {
    method: 'POST',
    body: JSON.stringify({ ...payload, source_channel: 'web' }),
  });
}

export function updateTicketStatus(
  token: string,
  id: string,
  to_status: TicketStatus,
  reason?: string
): Promise<Ticket> {
  return apiFetch<Ticket>(`/${id}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ to_status, reason }),
  });
}

export function assignTicket(
  token: string,
  id: string,
  technician_id: string
): Promise<Ticket> {
  return apiFetch<Ticket>(`/${id}/assign`, token, {
    method: 'PATCH',
    body: JSON.stringify({ technician_id }),
  });
}

export function fetchTicketLog(
  token: string,
  id: string
): Promise<TicketStatusLogEntry[]> {
  return apiFetch<TicketStatusLogEntry[]>(`/${id}/log`, token);
}

// ─── Mensajes ─────────────────────────────────────────────────────────────────

export function fetchMessages(
  token: string,
  params: { ticket_id?: string; conversation_id?: string; cursor?: string; limit?: number }
): Promise<CursorResponse<Message>> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString();
  return apiFetch<CursorResponse<Message>>(`/messages?${query}`, token);
}

export function replyToTicket(
  token: string,
  ticketId: string,
  text: string
): Promise<Message> {
  return apiFetch<Message>(`/messages/${ticketId}/reply`, token, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

// ─── Soluciones ───────────────────────────────────────────────────────────────

export interface CreateSolutionPayload {
  diagnosis: string;
  solution_applied: string;
  steps: string;
  root_cause: RootCause;
  is_reusable: boolean;
}

export function createSolution(
  token: string,
  ticketId: string,
  payload: CreateSolutionPayload
): Promise<TicketSolution> {
  return apiFetch<TicketSolution>(`/${ticketId}/solution`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function finalizeSolution(
  token: string,
  ticketId: string
): Promise<TicketSolution> {
  return apiFetch<TicketSolution>(`/${ticketId}/solution/finalize`, token, {
    method: 'PATCH',
  });
}

// ─── Knowledge base ───────────────────────────────────────────────────────────

export function fetchKnowledge(
  token: string,
  params?: { cursor?: string; limit?: number }
): Promise<CursorResponse<TicketSolution>> {
  const query = params ? new URLSearchParams(Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  )).toString() : '';
  return apiFetch<CursorResponse<TicketSolution>>(`/knowledge?${query}`, token);
}

export function searchKnowledge(
  token: string,
  q: string
): Promise<TicketSolution[]> {
  return apiFetch<TicketSolution[]>(`/knowledge/search?q=${encodeURIComponent(q)}`, token);
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export function fetchNotifications(
  token: string,
  params?: { unread_only?: boolean; limit?: number }
): Promise<NotificationInbox[]> {
  const query = params ? new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  ).toString() : '';
  return apiFetch<NotificationInbox[]>(`/notifications?${query}`, token);
}

export function markNotificationsRead(
  token: string,
  ids: string[] | 'all'
): Promise<void> {
  return apiFetch<void>('/notifications/read', token, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}

// ─── Timer ────────────────────────────────────────────────────────────────────
// Endpoints: POST body simplificado — el servidor obtiene session activa del usuario en JWT

export function startTimerSession(
  token: string,
  ticket_id: string
): Promise<import('@/types/tickets').WorkSession> {
  return apiFetch('/timer/start', token, {
    method: 'POST',
    body: JSON.stringify({ ticket_id }),
  });
}

export function pauseTimerSession(
  token: string,
  reason: import('@/types/tickets').InterruptionReason,
  reason_note?: string,
  was_automatic?: boolean
): Promise<import('@/types/tickets').Interruption> {
  return apiFetch('/timer/pause', token, {
    method: 'POST',
    body: JSON.stringify({ reason, reason_note, was_automatic }),
  });
}

export function resumeTimerSession(
  token: string
): Promise<import('@/types/tickets').Interruption> {
  return apiFetch('/timer/resume', token, { method: 'POST' });
}

export function completeTimerSession(
  token: string
): Promise<import('@/types/tickets').WorkSession> {
  return apiFetch('/timer/complete', token, { method: 'POST' });
}

export function switchTimerSession(
  token: string,
  ticket_id: string
): Promise<import('@/types/tickets').WorkSession> {
  return apiFetch('/timer/switch', token, {
    method: 'POST',
    body: JSON.stringify({ ticket_id }),
  });
}

export function discardAFKSession(token: string): Promise<void> {
  return apiFetch('/timer/discard-afk', token, { method: 'POST' });
}

export function fetchActiveSession(
  token: string
): Promise<import('@/types/tickets').WorkSession | null> {
  return apiFetch('/timer/active', token);
}

export function fetchPomodoroConfig(
  token: string
): Promise<import('@/types/tickets').PomodoroConfig> {
  return apiFetch('/timer/config', token);
}

export function updatePomodoroConfig(
  token: string,
  config: Partial<import('@/types/tickets').PomodoroConfig>
): Promise<import('@/types/tickets').PomodoroConfig> {
  return apiFetch('/timer/config', token, {
    method: 'PATCH',
    body: JSON.stringify(config),
  });
}

export function fetchTimerInterruptions(
  token: string,
  params?: { from?: string; to?: string; limit?: number }
): Promise<import('@/types/tickets').Interruption[]> {
  const query = params
    ? new URLSearchParams(Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )).toString()
    : '';
  return apiFetch(`/timer/interruptions?${query}`, token);
}

export function fetchInterruptionSummary(
  token: string,
  params?: { from?: string; to?: string }
): Promise<unknown> {
  const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiFetch(`/timer/interruptions/summary?${query}`, token);
}

// ─── Árbol de decisión ───────────────────────────────────────────────────────

export interface TreeNode {
  id: string;
  parent_id: string | null;
  question: string;
  answer_options: string[];
  result_category: string | null;
  result_subcategory: string | null;
  is_leaf: boolean;
  order: number;
}

export interface TreeVersion {
  id: string;
  root_node_id: string;
  changelog: string;
  deployed_at: string;
  deployed_by: string;
}

export interface ShadowRule {
  id: string;
  node_id: string;
  condition: string;
  predicted_category: string;
  predicted_subcategory: string;
  total_observations: number;
  correct_observations: number;
  accuracy_percent: number;
  status: 'pending' | 'approved' | 'dismissed';
  created_at: string;
}

export function fetchTree(token: string): Promise<{ nodes: TreeNode[] }> {
  return apiFetch('/tree', token);
}

export function createTreeNode(token: string, payload: Partial<TreeNode>): Promise<TreeNode> {
  return apiFetch('/tree/nodes', token, { method: 'POST', body: JSON.stringify(payload) });
}

export function updateTreeNode(token: string, id: string, payload: Partial<TreeNode>): Promise<TreeNode> {
  return apiFetch(`/tree/nodes/${id}`, token, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function deleteTreeNode(token: string, id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/tree/nodes/${id}`, token, { method: 'DELETE' });
}

export function deployTree(token: string, root_node_id: string, changelog: string): Promise<TreeVersion> {
  return apiFetch('/tree/deploy', token, { method: 'POST', body: JSON.stringify({ root_node_id, changelog }) });
}

export function fetchTreeVersions(token: string): Promise<{ versions: TreeVersion[] }> {
  return apiFetch('/tree/versions', token);
}

export function fetchShadowRules(token: string): Promise<{ rules: ShadowRule[] }> {
  return apiFetch('/tree/shadow-rules', token);
}

export function approveShadowRule(token: string, id: string): Promise<ShadowRule> {
  return apiFetch(`/tree/shadow-rules/${id}/approve`, token, { method: 'POST' });
}

export function dismissShadowRule(token: string, id: string): Promise<ShadowRule> {
  return apiFetch(`/tree/shadow-rules/${id}/dismiss`, token, { method: 'POST' });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export function fetchDashboardAnalytics(token: string, params?: DateRangeParams): Promise<unknown> {
  const q = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiFetch(`/analytics/dashboard?${q}`, token);
}

export function fetchTechnicianAnalytics(token: string, id: string, params?: DateRangeParams): Promise<unknown> {
  const q = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiFetch(`/analytics/technician/${id}?${q}`, token);
}

export function fetchInterruptionAnalytics(token: string, params?: DateRangeParams): Promise<unknown> {
  const q = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiFetch(`/analytics/interruptions?${q}`, token);
}

export function fetchConversationAnalytics(token: string, params?: DateRangeParams): Promise<unknown> {
  const q = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
  return apiFetch(`/analytics/conversations?${q}`, token);
}

export function fetchGanttAnalytics(token: string, params?: { technician_id?: string; days?: number }): Promise<unknown> {
  const q = params ? new URLSearchParams(Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  )).toString() : '';
  return apiFetch(`/analytics/gantt?${q}`, token);
}

export function fetchPatternAnalytics(token: string): Promise<unknown> {
  return apiFetch('/analytics/patterns', token);
}

// ─── Plataformas y permisos ───────────────────────────────────────────────────

export interface Platform {
  id: string;
  name: string;
  code: string;
  url: string | null;
  it_owner_id: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
}

export interface Permission {
  id: string;
  platform_id: string;
  platform_name?: string;
  name: string;
  code: string;
  description: string | null;
}

export interface UserPermission {
  permission_id: string;
  permission_name: string;
  platform_name: string;
  expires_at: string | null;
  granted_at: string;
}

export function fetchPlatforms(token: string): Promise<Platform[]> {
  return apiFetch('/platforms', token);
}

export function createPlatform(token: string, payload: Omit<Platform, 'id'>): Promise<Platform> {
  return apiFetch('/platforms', token, { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchPermissions(token: string, platform_id?: string): Promise<Permission[]> {
  const q = platform_id ? `?platform_id=${platform_id}` : '';
  return apiFetch(`/permissions${q}`, token);
}

export function fetchUserPermissions(token: string, userId: string): Promise<UserPermission[]> {
  return apiFetch(`/users/${userId}/permissions`, token);
}

export function grantUserPermission(
  token: string,
  userId: string,
  payload: { permission_id: string; expires_at?: string; authorization_id?: string; notes?: string }
): Promise<UserPermission> {
  return apiFetch(`/users/${userId}/permissions`, token, { method: 'POST', body: JSON.stringify(payload) });
}

export function revokeUserPermission(token: string, userId: string, permission_id: string): Promise<void> {
  return apiFetch(`/users/${userId}/permissions`, token, { method: 'DELETE', body: JSON.stringify({ permission_id }) });
}

// ─── Solicitudes de autorización ─────────────────────────────────────────────

export interface AuthorizationRequest {
  id: string;
  beneficiary_id: string;
  beneficiary_name?: string;
  type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  review_notes: string | null;
  original_email: string | null;
  original_email_from: string | null;
  original_email_date: string | null;
  created_at: string;
  updated_at: string;
}

export function fetchAuthorizationRequests(
  token: string,
  params?: { status?: string; limit?: number }
): Promise<AuthorizationRequest[]> {
  const q = params ? new URLSearchParams(Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  )).toString() : '';
  return apiFetch(`/authorization-requests?${q}`, token);
}

export function createAuthorizationRequest(
  token: string,
  payload: Pick<AuthorizationRequest, 'beneficiary_id' | 'type' | 'description' | 'original_email' | 'original_email_from' | 'original_email_date'>
): Promise<AuthorizationRequest> {
  return apiFetch('/authorization-requests', token, { method: 'POST', body: JSON.stringify(payload) });
}

export function reviewAuthorizationRequest(
  token: string,
  id: string,
  status: 'approved' | 'rejected',
  review_notes?: string
): Promise<AuthorizationRequest> {
  return apiFetch(`/authorization-requests/${id}`, token, { method: 'PATCH', body: JSON.stringify({ status, review_notes }) });
}

// ─── Memory Inspector ────────────────────────────────────────────────────────

export interface UserMemoryContext {
  profile: {
    technical_level: 'basic' | 'intermediate' | 'advanced';
    common_issues: Array<{ category: string; subcategory: string; count: number; last_date: string }>;
    communication_style: 'concise' | 'detailed' | 'needs_guidance';
    total_tickets: number;
  };
  redisContext: {
    extracted_fields: Record<string, unknown>;
    missing_fields: string[];
    conversation_summary: string;
    turn_count: number;
    ticket_id: string | null;
  };
  segments: Array<{ id: string; topic: string; summary: string; last_msg_at: string }>;
}

export function fetchUserMemoryContext(
  token: string,
  userId: string
): Promise<UserMemoryContext> {
  return apiFetch<UserMemoryContext>(`/memory/${userId}/context`, token);
}

export function searchUserMemory(
  token: string,
  userId: string,
  q: string
): Promise<unknown> {
  return apiFetch(`/memory/${userId}/search?q=${encodeURIComponent(q)}`, token);
}
