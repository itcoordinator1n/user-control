'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  fetchTickets, fetchTicket, fetchTicketLog, createTicket, updateTicketStatus, assignTicket,
  fetchMessages, replyToTicket, createSolution, finalizeSolution,
  fetchKnowledge, searchKnowledge, fetchNotifications, markNotificationsRead,
  startTimerSession, pauseTimerSession, resumeTimerSession, completeTimerSession,
  switchTimerSession, discardAFKSession, fetchActiveSession, fetchPomodoroConfig,
  // Phase 4
  fetchTree, createTreeNode, updateTreeNode, deleteTreeNode, deployTree,
  fetchTreeVersions, fetchShadowRules, approveShadowRule, dismissShadowRule,
  fetchDashboardAnalytics, fetchTechnicianAnalytics, fetchInterruptionAnalytics,
  fetchConversationAnalytics, fetchGanttAnalytics, fetchPatternAnalytics,
  fetchPlatforms, createPlatform, fetchPermissions, fetchUserPermissions,
  grantUserPermission, revokeUserPermission,
  fetchAuthorizationRequests, createAuthorizationRequest, reviewAuthorizationRequest,
  fetchUserMemoryContext, searchUserMemory,
  type TicketFilters, type CreateTicketPayload, type CreateSolutionPayload,
  type TreeNode, type Platform, type DateRangeParams,
} from '@/lib/ticket-api';
import type { InterruptionReason } from '@/types/tickets';
import { useNotificationStore } from './useNotificationStore';
import type { TicketStatus } from '@/types/tickets';

function useToken(): string {
  const { data: session } = useSession();
  return session?.user?.accessToken ?? '';
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export function useTickets(filters?: TicketFilters) {
  const token = useToken();
  return useInfiniteQuery({
    queryKey: ['tickets', filters],
    queryFn: ({ pageParam }) =>
      fetchTickets(token, { ...filters, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!token,
    staleTime: 30_000,
  });
}

export function useTicket(id: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicket(token, id),
    enabled: !!token && !!id,
    staleTime: 15_000,
  });
}

export function useCreateTicket() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createTicket(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUpdateTicketStatus() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to_status, reason }: { id: string; to_status: TicketStatus; reason?: string }) =>
      updateTicketStatus(token, id, to_status, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
}

export function useAssignTicket() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, technician_id }: { id: string; technician_id: string }) =>
      assignTicket(token, id, technician_id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
}

export function useTicketLog(id: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['ticket-log', id],
    queryFn: () => fetchTicketLog(token, id),
    enabled: !!token && !!id,
    staleTime: 60_000,
  });
}

// ─── Mensajes ─────────────────────────────────────────────────────────────────

export function useMessages(ticketId: string) {
  const token = useToken();
  return useInfiniteQuery({
    queryKey: ['messages', ticketId],
    queryFn: ({ pageParam }) =>
      fetchMessages(token, { ticket_id: ticketId, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!token && !!ticketId,
    staleTime: 10_000,
  });
}

export function useReplyToTicket(ticketId: string) {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => replyToTicket(token, ticketId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', ticketId] });
    },
  });
}

// ─── Soluciones ───────────────────────────────────────────────────────────────

export function useCreateSolution(ticketId: string) {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSolutionPayload) => createSolution(token, ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });
}

