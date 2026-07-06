'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Zap, Link2, GitCompareArrows } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  useAmbiguos, useEquiposSinActivo, useActivoCandidatos, useEquipoCandidatosActivo,
  useMatch, useAutoMatch,
} from '@/hooks/useConciliacionQueries';
import { useConciliacionPerms } from '../_hooks/use-conciliacion-perms';
import { useToast } from '@/hooks/useToast';
import { PageHeader, Loading, ErrorState, EmptyState } from '../_components/shared';
import { EstadoBusquedaBadge } from '../_components/badges';
import { TIPO_ACTIVO_LABEL } from '../_lib/format';
import type { Ambiguo, Equipo, ActivoContable } from '@/types/conciliacion';

export default function EmparejamientoPage() {
  const { toast } = useToast();
  const perms = useConciliacionPerms();
  const autoMatch = useAutoMatch();

  const runAutoMatch = async () => {
    try {
      const r = await autoMatch.mutateAsync(undefined);
      toast.success(`Auto-match: ${r.enlazados} enlazados de ${r.candidatos} candidatos (${r.omitidos_placeholder} omitidos, ${r.errores} errores).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo ejecutar auto-match.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Emparejamiento manual"
        description="Resolver activos y equipos que la conciliación automática dejó ambiguos."
        actions={
          <Button size="sm" disabled={!perms.canMatch || autoMatch.isPending} onClick={runAutoMatch}>
            {autoMatch.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Auto-match global
          </Button>
        }
      />

      <Tabs defaultValue="ambiguos">
        <TabsList>
          <TabsTrigger value="ambiguos">Activos ambiguos</TabsTrigger>
          <TabsTrigger value="sin-activo">Equipos sin activo</TabsTrigger>
        </TabsList>

        <TabsContent value="ambiguos" className="mt-3">
          <ColaAmbiguos canMatch={perms.canMatch} />
        </TabsContent>
        <TabsContent value="sin-activo" className="mt-3">
          <ColaSinActivo canMatch={perms.canMatch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Cola A: activo ambiguo → equipos candidatos ─────────────────────────── */
function ColaAmbiguos({ canMatch }: { canMatch: boolean }) {
  const ambiguos = useAmbiguos();
  const [sel, setSel] = useState<Ambiguo | null>(null);
  const candidatos = useActivoCandidatos(sel?.txt_act_fijo ?? '', !!sel);
  const match = useMatch();
  const { toast } = useToast();

  const vincular = async (equipo: Equipo) => {
    if (!sel) return;
    try {
      await match.mutateAsync({
        actFijo: sel.txt_act_fijo,
        payload: { idEquipo: equipo.id_equipo, matchTipo: 'manual', matchConfianza: 'media', nota: 'Emparejamiento manual (ambiguo)' },
      });
      toast.success(`Vinculado ${sel.txt_act_fijo} ↔ equipo #${equipo.id_equipo}.`);
      setSel(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo vincular.');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Activos con serie ambigua</CardTitle></CardHeader>
        <CardContent className="max-h-[560px] overflow-auto p-0">
          {ambiguos.isLoading ? <Loading /> : ambiguos.isError ? <ErrorState error={ambiguos.error} /> : !ambiguos.data?.length ? (
            <EmptyState message="No hay activos ambiguos." />
          ) : (
            <ul className="divide-y">
              {ambiguos.data.map((a) => (
                <li key={a.id_activo_contable}>
                  <button
                    onClick={() => setSel(a)}
                    className={cn('flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted',
                      sel?.id_activo_contable === a.id_activo_contable && 'bg-primary/10')}
                  >
                    <div>
                      <div className="font-mono text-xs font-medium">{a.txt_act_fijo}</div>
                      <div className="text-xs text-muted-foreground">serie {a.txt_serie_match}</div>
                    </div>
                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-200">
                      {a.equipos_coincidentes} equipos
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {sel ? `Candidatos físicos para ${sel.txt_act_fijo}` : 'Selecciona un activo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!sel ? <EmptyState message="Elige un activo de la izquierda para ver sus equipos candidatos." /> :
            candidatos.isLoading ? <Loading /> : !candidatos.data?.length ? <EmptyState message="Sin equipos candidatos por serie." /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Serie</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidatos.data.map((e) => (
                    <TableRow key={e.id_equipo}>
                      <TableCell><span className="text-xs text-muted-foreground">Coincidencia por serie</span></TableCell>
                      <TableCell className="font-mono text-xs">{e.txt_numero_serie || '—'}</TableCell>
                      <TableCell className="text-sm">{e.txt_fabricante} {e.txt_modelo}</TableCell>
                      <TableCell className="text-xs">{e.empleado_nombre ?? (e.int_fk_empleado ? `#${e.int_fk_empleado}` : '—')}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" disabled={!canMatch || match.isPending} onClick={() => vincular(e)}>
                          <Link2 className="mr-2 h-4 w-4" /> Vincular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Cola B: equipo sin activo → activos candidatos ──────────────────────── */
function ColaSinActivo({ canMatch }: { canMatch: boolean }) {
  const equipos = useEquiposSinActivo();
  const [sel, setSel] = useState<Equipo | null>(null);
  const candidatos = useEquipoCandidatosActivo(sel?.id_equipo ?? null);
  const match = useMatch();
  const { toast } = useToast();

  const vincular = async (activo: ActivoContable) => {
    if (!sel) return;
    try {
      await match.mutateAsync({
        actFijo: activo.txt_act_fijo,
        payload: { idEquipo: sel.id_equipo, matchTipo: 'manual', matchConfianza: 'media', nota: 'Emparejamiento manual (equipo sin activo)' },
      });
      toast.success(`Vinculado ${activo.txt_act_fijo} ↔ equipo #${sel.id_equipo}.`);
      setSel(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo vincular.');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Equipos sin activo contable</CardTitle></CardHeader>
        <CardContent className="max-h-[560px] overflow-auto p-0">
          {equipos.isLoading ? <Loading /> : equipos.isError ? <ErrorState error={equipos.error} /> : !equipos.data?.length ? (
            <EmptyState message="Todos los equipos tienen activo." />
          ) : (
            <ul className="divide-y">
              {equipos.data.map((e) => (
                <li key={e.id_equipo}>
                  <button
                    onClick={() => setSel(e)}
                    className={cn('flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted',
                      sel?.id_equipo === e.id_equipo && 'bg-primary/10')}
                  >
                    <span className="font-medium">#{e.id_equipo} · {e.txt_nombre_equipo || e.txt_modelo}</span>
                    <span className="text-xs text-muted-foreground">serie {e.txt_numero_serie || '—'} · {e.txt_fabricante} {e.txt_modelo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {sel ? `Activos candidatos para equipo #${sel.id_equipo}` : 'Selecciona un equipo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!sel ? <EmptyState message="Elige un equipo de la izquierda." /> :
            candidatos.isLoading ? <Loading /> : !candidatos.data?.length ? (
              <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
                <GitCompareArrows className="h-6 w-6" />
                Sin activos candidatos por serie. Este equipo podría ser nuevo.
                <Button size="sm" variant="outline" asChild><Link href="/page/conciliacion/por-registrar">Ir a "Por registrar"</Link></Button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Act.fijo</TableHead>
                    <TableHead>Denominación</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidatos.data.map((a) => (
                    <TableRow key={a.id_activo_contable}>
                      <TableCell className="font-mono text-xs">{a.txt_act_fijo}</TableCell>
                      <TableCell className="max-w-[240px]"><span className="line-clamp-2 text-sm">{a.txt_denominacion_activo}</span></TableCell>
                      <TableCell className="text-xs">{TIPO_ACTIVO_LABEL[a.txt_tipo_activo]}</TableCell>
                      <TableCell><EstadoBusquedaBadge estado={a.txt_estado_busqueda} /></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" disabled={!canMatch || match.isPending} onClick={() => vincular(a)}>
                          <Link2 className="mr-2 h-4 w-4" /> Vincular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
