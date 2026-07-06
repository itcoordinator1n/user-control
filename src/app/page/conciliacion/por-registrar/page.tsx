'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet, Download, Mail, PackagePlus, Loader2, Search, GitCompareArrows,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePorRegistrar, useRegistrarEquipo, useToken } from '@/hooks/useConciliacionQueries';
import { useConciliacionPerms } from '../_hooks/use-conciliacion-perms';
import { useToast } from '@/hooks/useToast';
import { PageHeader, Loading, ErrorState, EmptyState } from '../_components/shared';
import { fmtFecha } from '../_lib/format';
import { exportarExcel, descargarCsv, type ExportColumn } from '@/lib/conciliacion-export';
import { downloadPorRegistrarCsv } from '@/lib/equipos-api';
import type { PorRegistrar } from '@/types/conciliacion';

const COLS: ExportColumn<PorRegistrar>[] = [
  { key: 'id_equipo', header: 'ID equipo' },
  { key: 'txt_numero_serie', header: 'N/Serie' },
  { key: 'txt_fabricante', header: 'Fabricante' },
  { key: 'txt_modelo', header: 'Modelo' },
  { key: 'txt_tipo_chasis', header: 'Chasis' },
  { key: 'txt_denominacion_sugerida', header: 'Denominación sugerida' },
  { key: 'int_fk_empleado', header: 'Usuario (id)' },
  { key: 'int_fk_area', header: 'Área (id)' },
  { key: 'dte_alta', header: 'Fecha 1ª captura', format: (r) => fmtFecha(r.dte_alta) },
  { key: 'txt_estado_registro', header: 'Estado registro' },
  { key: 'txt_act_fijo_asignado', header: 'Act.fijo asignado' },
];

export default function PorRegistrarPage() {
  const token = useToken();
  const { toast } = useToast();
  const perms = useConciliacionPerms();
  const { data, isLoading, isError, error } = usePorRegistrar();
  const registrar = useRegistrarEquipo();

  const [q, setQ] = useState('');
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((r) =>
        (r.txt_nombre_equipo ?? '').toLowerCase().includes(t) ||
        (r.txt_numero_serie ?? '').toLowerCase().includes(t) ||
        (r.txt_modelo ?? '').toLowerCase().includes(t) ||
        (r.txt_denominacion_sugerida ?? '').toLowerCase().includes(t));
    }
    return list;
  }, [data, q]);

  const marcarRegistrado = async (r: PorRegistrar) => {
    const actFijo = (edits[r.id_equipo] ?? r.txt_act_fijo_asignado ?? '').trim();
    if (!actFijo) { toast.error('Ingresa el Act.fijo a asignar antes de registrar.'); return; }
    setSavingId(r.id_equipo);
    try {
      await registrar.mutateAsync({ id: r.id_equipo, actFijoAsignado: actFijo });
      toast.success(`Equipo #${r.id_equipo} registrado con act.fijo ${actFijo}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar.');
    } finally {
      setSavingId(null);
    }
  };

  const doExcel = async () => {
    if (!rows.length) return toast.info('No hay filas.');
    try { await exportarExcel(rows, COLS, 'por_registrar', 'Por registrar'); toast.success('Excel generado.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Error al exportar.'); }
  };
  const doCsv = async () => {
    setDownloadingCsv(true);
    try { await descargarCsv(() => downloadPorRegistrarCsv(token), 'por_registrar'); toast.success('CSV descargado.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Error al descargar.'); }
    finally { setDownloadingCsv(false); }
  };
  const notificar = () => {
    const asunto = encodeURIComponent(`Equipos nuevos por registrar (${rows.length})`);
    const cuerpo = encodeURIComponent(`Estimados,\n\nAdjunto la relación de ${rows.length} equipos físicos sin activo fijo, pendientes de inventariar.\n\nSaludos.`);
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
  };

  return (
    <div>
      <PageHeader
        title="Nuevos por registrar"
        description="Equipos físicos sin activo contable. Contabilidad asigna el Act.fijo para inventariarlos."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={doExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
            <Button size="sm" variant="outline" onClick={doCsv} disabled={downloadingCsv}>
              {downloadingCsv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} CSV
            </Button>
            <Button size="sm" variant="outline" onClick={notificar}><Mail className="mr-2 h-4 w-4" /> Notificar</Button>
          </>
        }
      />

      <Card className="mb-3 p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Serie, modelo, nombre o denominación…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : !rows.length ? <EmptyState message="No hay equipos por registrar." /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>N/Serie</TableHead>
                  <TableHead>Fabricante / Modelo</TableHead>
                  <TableHead>Denominación sugerida</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>1ª captura</TableHead>
                  <TableHead>¿Notificado?</TableHead>
                  <TableHead className="w-[160px]">Act.fijo asignado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const yaRegistrado = r.txt_estado_registro === 'registrado';
                  return (
                    <TableRow key={r.id_equipo}>
                      <TableCell>
                        <div className="text-sm font-medium">#{r.id_equipo} · {r.txt_nombre_equipo || '—'}</div>
                        <div className="text-xs text-muted-foreground">{r.txt_tipo_chasis || ''}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.txt_numero_serie || '—'}</TableCell>
                      <TableCell className="text-sm">{r.txt_fabricante} {r.txt_modelo}</TableCell>
                      <TableCell className="max-w-[220px]"><span className="line-clamp-2 text-sm">{r.txt_denominacion_sugerida}</span></TableCell>
                      <TableCell className="text-xs">{r.int_fk_empleado ? `#${r.int_fk_empleado}` : '—'}</TableCell>
                      <TableCell className="text-xs">{fmtFecha(r.dte_alta)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {r.txt_estado_registro}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8"
                          placeholder="Act.fijo…"
                          value={edits[r.id_equipo] ?? r.txt_act_fijo_asignado ?? ''}
                          onChange={(e) => setEdits((m) => ({ ...m, [r.id_equipo]: e.target.value }))}
                          disabled={!perms.canRegistrar || yaRegistrado}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" disabled={!perms.canRegistrar || yaRegistrado || savingId === r.id_equipo}
                            onClick={() => marcarRegistrado(r)}>
                            {savingId === r.id_equipo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackagePlus className="mr-2 h-4 w-4" />}
                            {yaRegistrado ? 'Registrado' : 'Registrar'}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" asChild title="Emparejar manual">
                            <Link href="/page/conciliacion/emparejamiento"><GitCompareArrows className="h-4 w-4" /></Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <p className="mt-3 text-xs text-muted-foreground">
        Usuario/Área se muestran como ID (las vistas del backend aún no unen el nombre — follow-up Fase A).
        "Notificar" usa mailto (endpoint formal = follow-up Fase B).
      </p>
    </div>
  );
}
