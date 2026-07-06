'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Link2, PackageX, Pencil, Unlink, CheckCircle2, AlertTriangle,
  Cpu, HardDrive, MemoryStick, Monitor, History,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  useActivoDetalle, useEquipoCapturas, useUnmatch,
} from '@/hooks/useConciliacionQueries';
import { useConciliacionPerms } from '../../_hooks/use-conciliacion-perms';
import { useToast } from '@/hooks/useToast';
import { Loading, ErrorState } from '../../_components/shared';
import { EstadoBusquedaBadge, AccionBadge, MatchBadge, WindowsBadge } from '../../_components/badges';
import { MarcarEncontradoDialog } from '../../_components/marcar-encontrado-dialog';
import { MarcarNoEncontradoDialog } from '../../_components/marcar-no-encontrado-dialog';
import { EditarActivoDialog } from '../../_components/editar-activo-dialog';
import { fmtMoneda, fmtFecha, fmtFechaHora, TIPO_ACTIVO_LABEL, ESTADO_CONTABLE_LABEL } from '../../_lib/format';
import type { ActivoContable, Equipo } from '@/types/conciliacion';

function Field({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'text-right font-medium'}>{value ?? '—'}</span>
    </div>
  );
}

export default function ActivoDetallePage() {
  const params = useParams<{ actFijo: string }>();
  const actFijo = decodeURIComponent(params.actFijo);
  const { toast } = useToast();
  const perms = useConciliacionPerms();

  const { data, isLoading, isError, error } = useActivoDetalle(actFijo);
  const equipoId = data?.equipo?.id_equipo ?? null;
  const capturas = useEquipoCapturas(equipoId);
  const unmatch = useUnmatch();

  const [encontrar, setEncontrar] = useState(false);
  const [noEncontrar, setNoEncontrar] = useState(false);
  const [editar, setEditar] = useState(false);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState error={error} />;
  if (!data) return <ErrorState error="Activo no encontrado." />;

  const { activo, equipo, historial } = data;
  const vigente = historial.find((h) => h.bln_vigente === 1) ?? null;

  const serieCoincide = !!equipo && !!activo.txt_serie_match && equipo.txt_serie_norm === activo.txt_serie_match;
  const serieDiscrepa = !!equipo && !!activo.txt_serie_match && !!equipo.txt_serie_norm && equipo.txt_serie_norm !== activo.txt_serie_match;

  const deshacer = async () => {
    try {
      await unmatch.mutateAsync({ actFijo, nuevoEstado: 'pendiente' });
      toast.success('Match deshecho (activo vuelve a pendiente).');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo deshacer.');
    }
  };

  const activoForDialogs: ActivoContable = activo;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/page/conciliacion/campana"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="font-mono text-lg font-semibold">{activo.txt_act_fijo}</h1>
            <p className="text-sm text-muted-foreground">{activo.txt_denominacion_activo}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EstadoBusquedaBadge estado={activo.txt_estado_busqueda} />
          <Button size="sm" variant="outline" disabled={!perms.canMatch} onClick={() => setEditar(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button size="sm" variant="outline" disabled={!perms.canMatch} onClick={() => setEncontrar(true)}>
            <Link2 className="mr-2 h-4 w-4" /> {equipo ? 'Cambiar match' : 'Marcar encontrado'}
          </Button>
          {equipo ? (
            <Button size="sm" variant="outline" disabled={!perms.canMatch || unmatch.isPending} onClick={deshacer}>
              <Unlink className="mr-2 h-4 w-4" /> Deshacer match
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={!perms.canMatch} onClick={() => setNoEncontrar(true)}>
              <PackageX className="mr-2 h-4 w-4" /> No encontrado
            </Button>
          )}
        </div>
      </div>

      {/* Barra de match */}
      <Card className={`mb-4 p-3 ${equipo ? 'border-emerald-300 dark:border-emerald-800' : 'border-amber-300 dark:border-amber-800'}`}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {equipo ? (
            <>
              <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Conciliado con equipo #{equipo.id_equipo}
              </span>
              <MatchBadge tipo={activo.txt_match_tipo} confianza={activo.txt_match_confianza} />
              <span className="text-muted-foreground">Por: <b>{vigente?.int_fk_empleado_usuario ?? '—'}</b></span>
              <span className="text-muted-foreground">Fecha: {fmtFechaHora(activo.dte_conciliado)}</span>
              {serieCoincide && (
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Serie coincide</span>
              )}
              {serieDiscrepa && (
                <span className="flex items-center gap-1 text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> Serie discrepa</span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" /> Sin equipo vinculado
            </span>
          )}
        </div>
      </Card>

      {/* Paneles */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Contable (SAP)</CardTitle></CardHeader>
          <CardContent>
            <Field label="Act.fijo" value={activo.txt_act_fijo} mono />
            <Field label="Denominación" value={activo.txt_denominacion_activo} />
            <Field label="Tipo" value={TIPO_ACTIVO_LABEL[activo.txt_tipo_activo]} />
            <Field label="Serie (archivo)" value={activo.txt_serie_original} mono />
            <Field label="Serie de cruce" value={<span className={serieDiscrepa ? 'text-red-600' : ''}>{activo.txt_serie_match ?? '—'}</span>} mono />
            <Field label="Auto-auditable" value={<WindowsBadge auto={activo.bln_auto_auditable} />} />
            <Separator className="my-2" />
            <Field label="Acción contable" value={<AccionBadge accion={activo.txt_accion_contable} />} />
            <Field label="Estado contable" value={ESTADO_CONTABLE_LABEL[activo.txt_estado_contable]} />
            <Field label="CECO" value={activo.txt_ce_coste} />
            <Field label="Denominación CECO" value={activo.txt_denominacion_ceco} />
            <Field label="Valor en libros" value={fmtMoneda(activo.dec_valor_en_libros)} />
            <Separator className="my-2" />
            <Field label="Responsable" value={activo.txt_responsable_nombre} />
            <Field label="Estado TI" value={activo.txt_estado_ti} />
            <p className="mt-1 text-xs text-muted-foreground">Responsable/Área IT: solo-lectura (archivo SAP).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Físico (auditoría)</CardTitle></CardHeader>
          <CardContent>
            {equipo ? <FisicoPanel equipo={equipo} activoSerie={activo.txt_serie_match} /> : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No hay equipo físico vinculado a este activo.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline de capturas */}
      {equipo && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Historial de capturas</CardTitle>
          </CardHeader>
          <CardContent>
            {capturas.isLoading ? <Loading /> : !capturas.data?.length ? (
              <p className="text-sm text-muted-foreground">Sin capturas registradas.</p>
            ) : (
              <ol className="relative ml-2 border-l pl-4">
                {capturas.data.map((c) => (
                  <li key={c.id_captura} className="mb-4 last:mb-0">
                    <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary" />
                    <div className="text-sm font-medium">{fmtFechaHora(c.dte_captura)}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.txt_metodo} · {c.txt_tecnico || 's/técnico'} · {c.txt_so_nombre || '—'}
                      {c.int_ram_total_mb ? ` · ${Math.round(c.int_ram_total_mb / 1024)} GB RAM` : ''}
                      {c.txt_cpu_nombre ? ` · ${c.txt_cpu_nombre}` : ''}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial de match */}
      {historial.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">Historial de vínculos</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {historial.map((h) => (
                <li key={h.id_match} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <MatchBadge tipo={h.txt_tipo_match} confianza={h.txt_confianza} />
                  <span className="text-muted-foreground">equipo #{h.int_fk_equipo}</span>
                  <span className="text-muted-foreground">{fmtFechaHora(h.dte_match)}</span>
                  {h.bln_vigente === 1 && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">vigente</span>}
                  {h.txt_nota && <span className="text-xs text-muted-foreground">· {h.txt_nota}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Diálogos */}
      <MarcarEncontradoDialog activo={activoForDialogs} open={encontrar} onOpenChange={setEncontrar} />
      <MarcarNoEncontradoDialog activo={activoForDialogs} open={noEncontrar} onOpenChange={setNoEncontrar} />
      <EditarActivoDialog activo={activoForDialogs} open={editar} onOpenChange={setEditar} />
    </div>
  );
}

function FisicoPanel({ equipo, activoSerie }: { equipo: Equipo; activoSerie: string | null }) {
  const discrepa = !!activoSerie && !!equipo.txt_serie_norm && equipo.txt_serie_norm !== activoSerie;
  return (
    <>
      <Field label="Equipo" value={`#${equipo.id_equipo} · ${equipo.txt_nombre_equipo ?? ''}`} />
      <Field label="Fabricante / Modelo" value={`${equipo.txt_fabricante ?? ''} ${equipo.txt_modelo ?? ''}`.trim() || '—'} />
      <Field label="Chasis" value={equipo.txt_tipo_chasis} />
      <Field label="N/Serie" value={<span className={discrepa ? 'text-red-600' : ''}>{equipo.txt_numero_serie ?? '—'}</span>} mono />
      <Field label="Serie norm." value={equipo.txt_serie_norm} mono />
      <Field label="Estado" value={equipo.txt_estado} />
      <Field label="Estado registro" value={equipo.txt_estado_registro} />
      <Separator className="my-2" />
      <Field label="Responsable" value={equipo.empleado_nombre ?? (equipo.int_fk_empleado ? `#${equipo.int_fk_empleado}` : null)} />
      <Field label="Área" value={equipo.area_nombre ?? (equipo.int_fk_area ? `#${equipo.int_fk_area}` : null)} />
      <Field label="Alta" value={fmtFecha(equipo.dte_alta)} />
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Cpu className="h-3.5 w-3.5" /> {equipo.txt_modelo || 'CPU'}</span>
        <span className="flex items-center gap-1"><MemoryStick className="h-3.5 w-3.5" /> RAM</span>
        <span className="flex items-center gap-1"><HardDrive className="h-3.5 w-3.5" /> Disco</span>
        <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" /> {equipo.txt_tipo_chasis || '—'}</span>
      </div>
    </>
  );
}
