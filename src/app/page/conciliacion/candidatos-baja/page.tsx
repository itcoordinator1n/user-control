'use client';

import { useMemo, useState } from 'react';
import {
  FileSpreadsheet, FileText, Download, Mail, PackageMinus, Loader2, Search,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useCandidatosBaja, useConfirmarBaja, useToken } from '@/hooks/useConciliacionQueries';
import { useConciliacionPerms } from '../_hooks/use-conciliacion-perms';
import { useToast } from '@/hooks/useToast';
import { PageHeader, Loading, ErrorState, EmptyState } from '../_components/shared';
import { EstadoBusquedaBadge } from '../_components/badges';
import { fmtMoneda, fmtFecha, TIPO_ACTIVO_LABEL } from '../_lib/format';
import {
  exportarExcel, exportarPdfActa, descargarCsv, type ExportColumn,
} from '@/lib/conciliacion-export';
import { downloadCandidatosBajaCsv } from '@/lib/equipos-api';
import type { CandidatoBaja } from '@/types/conciliacion';

const COLS: ExportColumn<CandidatoBaja>[] = [
  { key: 'txt_act_fijo', header: 'Act.fijo' },
  { key: 'txt_serie_match', header: 'Serie' },
  { key: 'txt_denominacion_activo', header: 'Denominación' },
  { key: 'txt_tipo_activo', header: 'Tipo', format: (r) => TIPO_ACTIVO_LABEL[r.txt_tipo_activo] },
  { key: 'txt_ce_coste', header: 'CECO' },
  { key: 'dec_valor_en_libros', header: 'Valor en libros', format: (r) => r.dec_valor_en_libros ?? 0 },
  { key: 'txt_responsable_nombre', header: 'Último responsable' },
  { key: 'txt_motivo', header: 'Motivo' },
  { key: 'txt_estado_busqueda', header: 'Estado' },
];

