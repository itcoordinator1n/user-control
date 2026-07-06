'use client';

import {
  CheckCircle2, PackageMinus, PackagePlus, ClipboardCheck, GitCompareArrows,
  Boxes, FileSpreadsheet,
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  useResumen, useResumenPorCeco, useResumenPorAccion, useAmbiguos,
} from '@/hooks/useConciliacionQueries';
import { useToast } from '@/hooks/useToast';
import { KpiCard } from './_components/kpi-card';
import { PageHeader, Loading, ErrorState } from './_components/shared';
import { fmtMoneda, ACCION_LABEL } from './_lib/format';
import { exportarExcel } from '@/lib/conciliacion-export';
import type { ResumenPorCeco } from '@/types/conciliacion';

export default function ResumenPage() {
  const { toast } = useToast();
  const resumen = useResumen();
  const porCeco = useResumenPorCeco();
  const porAccion = useResumenPorAccion();
  const ambiguos = useAmbiguos();

  const r = resumen.data;
  const total = r?.total_activos ?? 0;
  const conciliado = r?.conciliado ?? 0;
  const avance = total > 0 ? Math.round((conciliado / total) * 100) : 0;

  const exportarCeco = async () => {
    if (!porCeco.data?.length) { toast.info('No hay datos por CECO para exportar.'); return; }
    try {
      await exportarExcel<ResumenPorCeco>(
        porCeco.data,
        [
          { key: 'txt_ce_coste', header: 'CECO' },
          { key: 'txt_denominacion_ceco', header: 'Denominación CECO' },
          { key: 'total', header: 'Total' },
          { key: 'conciliado', header: 'Conciliados' },
          { key: 'baja', header: 'Candidatos baja' },
          { key: 'baja_confirmada', header: 'Baja confirmada' },
          { key: 'valor_en_libros', header: 'Valor en libros', format: (x) => x.valor_en_libros ?? 0 },
        ],
        'resumen_conciliacion_por_ceco',
        'Resumen CECO',
      );
      toast.success('Resumen exportado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo exportar.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Resumen de conciliación"
        description="Avance del cruce entre activos contables (SAP) e inventario físico (auditoría IT)."
        actions={
          <Button variant="outline" size="sm" onClick={exportarCeco}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar resumen
          </Button>
        }
      />

      {resumen.isLoading ? (
        <Loading />
      ) : resumen.isError ? (
        <ErrorState error={resumen.error} />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total en libros" value={total} icon={Boxes} href="/page/conciliacion/campana" />
            <KpiCard label="Conciliados" value={conciliado} accent="emerald" icon={CheckCircle2}
              href="/page/conciliacion/campana?estado=encontrado" />
            <KpiCard label="Candidatos a baja" value={r?.en_libros_no_encontrado ?? 0} accent="red" icon={PackageMinus}
              href="/page/conciliacion/candidatos-baja" />
            <KpiCard label="Nuevos por registrar" value={r?.nuevo_no_en_libros ?? 0} accent="sky" icon={PackagePlus}
              href="/page/conciliacion/por-registrar" />
            <KpiCard label="Revisión manual" value={r?.revision_manual ?? 0} accent="amber" icon={ClipboardCheck}
              href="/page/conciliacion/campana" />
            <KpiCard label="Ambiguos" value={ambiguos.isLoading ? '…' : (ambiguos.data?.length ?? 0)} accent="purple"
              icon={GitCompareArrows} href="/page/conciliacion/emparejamiento" />
          </div>

          {/* Barra de avance */}
          <Card className="mt-4 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Avance de conciliación</span>
              <span className="tabular-nums text-muted-foreground">
                {conciliado} / {total} · {avance}%
              </span>
            </div>
            <Progress value={avance} className="h-3" />
          </Card>

          {/* Desgloses */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Por CECO */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Por CECO / área</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-auto p-0">
                {porCeco.isLoading ? <Loading /> : porCeco.isError ? <ErrorState error={porCeco.error} /> : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/60">
                      <TableRow>
                        <TableHead>CECO</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Conc.</TableHead>
                        <TableHead className="text-right">Baja</TableHead>
                        <TableHead className="text-right">Valor libros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {porCeco.data?.map((row, i) => (
                        <TableRow key={`${row.txt_ce_coste ?? 'sc'}-${i}`}>
                          <TableCell>
                            <div className="text-sm font-medium">{row.txt_ce_coste || '—'}</div>
                            <div className="text-xs text-muted-foreground">{row.txt_denominacion_ceco || ''}</div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{row.conciliado}</TableCell>
                          <TableCell className="text-right tabular-nums text-red-600">{row.baja}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtMoneda(row.valor_en_libros)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Por acción contable */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Por acción contable × hallazgo</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-auto p-0">
                {porAccion.isLoading ? <Loading /> : porAccion.isError ? <ErrorState error={porAccion.error} /> : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/60">
                      <TableRow>
                        <TableHead>Acción SAP</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Conciliados</TableHead>
                        <TableHead className="text-right">% avance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {porAccion.data?.map((row, i) => {
                        const pct = row.total > 0 ? Math.round((row.conciliado / row.total) * 100) : 0;
                        return (
                          <TableRow key={`${row.txt_accion_contable ?? 'na'}-${i}`}>
                            <TableCell className="text-sm font-medium">
                              {row.txt_accion_contable ? (ACCION_LABEL[row.txt_accion_contable] ?? row.txt_accion_contable) : '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                            <TableCell className="text-right tabular-nums text-emerald-600">{row.conciliado}</TableCell>
                            <TableCell className="text-right tabular-nums">{pct}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Nota: el separado computadoras-Windows vs. otros y el conteo de pendientes exactos
            requieren campos adicionales del backend (ver follow-ups Fase A).
          </p>
        </>
      )}
    </div>
  );
}
