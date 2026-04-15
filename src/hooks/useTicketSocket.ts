'use client';

/**
 * useTicketSocket — Socket.io para el módulo de tickets.
 *
 * Namespaces disponibles:
 *   /notifications  →  rooms: user:{id}, role:{rol}   (todos los autenticados)
 *   /timer          →  rooms: tech:{id}                (técnicos — Fase 3)
 *   /admin          →  room:  role:admin               (admins — Fase 4)
 */

import { useEffect, useMemo } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from './useNotificationStore';
import { useTimerStore } from './useTimerStore';
import type { NotificationInbox, SocketEvents } from '@/types/tickets';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function createSocket(namespace: string, token: string): Socket {
  return io(`${API_URL}${namespace}`, {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionAttempts: Infinity,
  });
}

// ─── /notifications ──────────────────────────────────────────────────────────

export function useTicketSocket(): Socket {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const token = session?.user?.accessToken ?? '';

  const socket = useMemo(
    () => createSocket('/notifications', token),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  useEffect(() => {
    if (!token) return;
    socket.connect();
    return () => { socket.disconnect(); };
  }, [socket, token]);

  useEffect(() => {
    // Ticket creado desde WhatsApp
    const onCreated = (p: SocketEvents['ticket:created']) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      addNotification(mkNotif(`tc-${p.ticketId}`, 'ticket:created',
        'Nuevo ticket',
        `${p.code} — ${p.category} (${p.priority})`,
        `/page/tech/${p.ticketId}`
      ));
    };

    // Usuario envía mensaje a ticket en progreso
    const onUserMessage = (p: SocketEvents['ticket:user-message']) => {
      queryClient.invalidateQueries({ queryKey: ['messages', p.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', p.ticketId] });
      addNotification(mkNotif(`tm-${p.ticketId}`, 'ticket:user-message',
        'Mensaje nuevo',
        `${p.code}: ${p.preview}`,
        `/page/tech/${p.ticketId}`
      ));
    };

    // Prioridad subida automáticamente
    const onPriorityBumped = (p: SocketEvents['ticket:priority-bumped']) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', p.ticketId] });
      addNotification(mkNotif(`tp-${p.ticketId}`, 'ticket:priority-bumped',
        'Prioridad escalada',
        `${p.code} ahora es ${p.priority}`,
        `/page/tech/${p.ticketId}`
      ));
    };

    // Ticket sin resolución marcado como flagged
    const onFlagged = (p: SocketEvents['ticket:flagged']) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      addNotification(mkNotif(`tf-${p.ticketId}`, 'ticket:flagged',
        'Ticket sin resolución',
        `${p.code}: ${p.reason}`,
        `/page/tech/${p.ticketId}`
      ));
    };

    // Notificaciones generales (van al store para el NotificationCenter)
    const onNotifyCreated = (p: SocketEvents['notify:ticket_created']) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      addNotification(mkNotif(`nc-${p.ticketId}`, 'notify:ticket_created',
        'Ticket creado',
        `${p.code} — ${p.category} (${p.priority})`,
        `/page/tech/${p.ticketId}`
      ));
    };

    const onNotifyAssigned = (p: SocketEvents['notify:ticket_assigned']) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      addNotification(mkNotif(`na-${p.ticketId}`, 'notify:ticket_assigned',
        'Ticket asignado',
        `${p.code} asignado a ${p.technicianName}`,
        `/page/tech/${p.ticketId}`
      ));
    };

    const onNotifyResolved = (p: SocketEvents['notify:ticket_resolved']) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', p.ticketId] });
      addNotification(mkNotif(`nr-${p.ticketId}`, 'notify:ticket_resolved',
        'Ticket resuelto',
        `${p.code} fue marcado como resuelto`,
        `/page/tickets/${p.ticketId}`
      ));
    };

    socket.on('ticket:created', onCreated);
    socket.on('ticket:user-message', onUserMessage);
    socket.on('ticket:priority-bumped', onPriorityBumped);
    socket.on('ticket:flagged', onFlagged);
    socket.on('notify:ticket_created', onNotifyCreated);
    socket.on('notify:ticket_assigned', onNotifyAssigned);
    socket.on('notify:ticket_resolved', onNotifyResolved);

    return () => {
      socket.off('ticket:created', onCreated);
      socket.off('ticket:user-message', onUserMessage);
      socket.off('ticket:priority-bumped', onPriorityBumped);
      socket.off('ticket:flagged', onFlagged);
      socket.off('notify:ticket_created', onNotifyCreated);
      socket.off('notify:ticket_assigned', onNotifyAssigned);
      socket.off('notify:ticket_resolved', onNotifyResolved);
    };
  }, [socket, queryClient, addNotification]);

  return socket;
}

// ─── /timer ── Fase 3 ────────────────────────────────────────────────────────
//
// Eventos cliente → servidor: heartbeat, get_active, resume, discard_afk
// Eventos servidor → cliente: heartbeat_ack, session_resumed, afk_detected, afk_discarded

export function useTimerSocket(): Socket {
  const { data: session } = useSession();
  const token = session?.user?.accessToken ?? '';

  const socket = useMemo(
    () => createSocket('/timer', token),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  useEffect(() => {
    if (!token) return;
    socket.connect();
    return () => { socket.disconnect(); };
  }, [socket, token]);

  // Manejar afk_detected del servidor (el backend detecta AFK por su propio loop)
  useEffect(() => {
    const onAFKDetected = () => {
      const { setAFK, showReturn, isRunning } = useTimerStore.getState();
      if (isRunning) {
        setAFK(true);
        showReturn();
      }
    };

    const onSessionResumed = () => {
      useTimerStore.getState().resume();
    };

    const onAFKDiscarded = () => {
      useTimerStore.getState().discardAFK();
    };

    socket.on('afk_detected', onAFKDetected);
    socket.on('session_resumed', onSessionResumed);
    socket.on('afk_discarded', onAFKDiscarded);

    return () => {
      socket.off('afk_detected', onAFKDetected);
      socket.off('session_resumed', onSessionResumed);
      socket.off('afk_discarded', onAFKDiscarded);
    };
  }, [socket]);

  return socket;
}

// ─── /admin ── Fase 4 ────────────────────────────────────────────────────────

export function useAdminSocket(): Socket {
  const { data: session } = useSession();
  const token = session?.user?.accessToken ?? '';

  const socket = useMemo(
    () => createSocket('/admin', token),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  );

  useEffect(() => {
    if (!token) return;
    socket.connect();
    return () => { socket.disconnect(); };
  }, [socket, token]);

  return socket;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function mkNotif(
  baseId: string,
  type: string,
  title: string,
  body: string,
  link: string
): NotificationInbox {
  return {
    id: `${baseId}-${Date.now()}`,
    type,
    title,
    body,
    link,
    is_read: false,
    created_at: new Date().toISOString(),
  };
}
