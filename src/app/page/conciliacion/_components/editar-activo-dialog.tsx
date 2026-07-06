'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePatchActivo } from '@/hooks/useConciliacionQueries';
import { useToast } from '@/hooks/useToast';
import { ACCION_OPTS, ACCION_LABEL, TIPO_ACTIVO_OPTS, TIPO_ACTIVO_LABEL } from '../_lib/format';
import type { ActivoContable, AccionContable, TipoActivo } from '@/types/conciliacion';

interface Props {
  activo: ActivoContable | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function EditarActivoDialog({ activo, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const patch = usePatchActivo();

  const [accion, setAccion] = useState<AccionContable>('ninguna');
  const [tipo, setTipo] = useState<TipoActivo>('otro');
  const [estadoTi, setEstadoTi] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (open && activo) {
      setAccion(activo.txt_accion_contable);
      setTipo(activo.txt_tipo_activo);
      // estado_ti/notas no vienen en las lecturas actuales (write-only por ahora)
      setEstadoTi(activo.txt_estado_ti ?? '');
      setNotas(activo.txt_notas_conciliacion ?? '');
    }
  }, [open, activo]);

  const save = async () => {
    if (!activo) return;
    try {
      await patch.mutateAsync({
        actFijo: activo.txt_act_fijo,
        body: {
          txt_accion_contable: accion,
          txt_tipo_activo: tipo,
          txt_estado_ti: estadoTi.trim() || null,
          txt_notas_conciliacion: notas.trim() || null,
        },
      });
      toast.success(`Activo ${activo.txt_act_fijo} actualizado.`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar activo · {activo?.txt_act_fijo}</DialogTitle>
          <DialogDescription>Campos que IT puede modificar (backend PATCH).</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Acción contable</Label>
            <Select value={accion} onValueChange={(v) => setAccion(v as AccionContable)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCION_OPTS.map((a) => <SelectItem key={a} value={a}>{ACCION_LABEL[a]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Tipo de activo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoActivo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPO_ACTIVO_OPTS.map((t) => <SelectItem key={t} value={t}>{TIPO_ACTIVO_LABEL[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Estado TI</Label>
            <Input value={estadoTi} onChange={(e) => setEstadoTi(e.target.value)} placeholder="p.ej. en uso, en bodega, dañado…" />
          </div>

          <div className="grid gap-1.5">
            <Label>Notas de conciliación</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>

          <p className="text-xs text-muted-foreground">
            Responsable y Área IT son solo-lectura (provienen del archivo SAP; no editables por API).
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={patch.isPending}>
            {patch.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
