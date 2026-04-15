'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { InterruptionReason } from '@/types/tickets';

interface InterruptionModalProps {
  open: boolean;
  onSelect: (reason: InterruptionReason, note?: string) => void;
}

const REASONS: Array<{ reason: InterruptionReason; emoji: string; label: string }> = [
  { reason: 'colleague_question', emoji: '👥', label: 'Colega preguntó' },
  { reason: 'urgent_ticket',      emoji: '🚨', label: 'Ticket urgente' },
  { reason: 'meeting',            emoji: '📅', label: 'Reunión' },
  { reason: 'break_personal',     emoji: '☕', label: 'Pausa personal' },
  { reason: 'system_issue',       emoji: '💻', label: 'Problema técnico' },
  { reason: 'other',              emoji: '❓', label: 'Otro' },
];

export function InterruptionModal({ open, onSelect }: InterruptionModalProps) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  const handleSelect = (reason: InterruptionReason) => {
    if (reason === 'other') {
      setShowNote(true);
      return;
    }
    onSelect(reason);
  };

  const handleOther = () => {
    onSelect('other', note.trim() || undefined);
    setNote('');
    setShowNote(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">¿Por qué pausás?</DialogTitle>
        </DialogHeader>

        {!showNote ? (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {REASONS.map(({ reason, emoji, label }) => (
              <button
                key={reason}
                onClick={() => handleSelect(reason)}
                className="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted active:scale-95"
              >
                <span className="text-2xl">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <Input
              autoFocus
              placeholder="Describí brevemente..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOther()}
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleOther}>Pausar</Button>
              <Button variant="outline" onClick={() => setShowNote(false)}>Volver</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
