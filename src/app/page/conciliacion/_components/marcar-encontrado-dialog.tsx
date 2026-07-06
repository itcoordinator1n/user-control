'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { Loader2, Search, Link2, Zap } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buscarEquipos } from '@/lib/equipos-api';
import { useToken, useMatch } from '@/hooks/useConciliacionQueries';
import { useToast } from '@/hooks/useToast';
import type { Equipo, ActivoContable } from '@/types/conciliacion';

interface Props {
  activo: ActivoContable | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MarcarEncontradoDialog({ activo, open, onOpenChange }: Props) {
  const token = useToken();
  const { toast } = useToast();
  const match = useMatch();
  const [q, setQ] = useState('');
  const [debouncedQ] = useDebounce(q, 400);
  const [selected, setSelected] = useState<Equipo | null>(null);
  const [nota, setNota] = useState('');

  // Prefill con la serie del activo al abrir
  useEffect(() => {
    if (open) {
      setQ(activo?.txt_serie_match || activo?.txt_serie_original || '');
      setSelected(null);
      setNota('');
    }
  }, [open, activo]);

  const { data: equipos, isFetching } = useQuery({
    queryKey: ['conc', 'buscar-equipos', debouncedQ],
    queryFn: () => buscarEquipos(token, debouncedQ),
    enabled: !!token && debouncedQ.trim().length >= 2 && open,
  });

  // Sugerencia de auto-vínculo: la serie del activo coincide con exactamente 1 equipo
  const sugerido = useMemo(() => {
    if (!activo?.txt_serie_match || !equipos) return null;
    const exact = equipos.filter((e) => e.txt_serie_norm === activo.txt_serie_match && e.txt_estado !== 'baja');
    return exact.length === 1 ? exact[0] : null;
  }, [equipos, activo]);

  const doMatch = async (equipo: Equipo, tipo: 'manual' | 'etiqueta' = 'manual') => {
    if (!activo) return;
    try {
      await match.mutateAsync({
        actFijo: activo.txt_act_fijo,
        payload: {
          idEquipo: equipo.id_equipo,
          matchTipo: tipo,
          matchConfianza: sugerido && sugerido.id_equipo === equipo.id_equipo ? 'alta' : 'media',
          nota: nota.trim() || null,
        },
      });
      toast.success(`Activo ${activo.txt_act_fijo} vinculado al equipo #${equipo.id_equipo}.`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo vincular.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Marcar encontrado · {activo?.txt_act_fijo}</DialogTitle>
          <DialogDescription>
            {activo?.txt_denominacion_activo || 'Selecciona el equipo físico que corresponde a este activo.'}
          </DialogDescription>
        </DialogHeader>

        {sugerido && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
            <div className="text-sm">
              <div className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-200">
                <Zap className="h-4 w-4" /> Coincidencia única por serie
              </div>
              <div className="text-xs text-muted-foreground">
                #{sugerido.id_equipo} · {sugerido.txt_modelo || sugerido.txt_nombre_equipo} · serie {sugerido.txt_numero_serie}
              </div>
            </div>
            <Button size="sm" onClick={() => doMatch(sugerido)} disabled={match.isPending}>
              {match.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Vincular (1 clic)
            </Button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar equipo por serie, modelo, fabricante o nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="max-h-64 overflow-auto rounded-md border">
          {isFetching ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
            </div>
          ) : !equipos?.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {debouncedQ.trim().length < 2 ? 'Escribe al menos 2 caracteres.' : 'Sin equipos coincidentes.'}
            </div>
          ) : (
            <ul className="divide-y">
              {equipos.map((e) => (
                <li key={e.id_equipo}>
                  <button
                    type="button"
                    onClick={() => setSelected(e)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted',
                      selected?.id_equipo === e.id_equipo && 'bg-primary/10',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        #{e.id_equipo} · {e.txt_nombre_equipo || e.txt_modelo || 'Equipo'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {e.txt_fabricante} {e.txt_modelo} · serie {e.txt_numero_serie || '—'} · {e.txt_estado}
                      </div>
                    </div>
                    {e.txt_serie_norm === activo?.txt_serie_match && (
                      <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
                        serie =
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Textarea
          placeholder="Nota (opcional): cómo se verificó, ubicación, etc."
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => selected && doMatch(selected)} disabled={!selected || match.isPending}>
            {match.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            Vincular seleccionado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
