'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useUpdateTicketStatus } from '@/hooks/useTicketQueries';
import { useTimerStore } from '@/hooks/useTimerStore';
import type { Ticket, TicketStatus } from '@/types/tickets';

interface KanbanBoardProps {
  tickets: Ticket[];
  onStartPomodoro?: (ticket: Ticket) => void;
}

const COLUMNS: Array<{
  id: TicketStatus;
  title: string;
  colorClass: string;
  dropDisabled?: boolean;
}> = [
  { id: 'new',          title: 'Nuevos',           colorClass: 'bg-blue-500 text-white',   dropDisabled: true },
  { id: 'classified',   title: 'Clasificados',      colorClass: 'bg-indigo-500 text-white' },
  { id: 'assigned',     title: 'Asignados',         colorClass: 'bg-purple-500 text-white' },
  { id: 'in_progress',  title: 'En progreso',       colorClass: 'bg-yellow-500 text-white' },
  { id: 'pending_user', title: 'Esperando usuario', colorClass: 'bg-orange-500 text-white' },
  { id: 'resolved',     title: 'Resueltos',         colorClass: 'bg-green-600 text-white' },
];

// Transiciones válidas según la state machine del backend
const VALID_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  new:          ['classified'],
  classified:   ['assigned'],
  assigned:     ['in_progress', 'escalated'],
  in_progress:  ['pending_user', 'assigned', 'escalated'],
  pending_user: ['in_progress', 'resolved', 'reopened'],
  resolved:     ['closed', 'reopened'],
  reopened:     ['assigned'],
  escalated:    ['assigned', 'in_progress'],
};

const TRANSITION_MESSAGES: Partial<Record<string, string>> = {
  'new->assigned':          'Primero clasificá el ticket (new → classified → assigned).',
  'new->in_progress':       'Primero clasificá y asigná el ticket.',
  'resolved->*':            'Un ticket resuelto no puede moverse hacia atrás.',
  'closed->*':              'Un ticket cerrado no puede reabrirse desde aquí.',
  'in_progress->resolved':  'Necesitás documentar y finalizar la solución antes de resolver.',
  'pending_user->resolved': 'Necesitás finalizar la documentación antes de resolver.',
};

export function KanbanBoard({ tickets, onStartPomodoro }: KanbanBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { mutate: updateStatus } = useUpdateTicketStatus();
  const activeTicketId = useTimerStore((s) => s.activeTicketId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket) setActiveTicket(ticket);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTicket(null);
    if (!over || active.id === over.id) return;

    const ticket = tickets.find((t) => t.id === active.id);
    if (!ticket) return;

    const fromStatus = ticket.status;

    // over.id puede ser el status de una columna O el UUID de otra tarjeta.
    // Si es UUID, buscamos en qué columna vive esa tarjeta.
    const VALID_STATUSES = new Set(COLUMNS.map((c) => c.id));
    const overId = over.id as string;
    const toStatus: TicketStatus = VALID_STATUSES.has(overId as TicketStatus)
      ? (overId as TicketStatus)
      : (tickets.find((t) => t.id === overId)?.status ?? fromStatus);

    if (fromStatus === toStatus) return;

    // Validar transición
    const allowed = VALID_TRANSITIONS[fromStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      const msgKey = `${fromStatus}->${toStatus}`;
      const fallback = `No podés mover de "${fromStatus}" a "${toStatus}".`;
      showToast(TRANSITION_MESSAGES[msgKey] ?? TRANSITION_MESSAGES[`${fromStatus}->*`] ?? fallback);
      return;
    }

    // Ejecutar transición
    updateStatus(
      { id: ticket.id, to_status: toStatus },
      {
        onSuccess: () => {
          // Si se movió a in_progress, ofrecer Pomodoro
          if (toStatus === 'in_progress' && onStartPomodoro) {
            onStartPomodoro(ticket);
          }
        },
        onError: (err) => {
          showToast(err.message ?? 'Error al cambiar estado.');
        },
      }
    );
  };

  const ticketsByStatus = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status);

  return (
    <div className="relative">
      {/* Toast error */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white shadow-lg">
          {toastMsg}
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tickets={ticketsByStatus(col.id)}
              isDropDisabled={col.dropDisabled}
              colorClass={col.colorClass}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket && <KanbanCard ticket={activeTicket} isDragOverlay />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
