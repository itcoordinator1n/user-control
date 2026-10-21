'use client';

/**
 * Pestaña "Operación" de Mercadeo — la lectura de gerencia general: cuánto se usa el
 * bot, cuánto cuesta la IA, cuánto tarda y cuántas veces tuvo que responder sin IA.
 *
 * El histórico no tiene ningún dato de venta, así que acá se habla de costo y nunca de
 * retorno: se puede decir lo que cuesta atender una conversación, no lo que rinde en
 * dinero. Toda cifra extrapolada va rotulada como estimación.
 */

import { useMemo } from 'react';
import {
  Activity, CalendarRange, Cpu, DollarSign, Gauge, Info,
  MessageSquare, MessagesSquare, ShieldAlert, Timer, Users,
} from 'lucide-react';
import { useOperacion } from '@/hooks/useMercadeoQueries';
import {
  useFiltrosMercadeo, FiltroPeriodo, AvisoAnomalos,
  PageHeader, KpiCard, Loading, ErrorState, EmptyState,
} from '../_components';
import { BarRanking, DonutShare } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

/**
 * El contador de respuestas de respaldo se insertaba siempre en cero y se corrigió
 * este día. Para períodos anteriores el 0 es falta de registro, no ausencia del hecho.
 */
const FECHA_ARREGLO_RESPALDO = '2026-10-21';

/** Días del mes que se usan para extrapolar el costo mensual estimado. */
const DIAS_MES = 30;

type FilaModelo = {
  modelo: string;
  mensajes: number;
  usd: number;
  pctCosto: number;
  pctMensajes: number;
  usdPorMensaje: number;
};

const nf = new Intl.NumberFormat('es-HN');
const fmtEntero = (valor: number) =>
  Number.isFinite(valor) ? nf.format(Math.round(valor)) : '—';

/**
 * El costo total del histórico son centésimas de centavo: con dos decimales todo se
 * vería como `$0.00` y se perdería justamente el punto de la pestaña.
 */
