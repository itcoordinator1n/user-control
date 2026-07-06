'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Upload, FileUp, Loader2, CheckCircle2, AlertTriangle, Database, RotateCcw, Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useImport, useAutoMatch } from '@/hooks/useConciliacionQueries';
import { useConciliacionPerms } from '../_hooks/use-conciliacion-perms';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '../_components/shared';
import { parseArchivoContable } from '@/lib/conciliacion-import';
import type { ImportParseResult, ImportResult, AutoMatchResult } from '@/types/conciliacion';

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-xl font-bold tabular-nums', accent)}>{value}</div>
    </div>
  );
}

export default function ImportarPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const perms = useConciliacionPerms();
  const doImport = useImport();
  const autoMatch = useAutoMatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parse, setParse] = useState<ImportParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [amResult, setAmResult] = useState<AutoMatchResult | null>(null);

  const handleFile = async (file: File) => {
    setResult(null); setAmResult(null); setParse(null); setFileName(file.name); setParsing(true);
    try {
      const r = await parseArchivoContable(file, session?.user?.name ?? session?.user?.email ?? 'web');
      setParse(r);
      toast.success(`Archivo leído: ${r.reporte.filas_total} filas.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo leer el archivo.');
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setParse(null); setFileName(''); setResult(null); setAmResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const confirmar = async () => {
    if (!parse) return;
    try {
      const res = await doImport.mutateAsync({ rows: parse.rows, meta: parse.meta });
      setResult(res);
      toast.success(`Import lote ${res.loteId}: ${res.insertados} nuevos, ${res.actualizados} actualizados.`);
      // El endpoint /import NO corre auto-match → lo disparamos aquí (como el CLI).
      try {
        const am = await autoMatch.mutateAsync(res.loteId);
        setAmResult(am);
        toast.success(`Auto-match: ${am.enlazados} enlazados de ${am.candidatos} candidatos.`);
      } catch (e) {
        toast.error('Import OK, pero el auto-match falló: ' + (e instanceof Error ? e.message : ''));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo importar.');
    }
  };

  const rep = parse?.reporte;
  const busy = doImport.isPending || autoMatch.isPending;

  return (
    <div>
      <PageHeader
        title="Importar archivo contable"
        description="Carga única del export SAP de activos fijos. Se parsea y previsualiza en el navegador antes de confirmar."
      />

      {!perms.canExportar && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" /> No tienes permiso para importar (CONCILIACION:EXPORTAR).
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm">Arrastra el archivo (.tsv, .csv, .xlsx) o</p>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={parsing}>
          {parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
          Seleccionar archivo
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".tsv,.csv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {fileName && <p className="text-xs text-muted-foreground">{fileName}{parse?.delimiter ? ` · delimitador: ${parse.delimiter === '\t' ? 'TAB' : parse.delimiter}` : ''}</p>}
      </div>

      {/* Resultado del import */}
      {result && (
        <Card className="mt-4 border-emerald-300 dark:border-emerald-800">
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div className="text-sm">
              <div className="font-medium">Import completado (lote {result.loteId})</div>
              <div className="text-muted-foreground">
                {result.insertados} nuevos · {result.actualizados} actualizados · {result.sinCambio} sin cambio
                {amResult && ` · auto-match: ${amResult.enlazados}/${amResult.candidatos}`}
              </div>
            </div>
            <Button className="ml-auto" size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Importar otro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {parse && rep && !result && (
        <>
          <Card className="mt-4">
            <CardHeader className="pb-2"><CardTitle className="text-base">Reporte de calidad</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Filas (act.fijo únicos)" value={rep.filas_total} />
                <Stat label="Con serie" value={rep.con_serie} accent="text-emerald-600" />
                <Stat label="Serie 0 / vacía" value={rep.serie_0_o_vacia} accent="text-red-600" />
                <Stat label="Rescatadas del texto" value={rep.rescatadas_del_texto} accent="text-amber-600" />
                <Stat label="Series duplicadas" value={rep.series_duplicadas_grupos} accent="text-purple-600" />
                <Stat label="Act.fijo duplicados" value={rep.act_fijo_duplicados} />
                <Stat label="Auto-auditables" value={rep.auto_auditables} accent="text-sky-600" />
                <Stat label="No auto-auditables" value={rep.no_auto_auditables} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(rep.por_tipo).map(([tipo, n]) => (
                  <span key={tipo} className="rounded-md bg-muted px-2 py-1 text-xs">{tipo}: <b>{n}</b></span>
                ))}
              </div>

              {parse.dupSeries.length > 0 && (
                <div className="mt-4 text-xs text-muted-foreground">
                  <span className="font-medium">Series repetidas (irán a emparejamiento manual):</span>{' '}
                  {parse.dupSeries.slice(0, 15).map(([s, n]) => `${s}×${n}`).join(', ')}
                  {parse.dupSeries.length > 15 && ` … y ${parse.dupSeries.length - 15} más`}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Mapeo */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Mapeo de columnas</CardTitle></CardHeader>
              <CardContent className="max-h-[360px] overflow-auto p-0">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/60">
                    <TableRow><TableHead>Encabezado del archivo</TableHead><TableHead>Campo destino</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {parse.mapeo.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{m.header || <em className="text-muted-foreground">(vacío)</em>}</TableCell>
                        <TableCell className="text-xs">
                          {m.dest
                            ? <span className="font-mono">{m.dest}</span>
                            : <span className="text-muted-foreground">(ignorada)</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Preview de filas */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Vista previa (primeras 10)</CardTitle></CardHeader>
              <CardContent className="max-h-[360px] overflow-auto p-0">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/60">
                    <TableRow><TableHead>Act.fijo</TableHead><TableHead>Denominación</TableHead><TableHead>Serie</TableHead><TableHead>Tipo</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {parse.rows.slice(0, 10).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{String(r.txt_act_fijo ?? '')}</TableCell>
                        <TableCell className="max-w-[200px]"><span className="line-clamp-1 text-sm">{String(r.txt_denominacion_activo ?? '')}</span></TableCell>
                        <TableCell className="font-mono text-xs">{String(r.txt_serie_original ?? '') || '—'}</TableCell>
                        <TableCell className="text-xs">{String(r.txt_tipo_activo ?? '')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={reset} disabled={busy}>Cancelar</Button>
            <Button onClick={confirmar} disabled={!perms.canExportar || busy || rep.filas_total === 0}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Confirmar import ({rep.filas_total} filas)
              {autoMatch.isPending && <span className="ml-1 inline-flex items-center"><Zap className="ml-1 h-3.5 w-3.5" /></span>}
            </Button>
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        El backend expone un único <code>POST /import</code> (recibe filas JSON) y no persiste un log consultable ni
        corre auto-match por sí solo; aquí se parsea/previsualiza en el navegador, se envían las filas y luego se
        dispara el auto-match. Un flujo <code>preview/confirm/log</code> server-side es un follow-up (Fase C).
      </p>
    </div>
  );
}