export function useFinalizeSolution(ticketId: string) {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => finalizeSolution(token, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

// ─── Knowledge base ───────────────────────────────────────────────────────────

export function useKnowledge() {
  const token = useToken();
  return useInfiniteQuery({
    queryKey: ['knowledge'],
    queryFn: ({ pageParam }) =>
      fetchKnowledge(token, { cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function useSearchKnowledge(q: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['knowledge', 'search', q],
    queryFn: () => searchKnowledge(token, q),
    enabled: !!token && q.trim().length >= 2,
    staleTime: 2 * 60_000,
  });
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export function useNotificationsQuery() {
  const token = useToken();
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await fetchNotifications(token, { limit: 30 });
      setNotifications(data);
      return data;
    },
    enabled: !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

// ─── Timer ────────────────────────────────────────────────────────────────────

export function usePomodoroConfig() {
  const token = useToken();
  return useQuery({
    queryKey: ['pomodoro-config'],
    queryFn: () => fetchPomodoroConfig(token),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function useActiveSession() {
  const token = useToken();
  return useQuery({
    queryKey: ['timer-active'],
    queryFn: () => fetchActiveSession(token),
    enabled: !!token,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useStartSession() {
  const token = useToken();
  return useMutation({
    mutationFn: (ticket_id: string) => startTimerSession(token, ticket_id),
  });
}

export function usePauseSession() {
  const token = useToken();
  return useMutation({
    mutationFn: ({
      reason,
      reason_note,
      was_automatic,
    }: {
      reason: InterruptionReason;
      reason_note?: string;
      was_automatic?: boolean;
    }) => pauseTimerSession(token, reason, reason_note, was_automatic),
  });
}

export function useResumeSession() {
  const token = useToken();
  return useMutation({
    mutationFn: () => resumeTimerSession(token),
  });
}

export function useCompleteSession() {
  const token = useToken();
  return useMutation({
    mutationFn: () => completeTimerSession(token),
  });
}

export function useSwitchSession() {
  const token = useToken();
  return useMutation({
    mutationFn: (ticket_id: string) => switchTimerSession(token, ticket_id),
  });
}

export function useDiscardAFK() {
  const token = useToken();
  return useMutation({
    mutationFn: () => discardAFKSession(token),
  });
}

export function useMarkNotificationsRead() {
  const token = useToken();
  const queryClient = useQueryClient();
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  return useMutation({
    mutationFn: (ids: string[] | 'all') => markNotificationsRead(token, ids),
    onSuccess: (_, ids) => {
      if (ids === 'all') {
        markAllAsRead();
      } else {
        ids.forEach((id) => markAsRead(id));
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Árbol de decisión ───────────────────────────────────────────────────────

export function useTree() {
  const token = useToken();
  return useQuery({ queryKey: ['tree'], queryFn: () => fetchTree(token), enabled: !!token, staleTime: 30_000 });
}

export function useTreeVersions() {
  const token = useToken();
  return useQuery({ queryKey: ['tree-versions'], queryFn: () => fetchTreeVersions(token), enabled: !!token });
}

export function useCreateTreeNode() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TreeNode>) => createTreeNode(token, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tree'] }),
  });
}

export function useUpdateTreeNode() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<TreeNode> & { id: string }) => updateTreeNode(token, id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tree'] }),
  });
}

export function useDeleteTreeNode() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTreeNode(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tree'] }),
  });
}

export function useDeployTree() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ root_node_id, changelog }: { root_node_id: string; changelog: string }) =>
      deployTree(token, root_node_id, changelog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree'] });
      queryClient.invalidateQueries({ queryKey: ['tree-versions'] });
    },
  });
}

export function useShadowRules() {
  const token = useToken();
  return useQuery({ queryKey: ['shadow-rules'], queryFn: () => fetchShadowRules(token), enabled: !!token, staleTime: 60_000 });
}

export function useApproveShadowRule() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveShadowRule(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shadow-rules'] }),
  });
}

export function useDismissShadowRule() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dismissShadowRule(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shadow-rules'] }),
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useDashboardAnalytics(params?: DateRangeParams) {
  const token = useToken();
  return useQuery({
    queryKey: ['analytics-dashboard', params],
    queryFn: () => fetchDashboardAnalytics(token, params),
    enabled: !!token, staleTime: 5 * 60_000,
  });
}

export function useTechnicianAnalytics(id: string, params?: DateRangeParams) {
  const token = useToken();
  return useQuery({
    queryKey: ['analytics-tech', id, params],
    queryFn: () => fetchTechnicianAnalytics(token, id, params),
    enabled: !!token && !!id, staleTime: 2 * 60_000,
  });
}

export function useInterruptionAnalytics(params?: DateRangeParams) {
  const token = useToken();
  return useQuery({
    queryKey: ['analytics-interruptions', params],
    queryFn: () => fetchInterruptionAnalytics(token, params),
    enabled: !!token, staleTime: 5 * 60_000,
  });
}

export function useConversationAnalytics(params?: DateRangeParams) {
  const token = useToken();
  return useQuery({
    queryKey: ['analytics-conversations', params],
    queryFn: () => fetchConversationAnalytics(token, params),
    enabled: !!token, staleTime: 5 * 60_000,
  });
}

export function useGanttAnalytics(params?: { technician_id?: string; days?: number }) {
  const token = useToken();
  return useQuery({
    queryKey: ['analytics-gantt', params],
    queryFn: () => fetchGanttAnalytics(token, params),
    enabled: !!token, staleTime: 2 * 60_000,
  });
}

export function usePatternAnalytics() {
  const token = useToken();
  return useQuery({
    queryKey: ['analytics-patterns'],
    queryFn: () => fetchPatternAnalytics(token),
    enabled: !!token, staleTime: 10 * 60_000,
  });
}

// ─── Plataformas y permisos ───────────────────────────────────────────────────

export function usePlatforms() {
  const token = useToken();
  return useQuery({ queryKey: ['platforms'], queryFn: () => fetchPlatforms(token), enabled: !!token, staleTime: 5 * 60_000 });
}

export function useCreatePlatform() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Platform, 'id'>) => createPlatform(token, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  });
}

export function usePermissions(platform_id?: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['permissions', platform_id],
    queryFn: () => fetchPermissions(token, platform_id),
    enabled: !!token, staleTime: 5 * 60_000,
  });
}

export function useUserPermissions(userId: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => fetchUserPermissions(token, userId),
    enabled: !!token && !!userId, staleTime: 60_000,
  });
}

export function useGrantPermission(userId: string) {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { permission_id: string; expires_at?: string; notes?: string }) =>
      grantUserPermission(token, userId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] }),
  });
}

export function useRevokePermission(userId: string) {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permission_id: string) => revokeUserPermission(token, userId, permission_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] }),
  });
}

// ─── Solicitudes de autorización ─────────────────────────────────────────────

export function useAuthorizationRequests(status?: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['auth-requests', status],
    queryFn: () => fetchAuthorizationRequests(token, { status, limit: 50 }),
    enabled: !!token, staleTime: 60_000,
  });
}

export function useReviewAuthRequest() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, review_notes }: { id: string; status: 'approved' | 'rejected'; review_notes?: string }) =>
      reviewAuthorizationRequest(token, id, status, review_notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth-requests'] }),
  });
}

// ─── Memory inspector ─────────────────────────────────────────────────────────

export function useMemoryContext(userId: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['memory-context', userId],
    queryFn: () => fetchUserMemoryContext(token, userId),
    enabled: !!token && !!userId, staleTime: 30_000,
  });
}

export function useSearchMemory(userId: string, q: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['memory-search', userId, q],
    queryFn: () => searchUserMemory(token, userId, q),
    enabled: !!token && !!userId && q.trim().length >= 2, staleTime: 60_000,
  });
}
