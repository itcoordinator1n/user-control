'use client';

import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/hooks/useTimerStore';
import { usePauseSession } from '@/hooks/useTicketQueries';

const EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

/**
 * Componente invisible que detecta inactividad (AFK).
 * Solo actúa cuando el timer está corriendo y no está pausado.
 * Se monta en el layout del técnico.
 */
export function AFKDetector() {
  const isRunning = useTimerStore((s) => s.isRunning);
  const isPaused = useTimerStore((s) => s.isPaused);
  const isAFK = useTimerStore((s) => s.isAFK);
  const activeSessionId = useTimerStore((s) => s.activeSessionId);
  const setAFK = useTimerStore((s) => s.setAFK);
  const showReturn = useTimerStore((s) => s.showReturn);
  const { mutate: pauseSession } = usePauseSession();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Leer timeout desde config o usar 3 minutos por defecto
  const AFK_MS = 3 * 60 * 1000;

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isRunning || isPaused || isAFK) return;

    timerRef.current = setTimeout(() => {
      setAFK(true);
      pauseSession({ reason: 'afk_detected', was_automatic: true }, {
        onSuccess: () => showReturn(),
      });
    }, AFK_MS);
  };

  // Registrar listeners de actividad
  useEffect(() => {
    if (!isRunning || isPaused) return;

    EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isPaused, isAFK, activeSessionId]);

  // Detectar visibilitychange (cambio de pestaña)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isPaused]);

  return null;
}
