'use client';

import { useState } from 'react';
import { Loader2, PackageX } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { unmatchActivo } from '@/lib/equipos-api';
import { useToken } from '@/hooks/useConciliacionQueries';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  actFijos: string[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}

/** Marca N activos como no encontrado con llamadas secuenciales (no hay endpoint bulk). */
export function BulkNoEncontradoDialog({ actFijos, open, onOpenChange, onDone }: Props) {
  const token = useToken();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [errores, setErrores] = useState(0);

  const total = actFijos.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const run = async () => {
    setRunning(true); setDone(0); setErrores(0);
    let ok = 0, err = 0;
    for (const actFijo of actFijos) {
      try {
        await unmatchActivo(token, actFijo, 'no_encontrado');
        ok++;
      } catch {
        err++;
      }
      setDone(ok + err); setErrores(err);
    }
    qc.invalidateQueries({ queryKey: ['conc'] });
    setRunning(false);
    if (err === 0) toast.success(`${ok} activos marcados como no encontrado.`);
    else toast.error(`${ok} actualizados, ${err} con error.`);
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!running) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="h-5 w-5 text-red-600" /> Marcar no encontrado en lote
          </DialogTitle>
          <DialogDescription>
            Se marcarán <strong>{total}</strong> activos como no encontrado. La operación se hace en
            llamadas individuales (el backend aún no tiene endpoint masivo).
          </DialogDescription>
        </DialogHeader>

        {running || done > 0 ? (
          <div className="space-y-2">
            <Progress value={pct} />
            <p className="text-sm text-muted-foreground">
              {done} / {total} procesados{errores > 0 ? ` · ${errores} con error` : ''}
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={running}>Cancelar</Button>
          <Button variant="destructive" onClick={run} disabled={running || total === 0}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageX className="mr-2 h-4 w-4" />}
            Procesar {total}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
