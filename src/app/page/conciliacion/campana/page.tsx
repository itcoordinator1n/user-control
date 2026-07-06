'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import {
  Search, X, MoreHorizontal, Eye, Link2, PackageX, Pencil, GitCompareArrows,
  FileSpreadsheet, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

import { useActivos, usePatchActivo } from '@/hooks/useConciliacionQueries';
import { useConciliacionPerms } from '../_hooks/use-conciliacion-perms';
import { useToast } from '@/hooks/useToast';
import { PageHeader, Loading, ErrorState, EmptyState } from '../_components/shared';
import { EstadoBusquedaBadge, SerieCell, WindowsBadge, MatchBadge } from '../_components/badges';
import { MarcarEncontradoDialog } from '../_components/marcar-encontrado-dialog';
import { MarcarNoEncontradoDialog } from '../_components/marcar-no-encontrado-dialog';
import { EditarActivoDialog } from '../_components/editar-activo-dialog';
import { BulkNoEncontradoDialog } from '../_components/bulk-no-encontrado-dialog';
import {
  ESTADO_BUSQUEDA_OPTS, ESTADO_BUSQUEDA_LABEL, TIPO_ACTIVO_OPTS, TIPO_ACTIVO_LABEL,
  ACCION_OPTS, ACCION_LABEL,
} from '../_lib/format';
import { exportarExcel } from '@/lib/conciliacion-export';
import type { ActivoContable, EstadoBusqueda, TipoActivo, AccionContable } from '@/types/conciliacion';

const LIMITE = 50;
const ALL = '__all__';