function fmtUsd(valor: number): string {
  if (!Number.isFinite(valor)) return '—';
  const abs = Math.abs(valor);
  const dec = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return `$${valor.toLocaleString('es-HN', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
}

const fmtUsdMicro = (valor: number | null) =>
  valor === null || !Number.isFinite(valor) ? '—' : `$${valor.toFixed(6)}`;

const fmtPct = (valor: number | null) =>
  valor === null || !Number.isFinite(valor) ? '—' : `${valor.toFixed(1)}%`;

const fmtDecimal = (valor: number | null, dec = 1) =>
  valor === null || !Number.isFinite(valor)
    ? '—'
    : valor.toLocaleString('es-HN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtMs = (ms: number) => (Number.isFinite(ms) ? `${nf.format(Math.round(ms))} ms` : '—');

/** `null` cuando el divisor viene en 0 por el filtro de fechas: mejor "—" que Infinity. */
const dividir = (a: number, b: number) => (b > 0 ? a / b : null);

export default function OperacionPage() {
  const filtros = useFiltrosMercadeo();
  const { data, isLoading, error } = useOperacion(filtros.params);

  // Bug del compilador SWC con recharts (ver `src/app/page/ticket-mgmt/page.tsx:134`):
  // todo sale a constantes acá arriba y nada se lee inline dentro de los gráficos.
  const volumen = data?.volumen;
  const costo = data?.costo;
  const latencia = data?.latencia;
  const respaldo = data?.respaldo;

  const periodoHasta = data?.periodo?.hasta ?? '';

  const mensajes = volumen?.mensajes ?? 0;
  const sesiones = volumen?.sesiones ?? 0;
  const usuarios = volumen?.usuarios ?? 0;
  const diasConDatos = volumen?.diasConDatos ?? 0;

  const totalUsd = costo?.totalUsd ?? 0;
  const usdPorMensaje = costo?.porMensaje ?? 0;

  const mediaMs = latencia?.mediaMs ?? 0;
  const p50Ms = latencia?.p50Ms ?? 0;
  const p95Ms = latencia?.p95Ms ?? 0;

  const respaldoMensajes = respaldo?.mensajes ?? 0;
  const respaldoPct = respaldo?.pct ?? 0;

  const porModelo = useMemo(() => costo?.porModelo ?? [], [costo]);

  const { filasModelo, palanca } = useMemo(() => {
    const totalMensajesModelos = porModelo.reduce((acc, m) => acc + (m.mensajes ?? 0), 0);
    const totalCostoModelos = porModelo.reduce((acc, m) => acc + (m.usd ?? 0), 0);

    const filas: FilaModelo[] = porModelo
      .map((m) => {
        const msjs = m.mensajes ?? 0;
        const usd = m.usd ?? 0;
        return {
          modelo: m.modelo || '—',
          mensajes: msjs,
          usd,
          pctCosto: totalCostoModelos > 0 ? (usd / totalCostoModelos) * 100 : 0,
          pctMensajes: totalMensajesModelos > 0 ? (msjs / totalMensajesModelos) * 100 : 0,
          usdPorMensaje: msjs > 0 ? usd / msjs : 0,
        };
      })
      .sort((a, b) => b.usd - a.usd);

    // Palanca de ahorro: sólo vale señalarla si un modelo se lleva bastante más
    // costo del que le tocaría por volumen de mensajes.
    const top = filas[0];
    const tienePalanca = !!top && filas.length > 1 && top.pctCosto - top.pctMensajes > 10;

    return { filasModelo: filas, palanca: tienePalanca ? top : null };
  }, [porModelo]);

  const derivados = useMemo(() => {
    const usdPorSesion = dividir(totalUsd, sesiones);
    return {
      usdPorSesion,
      // Reformulación en lenguaje llano: cuántas sesiones entran en un dólar de IA.
      sesionesPorDolar: usdPorSesion && usdPorSesion > 0 ? 1 / usdPorSesion : null,
      proyeccionMensual:
        diasConDatos > 0 ? (totalUsd / diasConDatos) * DIAS_MES : null,
      mensajesPorDia: dividir(mensajes, diasConDatos),
      mensajesPorSesion: dividir(mensajes, sesiones),
      sesionesPorUsuario: dividir(sesiones, usuarios),
    };
  }, [totalUsd, sesiones, mensajes, usuarios, diasConDatos]);

  const {
    usdPorSesion, sesionesPorDolar, proyeccionMensual,
    mensajesPorDia, mensajesPorSesion, sesionesPorUsuario,
  } = derivados;

  const sinDatos = !!data && mensajes === 0 && sesiones === 0;
  const respaldoSinRegistro = respaldoMensajes === 0;
  const periodoPreviaAlArreglo = periodoHasta !== '' && periodoHasta < FECHA_ARREGLO_RESPALDO;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operación"
        description="Cuánto se usa el bot, cuánto cuesta la IA y cuánto tarda en responder."
        actions={<FiltroPeriodo filtros={filtros} />}
      />

      <AvisoAnomalos filtros={filtros} />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : sinDatos ? (
        <EmptyState message="No hay actividad registrada en el período seleccionado." />
      ) : (
        <div className="space-y-4">
          {/* ── Volumen y costo total ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Mensajes"
              value={fmtEntero(mensajes)}
              hint={`${fmtEntero(diasConDatos)} días con datos en el rango`}
              icon={MessageSquare}
              accent="sky"
            />
            <KpiCard
              label="Sesiones"
              value={fmtEntero(sesiones)}
              hint={
                mensajesPorSesion === null
                  ? 'Sin sesiones en el período'
                  : `${fmtDecimal(mensajesPorSesion)} mensajes por sesión`
              }
              icon={MessagesSquare}
              accent="purple"
            />
            <KpiCard
              label="Usuarios únicos"
              value={fmtEntero(usuarios)}
              hint={
                sesionesPorUsuario === null
                  ? 'Sin usuarios en el período'
                  : `${fmtDecimal(sesionesPorUsuario)} sesiones por usuario`
              }
              icon={Users}
              accent="default"
            />
            <KpiCard
              label="Costo de IA (USD)"
              value={fmtUsd(totalUsd)}
              hint={`${fmtUsdMicro(usdPorMensaje)} por mensaje`}
              icon={DollarSign}
              accent="emerald"
            />
          </div>

          {/* ── El argumento de costo ─────────────────────────────────────── */}
          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ¿Cuánto cuesta atender una conversación?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Por sesión
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {fmtUsdMicro(usdPorSesion)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Costo total de IA dividido entre las sesiones del período.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Por mensaje
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {fmtUsdMicro(usdPorMensaje)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dato del período, no una estimación.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Costo mensual proyectado
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {proyeccionMensual === null ? '—' : fmtUsd(proyeccionMensual)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {proyeccionMensual === null
                      ? 'Sin días con datos: no se puede proyectar.'
                      : `Estimación: ${fmtUsd(totalUsd)} en ${fmtEntero(diasConDatos)} días con datos, llevado a ${DIAS_MES}. No es un valor observado.`}
                  </p>
                </div>
              </div>

              <p className="border-t border-emerald-500/30 pt-3 text-sm text-muted-foreground">
                {usdPorSesion === null ? (
                  <>
                    No hubo sesiones en el período, así que no se puede calcular el costo por
                    conversación.
                  </>
                ) : (
                  <>
                    Atender una conversación completa cuesta{' '}
                    <span className="font-semibold text-foreground">{fmtUsdMicro(usdPorSesion)}</span>{' '}
                    en consumo de IA.
                    {sesionesPorDolar !== null && (
                      <>
                        {' '}Harían falta cerca de{' '}
                        <span className="font-semibold text-foreground">
                          {fmtEntero(sesionesPorDolar)}
                        </span>{' '}
                        sesiones para gastar un dólar.
                      </>
                    )}{' '}
                    <span className="font-medium text-foreground">
                      El costo de la IA no es hoy la restricción de este canal.
                    </span>{' '}
                    Esto dice lo que cuesta operar; no hay datos de venta en el sistema, así que
                    nada acá mide lo que el canal rinde en dinero.
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* ── Costo por modelo ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                Costo por modelo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {filasModelo.length === 0 ? (
                <EmptyState message="Sin consumo de modelos en el período." />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Reparto del costo (USD)
                      </p>
                      <DonutShare
                        data={filasModelo}
                        labelKey="modelo"
                        valueKey="usd"
                        height={240}
                        formatValue={fmtUsd}
                        centerLabel={fmtUsd(totalUsd)}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Reparto de los mensajes
                      </p>
                      <BarRanking
                        data={filasModelo}
                        labelKey="modelo"
                        valueKey="mensajes"
                        height={240}
                        formatValue={fmtEntero}
                        multicolor
                        emptyLabel="Sin mensajes atribuidos a un modelo."
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Modelo</TableHead>
                          <TableHead className="text-right">Mensajes</TableHead>
                          <TableHead className="text-right">% mensajes</TableHead>
                          <TableHead className="text-right">USD</TableHead>
                          <TableHead className="text-right">% del costo</TableHead>
                          <TableHead className="text-right">USD por mensaje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filasModelo.map((fila) => (
                          <TableRow key={fila.modelo}>
                            <TableCell className="font-medium">{fila.modelo}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmtEntero(fila.mensajes)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmtPct(fila.pctMensajes)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmtUsd(fila.usd)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {fmtPct(fila.pctCosto)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmtUsdMicro(fila.usdPorMensaje)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {palanca && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{palanca.modelo}</span> atiende
                        el <span className="font-medium text-foreground">{fmtPct(palanca.pctMensajes)}</span>{' '}
                        de los mensajes pero se lleva el{' '}
                        <span className="font-medium text-foreground">{fmtPct(palanca.pctCosto)}</span>{' '}
                        del costo ({fmtUsdMicro(palanca.usdPorMensaje)} por mensaje). Es la palanca
                        de ahorro más clara: revisar en qué casos se enruta a ese modelo.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Latencia ──────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                Tiempo de respuesta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KpiCard
                  label="Media"
                  value={`${fmtDecimal(mediaMs / 1000)} s`}
                  hint={fmtMs(mediaMs)}
                  icon={Activity}
                  accent="sky"
                />
                <KpiCard
                  label="Mediana (p50)"
                  value={`${fmtDecimal(p50Ms / 1000)} s`}
                  hint={fmtMs(p50Ms)}
                  icon={Timer}
                  accent="emerald"
                />
                <KpiCard
                  label="p95"
                  value={`${fmtDecimal(p95Ms / 1000)} s`}
                  hint={`${fmtMs(p95Ms)} · 1 de cada 20 turnos tarda más que esto`}
                  icon={Timer}
                  accent="amber"
                />
              </div>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Es el tiempo total del turno, de punta a punta. No hay desglose entre el tiempo de
                  la IA y el de la base de datos: esas columnas existen en el registro pero vienen
                  vacías.
                </span>
              </p>
            </CardContent>
          </Card>

          {/* ── Respuestas sin IA (respaldo determinista) ─────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                Respuestas sin IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {respaldoSinRegistro ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">
                        El período no registra respuestas de respaldo
                      </span>
                      , y eso no quiere decir que no haya habido.
                    </p>
                    <p>
                      El indicador se insertaba siempre en cero y se corrigió el{' '}
                      <span className="font-medium text-foreground">{FECHA_ARREGLO_RESPALDO}</span>,
                      así que cualquier fecha anterior va a dar 0 por falta de registro. De hecho el{' '}
                      <span className="font-medium text-foreground">30 de septiembre</span> el bot
                      corrió todo el día con el respaldo determinista, sin IA, porque la cuenta de
                      OpenAI se quedó sin saldo.
                    </p>
                    <p>
                      Este número recién empieza a ser confiable para períodos posteriores al
                      arreglo.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <KpiCard
                      label="Mensajes contestados sin IA"
                      value={fmtEntero(respaldoMensajes)}
                      hint="Respuestas del respaldo determinista"
                      icon={ShieldAlert}
                      accent="red"
                    />
                    <KpiCard
                      label="Porcentaje del total"
                      value={fmtPct(respaldoPct)}
                      hint={`Sobre ${fmtEntero(mensajes)} mensajes del período`}
                      icon={ShieldAlert}
                      accent="amber"
                    />
                  </div>
                  {periodoPreviaAlArreglo && (
                    <p className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        El período incluye fechas anteriores al {FECHA_ARREGLO_RESPALDO}, cuando el
                        indicador se insertaba siempre en cero: el conteo real pudo ser mayor.
                      </span>
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Volumen y cobertura ───────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                Volumen y cobertura del período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KpiCard
                  label="Días con datos"
                  value={fmtEntero(diasConDatos)}
                  hint="Días del rango que tienen al menos un mensaje"
                  icon={CalendarRange}
                  accent="purple"
                />
                <KpiCard
                  label="Mensajes"
                  value={fmtEntero(mensajes)}
                  hint="Total del período filtrado"
                  icon={MessageSquare}
                  accent="sky"
                />
                <KpiCard
                  label="Promedio por día con datos"
                  value={fmtDecimal(mensajesPorDia)}
                  hint="Estimación sobre pocos días; no es un promedio estable"
                  icon={Activity}
                  accent="amber"
                />
              </div>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Los días con datos son los que ponen el volumen en contexto: con pocos días
                  registrados el promedio diario no es representativo y no alcanza para leer una
                  tendencia.
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
