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
      phase: 'idle' as PomodoroPhase,
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

      pause: (interruptionId, _reason) => set({
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
        phase: 'idle' as PomodoroPhase,
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
        phase: 'idle',
        isRunning: false,
        activeSessionId: null,
        activeTicketId: null,
        activeTicketCode: null,
        secondsRemaining: 0,
        isPaused: false,
        activeInterruptionId: null,
        pauseStartedAt: null,
        pauseSeconds: 0,
        isAFK: false,
        showReturnModal: false,
      }),
    }),
    {
      name: 'ticket-timer-store',
    }
  )
);