export default function CandidatosBajaPage() {
  const token = useToken();
  const { toast } = useToast();
  const perms = useConciliacionPerms();
  const { data, isLoading, isError, error } = useCandidatosBaja();
  const confirmar = useConfirmarBaja();

  const [q, setQ] = useState('');
  const [soloConValor, setSoloConValor] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmRow, setConfirmRow] = useState<CandidatoBaja | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((r) =>
        r.txt_act_fijo.toLowerCase().includes(t) ||
        (r.txt_denominacion_activo ?? '').toLowerCase().includes(t) ||
        (r.txt_ce_coste ?? '').toLowerCase().includes(t) ||
        (r.txt_serie_match ?? '').toLowerCase().includes(t));
    }
    if (soloConValor) list = list.filter((r) => (r.dec_valor_en_libros ?? 0) > 0);
    return list;
  }, [data, q, soloConValor]);

  const toggle = (k: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.txt_act_fijo));
  const toggleAll = () => setSelected((s) => {
    const n = new Set(s);
    if (allChecked) rows.forEach((r) => n.delete(r.txt_act_fijo)); else rows.forEach((r) => n.add(r.txt_act_fijo));
    return n;
  });

  const selRows = rows.filter((r) => selected.has(r.txt_act_fijo));
  const target = selRows.length ? selRows : rows;
  const totalValor = target.reduce((sum, r) => sum + (r.dec_valor_en_libros ?? 0), 0);

  const doExcel = async () => {
    if (!target.length) return toast.info('No hay filas.');
    try { await exportarExcel(target, COLS, 'candidatos_baja', 'Candidatos a baja'); toast.success('Excel generado.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Error al exportar.'); }
  };
  const doPdf = () => {
    if (!target.length) return toast.info('No hay filas.');
    try {
      exportarPdfActa(target, COLS, {
        titulo: 'ACTA DE ACTIVOS NO LOCALIZADOS (CANDIDATOS A BAJA)',
        subtitulo: 'Conciliación de activos fijos — Control de Equipos',
        extra: [['Registros', String(target.length)], ['Valor en libros total', fmtMoneda(totalValor)], ['Fecha', fmtFecha(new Date().toISOString())]],
      }, 'acta_candidatos_baja');
      toast.success('PDF generado.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Error al exportar.'); }
  };
  const doCsv = async () => {
    setDownloadingCsv(true);
    try { await descargarCsv(() => downloadCandidatosBajaCsv(token), 'candidatos_baja'); toast.success('CSV descargado.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Error al descargar.'); }
    finally { setDownloadingCsv(false); }
  };

  const notificar = () => {
    const asunto = encodeURIComponent(`Candidatos a baja de activos fijos (${target.length})`);
    const cuerpo = encodeURIComponent(
      `Estimados,\n\nAdjunto la relación de ${target.length} activos no localizados físicamente (candidatos a baja), ` +
      `con un valor en libros total de ${fmtMoneda(totalValor)}.\n\nSe adjunta el acta exportada.\n\nSaludos.`,
    );
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
  };

  const doConfirmar = async () => {
    if (!confirmRow) return;
    try {
      await confirmar.mutateAsync(confirmRow.txt_act_fijo);
      toast.success(`Baja confirmada: ${confirmRow.txt_act_fijo}.`);
      setConfirmRow(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo confirmar.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Candidatos a baja"
        description="Activos en libros no localizados físicamente (solo auto-auditables). Entregable para contabilidad."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={doExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
            <Button size="sm" variant="outline" onClick={doPdf}><FileText className="mr-2 h-4 w-4" /> PDF (acta)</Button>
            <Button size="sm" variant="outline" onClick={doCsv} disabled={downloadingCsv}>
              {downloadingCsv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} CSV
            </Button>
            <Button size="sm" variant="outline" onClick={notificar}><Mail className="mr-2 h-4 w-4" /> Notificar</Button>
          </>
        }
      />

      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Act.fijo, denominación, CECO o serie…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cv" checked={soloConValor} onCheckedChange={setSoloConValor} />
            <Label htmlFor="cv" className="text-sm">Solo con valor</Label>
          </div>
          <div className="ml-auto rounded-md bg-muted px-3 py-1.5 text-sm">
            {selRows.length ? `${selRows.length} sel.` : `${rows.length} filas`} · Valor:{' '}
            <span className="font-semibold tabular-nums">{fmtMoneda(totalValor)}</span>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : !rows.length ? <EmptyState message="No hay candidatos a baja." /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[36px]"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead>Act.fijo</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Denominación</TableHead>
                  <TableHead>CECO</TableHead>
                  <TableHead className="text-right">Valor libros</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.txt_act_fijo} data-state={selected.has(r.txt_act_fijo) ? 'selected' : undefined}>
                    <TableCell><Checkbox checked={selected.has(r.txt_act_fijo)} onCheckedChange={() => toggle(r.txt_act_fijo)} /></TableCell>
                    <TableCell className="font-mono text-xs">{r.txt_act_fijo}</TableCell>
                    <TableCell className="font-mono text-xs">{r.txt_serie_match || r.txt_serie_original || '—'}</TableCell>
                    <TableCell className="max-w-[240px]"><span className="line-clamp-2 text-sm">{r.txt_denominacion_activo}</span></TableCell>
                    <TableCell className="text-xs">{r.txt_ce_coste || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoneda(r.dec_valor_en_libros)}</TableCell>
                    <TableCell className="max-w-[140px]"><span className="line-clamp-1 text-xs">{r.txt_responsable_nombre || '—'}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.txt_motivo}</TableCell>
                    <TableCell><EstadoBusquedaBadge estado={r.txt_estado_busqueda} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={!perms.canConfirmarBaja} onClick={() => setConfirmRow(r)}>
                        <PackageMinus className="mr-2 h-4 w-4" /> Confirmar baja
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <p className="mt-3 text-xs text-muted-foreground">
        "Notificar" abre un correo (mailto) con el resumen; adjunta el acta exportada manualmente.
        Un endpoint de notificación formal es un follow-up del backend (Fase B).
      </p>

      <Dialog open={!!confirmRow} onOpenChange={(v) => !v && setConfirmRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar baja contable</DialogTitle>
            <DialogDescription>
              Se marcará <b>{confirmRow?.txt_act_fijo}</b> ({confirmRow?.txt_denominacion_activo}) como
              <b> baja confirmada</b>. Valor en libros: {fmtMoneda(confirmRow?.dec_valor_en_libros)}. Esta acción la realiza Contabilidad.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRow(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={doConfirmar} disabled={confirmar.isPending}>
              {confirmar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageMinus className="mr-2 h-4 w-4" />}
              Confirmar baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
