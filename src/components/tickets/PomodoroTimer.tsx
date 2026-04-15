'use client';

import { useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTimerStore } from '@/hooks/useTimerStore';
import { useTimerSocket } from '@/hooks/useTicketSocket';
import {
  usePauseSession,
  useResumeSession,
  useCompleteSession,
  useDiscardAFK,
} from '@/hooks/useTicketQueries';
import { InterruptionModal } from './InterruptionModal';
import { ReturnFromAFKModal } from './ReturnFromAFKModal';
import { cn } from '@/lib/utils';
import type { InterruptionReason } from '@/types/tickets';

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DEFAULT_FOCUS_SECONDS = 25 * 60;

export function PomodoroTimer() {
  const {
    phase, isRunning, isPaused, secondsRemaining, activeTicketCode,
    activeSessionId, pomodoroSequence, showReturnModal,
    tick, pause, resume, completeCycle, discardAFK,
  } = useTimerStore();

  const { mutate: pauseSession } = usePauseSession();
  const { mutate: resumeSession } = useResumeSession();
  const { mutate: completeSession } = useCompleteSession();
  const { mutate: discardAFKMutation } = useDiscardAFK();

  const [showInterruptionModal, setShowInterruptionModal] = useState(false);
  const [pauseCounter, setPauseCounter] = useState(0);

  const timerSocket = useTimerSocket();

  // Tick principal cada segundo
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, tick]);

  // Detectar ciclo completado
  useEffect(() => {
    if (!isRunning || isPaused || secondsRemaining !== 0) return;
    playCompletionSound();
    completeSession(undefined, { onSuccess: () => completeCycle() });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining, isRunning, isPaused]);

  // Contador de pausa (sube mientras está pausado)
  useEffect(() => {
    if (!isPaused) { setPauseCounter(0); return; }
    const interval = setInterval(() => setPauseCounter((c) => c + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Heartbeat cada 15s — evento: 'heartbeat' (no 'timer:heartbeat')
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(() => {
      timerSocket.emit('heartbeat');
    }, 15_000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timerSocket]);

  if (!isRunning && phase === 'idle') return null;

  // Progreso del anillo
  const totalSeconds = phase === 'focus' ? DEFAULT_FOCUS_SECONDS : 5 * 60;
  const progress = Math.max(0, secondsRemaining / totalSeconds);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const mins = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
  const secs = (secondsRemaining % 60).toString().padStart(2, '0');
  const pauseMins = Math.floor(pauseCounter / 60).toString().padStart(2, '0');
  const pauseSecs = (pauseCounter % 60).toString().padStart(2, '0');

  const handleClickPause = () => {
    if (isPaused) return;
    setShowInterruptionModal(true);
  };

  const handleInterruptionSelect = (reason: InterruptionReason, note?: string) => {
    setShowInterruptionModal(false);
    pauseSession(
      { reason, reason_note: note },
      { onSuccess: (interruption) => pause(interruption.id, reason) }
    );
  };

  const handleResume = () => {
    // Usar evento socket 'resume' (servidor cierra interrupción activa)
    timerSocket.emit('resume');
    resumeSession(undefined, { onSuccess: () => resume() });
  };

  const handleAFKWasWorking = () => {
    // Descartar AFK: servidor cierra la pausa con duration=0
    timerSocket.emit('discard_afk');
    discardAFKMutation(undefined, { onSuccess: () => discardAFK() });
  };

  const handleAFKWasInterrupted = () => {
    // Era interrupción real — reanudar normalmente
    handleResume();
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Anillo SVG */}
        <div className="relative flex items-center justify-center">
          <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r={RADIUS} fill="none"
              strokeWidth="6" stroke="currentColor"
              className="text-gray-200 dark:text-gray-700" />
            <circle cx="44" cy="44" r={RADIUS} fill="none"
              strokeWidth="6" stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className={cn(
                'transition-all duration-1000',
                isPaused ? 'text-orange-500' : 'text-blue-500'
              )}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-mono font-bold leading-none">
              {mins}:{secs}
            </span>
            <span className="text-[9px] text-muted-foreground mt-0.5">
              {phase === 'focus' ? `🍅 ${pomodoroSequence}/4` : 'Descanso'}
            </span>
          </div>
        </div>

        {/* Info + controles */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold truncate max-w-[120px]">
            {activeTicketCode ?? '—'}
          </span>

          {isPaused ? (
            <>
              <span className="text-[11px] text-orange-600 font-mono">
                Pausa: {pauseMins}:{pauseSecs}
              </span>
              <button
                onClick={handleResume}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Play className="h-3 w-3" /> Reanudar
              </button>
            </>
          ) : (
            <button
              onClick={handleClickPause}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Pause className="h-3 w-3" /> Pausar
            </button>
          )}
        </div>
      </div>

      <InterruptionModal
        open={showInterruptionModal}
        onSelect={handleInterruptionSelect}
      />

      <ReturnFromAFKModal
        open={showReturnModal}
        pauseSeconds={pauseCounter}
        onWasWorking={handleAFKWasWorking}
        onWasInterrupted={handleAFKWasInterrupted}
      />
    </>
  );
}

function playCompletionSound() {
  try {
    const ctx = new AudioContext();
    [880, 1100, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.12);
    });
  } catch {
    // Audio no disponible
  }
}
