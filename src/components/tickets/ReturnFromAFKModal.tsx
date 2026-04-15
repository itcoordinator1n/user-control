'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ReturnFromAFKModalProps {
  open: boolean;
  pauseSeconds: number;
  onWasWorking: () => void;
  onWasInterrupted: () => void;
}

export function ReturnFromAFKModal({
  open,
  pauseSeconds,
  onWasWorking,
  onWasInterrupted,
}: ReturnFromAFKModalProps) {
  const mins = Math.floor(pauseSeconds / 60);
  const secs = pauseSeconds % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">👋 ¿De vuelta?</DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm text-muted-foreground">
          Estuviste inactivo por <span className="font-semibold text-foreground">{timeStr}</span>.
          ¿Seguías trabajando en el ticket?
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onWasWorking} className="w-full">
            Sí, seguía trabajando
          </Button>
          <Button variant="outline" onClick={onWasInterrupted} className="w-full">
            No, fue una interrupción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