function CampanaInner() {
  const params = useSearchParams();
  const { toast } = useToast();
  const perms = useConciliacionPerms();
  const patch = usePatchActivo();

  // Filtros (server)
  const [q, setQ] = useState('');
  const [debouncedQ] = useDebounce(q, 400);
  const [estado, setEstado] = useState<EstadoBusqueda | ''>('');
  const [tipo, setTipo] = useState<TipoActivo | ''>('');
  const [ceco, setCeco] = useState('');
  const [debouncedCeco] = useDebounce(ceco, 400);
  const [windows, setWindows] = useState(false);
  // Filtro client-side (la lista no soporta accion en server)
  const [accion, setAccion] = useState<AccionContable | ''>('');
  const [page, setPage] = useState(0);

  // Prefiltro desde los KPI (?estado=)
  useEffect(() => {
    const e = params.get('estado');
    if (e && ESTADO_BUSQUEDA_OPTS.includes(e as EstadoBusqueda)) setEstado(e as EstadoBusqueda);
  }, [params]);

  // Reset de página al cambiar filtros
  useEffect(() => { setPage(0); }, [debouncedQ, estado, tipo, debouncedCeco, windows]);

  const { data, isLoading, isError, error, isFetching } = useActivos({
    q: debouncedQ || undefined,
    estado: estado || undefined,
    tipo: tipo || undefined,
    ceco: debouncedCeco || undefined,
    autoAuditable: windows || undefined,
    limite: LIMITE,
    offset: page * LIMITE,
  });

  // Filtro por acción aplicado sobre la página actual (interino)
  const rows = useMemo(() => {
    const list = data ?? [];
    return accion ? list.filter((a) => a.txt_accion_contable === accion) : list;
  }, [data, accion]);

  // Selección (por página)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (actFijo: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(actFijo)) n.delete(actFijo); else n.add(actFijo);
    return n;
  });
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.txt_act_fijo));
  const toggleAll = () => setSelected((s) => {
    const n = new Set(s);
    if (allChecked) rows.forEach((r) => n.delete(r.txt_act_fijo));
    else rows.forEach((r) => n.add(r.txt_act_fijo));
    return n;
  });

  // Diálogos
  const [encontrar, setEncontrar] = useState<ActivoContable | null>(null);
  const [noEncontrar, setNoEncontrar] = useState<ActivoContable | null>(null);
  const [editar, setEditar] = useState<ActivoContable | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [savingAccion, setSavingAccion] = useState<string | null>(null);
  const cambiarAccion = async (activo: ActivoContable, nueva: AccionContable) => {
    setSavingAccion(activo.txt_act_fijo);
    try {
      await patch.mutateAsync({ actFijo: activo.txt_act_fijo, body: { txt_accion_contable: nueva } });
      toast.success('Acción actualizada.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo actualizar.');
    } finally {
      setSavingAccion(null);
    }
  };

  const limpiar = () => {
    setQ(''); setEstado(''); setTipo(''); setCeco(''); setWindows(false); setAccion('');
  };

  const exportarSeleccion = async () => {
    const sel = rows.filter((r) => selected.has(r.txt_act_fijo));
    const target = sel.length ? sel : rows;
    if (!target.length) { toast.info('No hay filas para exportar.'); return; }
    try {
      await exportarExcel<ActivoContable>(target, [
        { key: 'txt_act_fijo', header: 'Act.fijo' },
        { key: 'txt_serie_match', header: 'Serie' },
        { key: 'txt_denominacion_activo', header: 'Denominación' },
        { key: 'txt_ce_coste', header: 'CECO' },
        { key: 'txt_accion_contable', header: 'Acción', format: (r) => ACCION_LABEL[r.txt_accion_contable] },
        { key: 'txt_estado_busqueda', header: 'Estado', format: (r) => ESTADO_BUSQUEDA_LABEL[r.txt_estado_busqueda] },
        { key: 'txt_responsable_nombre', header: 'Responsable' },
        { key: 'dec_valor_en_libros', header: 'Valor libros', format: (r) => r.dec_valor_en_libros ?? 0 },
      ], 'campana_busqueda', 'Activos');
      toast.success('Exportado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo exportar.');
    }
  };

  const selCount = rows.filter((r) => selected.has(r.txt_act_fijo)).length;

  return (
    <div>
      <PageHeader
        title="Campaña de búsqueda"
        description="Trabajo de IT: localizar físicamente cada activo del archivo contable."
        actions={
          <Button variant="outline" size="sm" onClick={exportarSeleccion}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar {selCount > 0 ? `(${selCount})` : ''}
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="mb-3 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Serie, act.fijo o denominación…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={estado || ALL} onValueChange={(v) => setEstado(v === ALL ? '' : (v as EstadoBusqueda))}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {ESTADO_BUSQUEDA_OPTS.map((e) => <SelectItem key={e} value={e}>{ESTADO_BUSQUEDA_LABEL[e]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={tipo || ALL} onValueChange={(v) => setTipo(v === ALL ? '' : (v as TipoActivo))}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {TIPO_ACTIVO_OPTS.map((t) => <SelectItem key={t} value={t}>{TIPO_ACTIVO_LABEL[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">CECO</Label>
            <Input className="w-[120px]" placeholder="CECO" value={ceco} onChange={(e) => setCeco(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Acción</Label>
            <Select value={accion || ALL} onValueChange={(v) => setAccion(v === ALL ? '' : (v as AccionContable))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {ACCION_OPTS.map((a) => <SelectItem key={a} value={a}>{ACCION_LABEL[a]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Switch id="win" checked={windows} onCheckedChange={setWindows} />
            <Label htmlFor="win" className="text-sm">Solo Windows</Label>
          </div>

          <Button variant="ghost" size="sm" onClick={limpiar} className="pb-2">
            <X className="mr-1 h-4 w-4" /> Limpiar
          </Button>
        </div>
      </Card>

      {/* Toolbar masivo */}
      {selCount > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selCount} seleccionados</span>
          <div className="flex-1" />
          <Button size="sm" variant="destructive" disabled={!perms.canMatch} onClick={() => setBulkOpen(true)}>
            <PackageX className="mr-2 h-4 w-4" /> Marcar no encontrado
          </Button>
          <Button size="sm" variant="outline" onClick={exportarSeleccion}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar selección
          </Button>
        </div>
      )}

      {/* Tabla */}
      <Card className="overflow-hidden">
        {isLoading ? <Loading /> : isError ? <ErrorState error={error} /> : !rows.length ? <EmptyState message="No hay activos con esos filtros." /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[36px]">
                    <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Seleccionar todo" />
                  </TableHead>
                  <TableHead>Act.fijo</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Denominación</TableHead>
                  <TableHead>CECO</TableHead>
                  <TableHead className="w-[150px]">Acción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Win</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.txt_act_fijo} data-state={selected.has(a.txt_act_fijo) ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox checked={selected.has(a.txt_act_fijo)} onCheckedChange={() => toggle(a.txt_act_fijo)} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/page/conciliacion/activos/${encodeURIComponent(a.txt_act_fijo)}`}
                        className="font-mono text-xs font-medium text-primary hover:underline">
                        {a.txt_act_fijo}
                      </Link>
                    </TableCell>
                    <TableCell><SerieCell serieOriginal={a.txt_serie_original} serieMatch={a.txt_serie_match} /></TableCell>
                    <TableCell className="max-w-[240px]">
                      <span className="line-clamp-2 text-sm" title={a.txt_denominacion_activo ?? ''}>
                        {a.txt_denominacion_activo || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{a.txt_ce_coste || '—'}</div>
                      <div className="text-muted-foreground line-clamp-1">{a.txt_denominacion_ceco || ''}</div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={a.txt_accion_contable}
                        disabled={!perms.canMatch || savingAccion === a.txt_act_fijo}
                        onValueChange={(v) => cambiarAccion(a, v as AccionContable)}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACCION_OPTS.map((ac) => <SelectItem key={ac} value={ac}>{ACCION_LABEL[ac]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><EstadoBusquedaBadge estado={a.txt_estado_busqueda} /></TableCell>
                    <TableCell><WindowsBadge auto={a.bln_auto_auditable} /></TableCell>
                    <TableCell className="max-w-[140px]">
                      <span className="line-clamp-1 text-xs" title={a.txt_responsable_nombre ?? ''}>
                        {a.txt_responsable_nombre || '—'}
                      </span>
                    </TableCell>
                    <TableCell><MatchBadge tipo={a.txt_match_tipo} confianza={a.txt_match_confianza} /></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/page/conciliacion/activos/${encodeURIComponent(a.txt_act_fijo)}`}>
                              <Eye className="mr-2 h-4 w-4" /> Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!perms.canMatch} onClick={() => setEncontrar(a)}>
                            <Link2 className="mr-2 h-4 w-4" /> Marcar encontrado
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!perms.canMatch} onClick={() => setNoEncontrar(a)}>
                            <PackageX className="mr-2 h-4 w-4" /> Marcar no encontrado
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!perms.canMatch} onClick={() => setEditar(a)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar campos IT
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/page/conciliacion/emparejamiento">
                              <GitCompareArrows className="mr-2 h-4 w-4" /> Emparejar manual
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Paginación (offset; el backend no devuelve total) */}
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {rows.length > 0 && `Mostrando ${page * LIMITE + 1}–${page * LIMITE + rows.length}`}
          {isFetching && ' · actualizando…'}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <span className="tabular-nums">Página {page + 1}</span>
          <Button variant="outline" size="sm" disabled={(data?.length ?? 0) < LIMITE} onClick={() => setPage((p) => p + 1)}>
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Diálogos */}
      <MarcarEncontradoDialog activo={encontrar} open={!!encontrar} onOpenChange={(v) => !v && setEncontrar(null)} />
      <MarcarNoEncontradoDialog activo={noEncontrar} open={!!noEncontrar} onOpenChange={(v) => !v && setNoEncontrar(null)} />
      <EditarActivoDialog activo={editar} open={!!editar} onOpenChange={(v) => !v && setEditar(null)} />
      <BulkNoEncontradoDialog
        actFijos={rows.filter((r) => selected.has(r.txt_act_fijo)).map((r) => r.txt_act_fijo)}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onDone={() => setSelected(new Set())}
      />
    </div>
  );
}

export default function CampanaPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CampanaInner />
    </Suspense>
  );
}
