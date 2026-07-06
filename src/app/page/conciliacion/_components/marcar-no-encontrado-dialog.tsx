'use client';

import { useEffect, useState } from 'react';
import { Loader2, PackageX } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { usePatchActivo, useUnmatch } from '@/hooks/useConciliacionQueries';
import { useToast } from '@/hooks/useToast';
import type { ActivoContable } from '@/types/conciliacion';

interface Props {
  activo: ActivoContable | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Marca un activo como "no encontrado". El backend no tiene endpoint dedicado:
 * se usa DELETE .../match {nuevoEstado:'no_encontrado'} (funciona también sin
 * match vigente) y, si hay nota, se guarda con PATCH txt_notas_conciliacion.
 */
export function MarcarNoEncontradoDialog({ activo, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const unmatch = useUnmatch();
  const patch = usePatchActivo();
  const [nota, setNota] = useState('');

  useEffect(() => { if (open) setNota(''); }, [open]);

  const busy = unmatch.isPending || patch.isPending;

  const confirm = async () => {
    if (!activo) return;
    try {
      if (nota.trim()) {
        await patch.mutateAsync({ actFijo: activo.txt_act_fijo, body: { txt_notas_conciliacion: nota.trim() } });
      }
      await unmatch.mutateAsync({ actFijo: activo.txt_act_fijo, nuevoEstado: 'no_encontrado' });
      toast.success(`Activo ${activo.txt_act_fijo} marcado como no encontrado.`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="h-5 w-5 text-red-600" /> Marcar no encontrado
          </DialogTitle>
          <DialogDescription>
            {activo?.txt_act_fijo} — {activo?.txt_denominacion_activo}. Se registrará como no hallado
            físicamente (candidato a baja si es auto-auditable).
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Nota (recomendada): dónde se buscó, con quién se verificó…"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={3}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageX className="mr-2 h-4 w-4" />}
            Marcar no encontrado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
