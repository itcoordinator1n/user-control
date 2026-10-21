'use client';

/**
 * Pestaña "Experiencia" del panel de Mercadeo.
 *
 * Se lee desde el lugar del cliente: ¿el bot le sirvió? Mide cuánto avanza la
 * conversación, cuántas búsquedas no devuelven nada y qué calidad tuvo la sesión.
 *
 * Por qué NO se llama "conversión" en ninguna parte: el sistema no registra un solo
 * dato de venta. Las etapas que se grafican son pasos de una conversación (pedir el
 * detalle, consultar un precio, preguntar dónde comprar); ninguna es una compra ni
 * prueba que haya ocurrido. Llamarlo conversión le atribuiría al dato algo que el
 * dato no dice, así que la sección se rotula "Avance en la conversación".
 */

import { useMemo } from 'react';
import {
  AlertTriangle, Info, ListOrdered, MessageSquare, SearchX, Store, TrendingDown, Users,
} from 'lucide-react';
import { useExperiencia } from '@/hooks/useMercadeoQueries';
import {
  useFiltrosMercadeo, FiltroPeriodo, AvisoAnomalos,
  PageHeader, KpiCard, Loading, ErrorState, EmptyState,
} from '../_components';
import { BarRanking, DonutShare, FunnelSteps } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Constantes de módulo (estables entre renders, sirven de deps de useMemo) ──

const SIN_UX: { categoria: string; sesiones: number; scorePromedio: number }[] = [];
const SIN_TURNOS: { turnos: number; sesiones: number }[] = [];
const SIN_CADENAS: { cadena: string; impresiones: number }[] = [];

/** Calidad de sesión de peor a mejor. Lo que no reconozcamos se va al final. */
const ORDEN_UX = ['REBOTE', 'MALA', 'REGULAR', 'BUENA', 'EXCELENTE'];

/**
 * Fecha en que se corrigió el cálculo del puntaje de UX. Antes de este día las
 * señales negativas (frustración, reformulaciones, pedido de un humano) se guardaban
 * siempre en cero, así que el puntaje histórico subestima los problemas y su techo
 * real era 70 sobre 100, no 100.
 */
const FECHA_ARREGLO_UX = '21 de octubre de 2026';
const TECHO_UX_HISTORICO = 70;

const nf = new Intl.NumberFormat('es-HN');
const num = (valor: number) => nf.format(Math.round(valor));
const pct1 = (valor: number) => `${valor.toFixed(1)}%`;
const porcentaje = (parte: number, total: number) => (total > 0 ? (parte / total) * 100 : 0);

export default function ExperienciaPage() {
  const filtros = useFiltrosMercadeo();
  const { data, isLoading, error } = useExperiencia(filtros.params);

  // Extract all data before JSX — prevents SWC _ref bug with Recharts
  const embudo = data ? data.embudo : null;
  const fallo = data ? data.fallo : null;
  const ux = data && data.ux ? data.ux : SIN_UX;
  const turnos = data && data.turnos ? data.turnos : SIN_TURNOS;
  const cadenas = data && data.cadenas ? data.cadenas : SIN_CADENAS;

  // ─── Avance de la conversación ──────────────────────────────────────────────

  const etapas = useMemo(() => {
    if (!embudo) return [];
    return [
      { label: 'Sesiones', value: embudo.sesiones },
      { label: 'Obtuvo resultados', value: embudo.resultado },
      { label: 'Pidió el detalle', value: embudo.detalle },
      { label: 'Consultó el precio', value: embudo.precio },
      { label: 'Preguntó dónde comprar', value: embudo.farmacia },
    ];
  }, [embudo]);

  /** Etapa donde se pierde más gente: es el único dato accionable del avance. */
  const peorCaida = useMemo(() => {
    let peor: {
      desde: string; hasta: string; perdidas: number; base: number; pct: number;
    } | null = null;
    for (let i = 1; i < etapas.length; i += 1) {
      const base = etapas[i - 1].value;
      const perdidas = base - etapas[i].value;
      if (!peor || perdidas > peor.perdidas) {
        peor = {
          desde: etapas[i - 1].label,
          hasta: etapas[i].label,
          perdidas,
          base,
          pct: porcentaje(perdidas, base),
        };
      }
    }
    return peor;
  }, [etapas]);

  // ─── Búsquedas que no devuelven nada ────────────────────────────────────────

  const resumenFallo = useMemo(() => {
    if (!fallo) return null;
    const mensajes = fallo.mensajes;
    const fallidos = fallo.fallidos;
    // Recalculamos el % desde los conteos para que cuadre con los absolutos que se
    // muestran al lado; si no hay mensajes caemos al valor que manda el backend.
    const pct = mensajes > 0 ? porcentaje(fallidos, mensajes) : Number(fallo.pct) || 0;
    return { mensajes, fallidos, resueltos: Math.max(0, mensajes - fallidos), pct };
  }, [fallo]);

  // ─── Calidad de la sesión ───────────────────────────────────────────────────

  const uxOrdenado = useMemo(() => {
    const posicion = (categoria: string) => {
      const i = ORDEN_UX.indexOf(String(categoria).toUpperCase());
      return i === -1 ? ORDEN_UX.length : i;
    };
    return [...ux].sort((a, b) => posicion(a.categoria) - posicion(b.categoria));
  }, [ux]);

  const totalUx = useMemo(
    () => uxOrdenado.reduce((acc, fila) => acc + fila.sesiones, 0),
    [uxOrdenado],
  );

  const sesionesRebote = useMemo(() => {
    const fila = uxOrdenado.find((x) => String(x.categoria).toUpperCase() === 'REBOTE');
    return fila ? fila.sesiones : 0;
  }, [uxOrdenado]);

  // ─── Profundidad de la conversación ─────────────────────────────────────────

  const turnosOrdenados = useMemo(
    () => [...turnos].sort((a, b) => a.turnos - b.turnos),
    [turnos],
  );

  const barrasTurnos = useMemo(
    () => turnosOrdenados.map((fila) => ({
      etiqueta: fila.turnos === 1 ? '1 turno' : `${fila.turnos} turnos`,
      sesiones: fila.sesiones,
    })),
    [turnosOrdenados],
  );

  const resumenTurnos = useMemo(() => {
    const total = turnosOrdenados.reduce((acc, fila) => acc + fila.sesiones, 0);
    if (total === 0) return null;
    // Mediana ponderada: la primera cantidad de turnos que acumula la mitad de las sesiones.
    const mitad = total / 2;
    let acumulado = 0;
    let mediana = turnosOrdenados[0].turnos;
    for (const fila of turnosOrdenados) {
      acumulado += fila.sesiones;
      if (acumulado >= mitad) {
        mediana = fila.turnos;
        break;
      }
    }
    const hastaDos = turnosOrdenados
      .filter((fila) => fila.turnos <= 2)
      .reduce((acc, fila) => acc + fila.sesiones, 0);
    return { total, mediana, hastaDos, pctHastaDos: porcentaje(hastaDos, total) };
  }, [turnosOrdenados]);

  // ─── KPIs ───────────────────────────────────────────────────────────────────

  const sesiones = embudo ? embudo.sesiones : 0;
  const conResultado = embudo ? embudo.resultado : 0;
  const pctResultado = porcentaje(conResultado, sesiones);
  const pctFallo = resumenFallo ? resumenFallo.pct : 0;
  const pctRebote = porcentaje(sesionesRebote, totalUx);
  // El fallo es el número que duele: rojo cuando una de cada tres búsquedas se va vacía.
  const acentoFallo = pctFallo >= 33 ? 'red' : 'amber';

  const totalCadenas = useMemo(
    () => cadenas.reduce((acc, fila) => acc + fila.impresiones, 0),
    [cadenas],
  );

  const sinDatos = sesiones === 0 && totalUx === 0 && turnosOrdenados.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Experiencia"
        description="Qué tan bien le sirvió el bot al cliente: hasta dónde llega la conversación, cuántas búsquedas se van vacías y qué calidad tuvo la sesión."
        actions={<FiltroPeriodo filtros={filtros} />}
      />

      <AvisoAnomalos filtros={filtros} />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : sinDatos ? (
        <EmptyState message="No hay sesiones registradas en el período seleccionado." />
      ) : (
        <div className="space-y-4">
          {/* ─── Fila de KPIs ─────────────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Sesiones"
              value={num(sesiones)}
              hint="Conversaciones distintas en el período"
              icon={Users}
              accent="sky"
            />
            <KpiCard
              label="Llegó a un resultado"
              value={pct1(pctResultado)}
              hint={`${num(conResultado)} de ${num(sesiones)} sesiones`}
              icon={MessageSquare}
              accent="emerald"
            />
            <KpiCard
              label="Búsquedas sin resultados"
              value={pct1(pctFallo)}
              hint={
                resumenFallo
                  ? `${num(resumenFallo.fallidos)} de ${num(resumenFallo.mensajes)} mensajes`
                  : 'Sin mensajes en el período'
              }
              icon={SearchX}
              accent={acentoFallo}
            />
            <KpiCard
              label="Sesiones que rebotan"
              value={pct1(pctRebote)}
              hint={`${num(sesionesRebote)} de ${num(totalUx)} sesiones clasificadas`}
              icon={TrendingDown}
              accent="amber"
            />
          </div>

          {/* ─── Avance en la conversación ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Avance en la conversación</CardTitle>
              <p className="text-sm text-muted-foreground">
                Hasta dónde llega cada sesión. Son pasos de una conversación, no compras:
                el sistema no registra ninguna venta, así que ninguna etapa confirma que
                el cliente haya comprado.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <FunnelSteps steps={etapas} height={320} formatValue={num} />

              {peorCaida && peorCaida.perdidas > 0 && (
                <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  La caída más grande va de{' '}
                  <span className="font-medium text-foreground">{peorCaida.desde}</span> a{' '}
                  <span className="font-medium text-foreground">{peorCaida.hasta}</span>: se
                  pierden{' '}
                  <span className="font-medium text-foreground tabular-nums">
                    {num(peorCaida.perdidas)}
                  </span>{' '}
                  de{' '}
                  <span className="tabular-nums">{num(peorCaida.base)}</span> sesiones (
                  <span className="tabular-nums">{pct1(peorCaida.pct)}</span>). El cliente ve
                  resultados y no pide más: ahí está el margen para trabajar.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ─── Búsquedas que fallan ───────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>Búsquedas que fallan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  &quot;Falla&quot; significa que la consulta no devolvió ningún producto. No
                  dice que el cliente se haya ido molesto ni que la respuesta fuera mala:
                  eso es lo único que el dato soporta.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {resumenFallo ? (
                  <>
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                      <span
                        className={
                          acentoFallo === 'red'
                            ? 'text-4xl font-bold tabular-nums text-red-600 dark:text-red-400'
                            : 'text-4xl font-bold tabular-nums text-amber-600 dark:text-amber-400'
                        }
                      >
                        {pct1(resumenFallo.pct)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        de los mensajes no devolvió ningún producto
                      </span>
                    </div>

                    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                          Mensajes
                        </dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {num(resumenFallo.mensajes)}
                        </dd>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                          Sin resultados
                        </dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {num(resumenFallo.fallidos)}
                        </dd>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                          Con resultados
                        </dt>
                        <dd className="font-semibold tabular-nums text-foreground">
                          {num(resumenFallo.resueltos)}
                        </dd>
                      </div>
                    </dl>

                    <p className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Se cuenta por mensaje, no por sesión: una misma sesión puede tener
                      varias búsquedas vacías.
                    </p>
                  </>
                ) : (
                  <EmptyState message="Sin mensajes en el período seleccionado." />
                )}
              </CardContent>
            </Card>

            {/* ─── Calidad de la sesión ───────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>Calidad de la sesión</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Clasificación de cada sesión, de peor a mejor: rebote, mala, regular,
                  buena, excelente.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <DonutShare
              preservarOrden
                  data={uxOrdenado}
                  labelKey="categoria"
                  valueKey="sesiones"
                  height={240}
                  formatValue={num}
                  maxSlices={6}
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-1.5 text-left font-medium">Categoría</th>
                        <th className="py-1.5 text-right font-medium">Sesiones</th>
                        <th className="py-1.5 text-right font-medium">Participación</th>
                        <th className="py-1.5 text-right font-medium">Puntaje prom.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uxOrdenado.map((fila) => (
                        <tr key={fila.categoria} className="border-b border-border/50 last:border-0">
                          <td className="py-1.5 text-foreground">{fila.categoria}</td>
                          <td className="py-1.5 text-right tabular-nums text-foreground">
                            {num(fila.sesiones)}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                            {pct1(porcentaje(fila.sesiones, totalUx))}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-foreground">
                            {fila.scorePromedio.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/*
                  Aviso obligatorio: sin esto el puntaje engaña. Las señales negativas
                  (frustración, reformulaciones, pedido de un humano) se guardaban
                  siempre en cero hasta el arreglo, así que el puntaje histórico es
                  mejor de lo que fue la experiencia real.
                */}
                <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    El puntaje se calcula con señales que hasta ahora se guardaban siempre
                    en cero (frustración, reformulaciones, pedido de un humano). Se corrigió
                    el{' '}
                    <span className="font-medium text-foreground">{FECHA_ARREGLO_UX}</span>,
                    así que los valores anteriores a esa fecha{' '}
                    <span className="font-medium text-foreground">
                      subestiman los problemas
                    </span>{' '}
                    y su techo real era de{' '}
                    <span className="font-medium tabular-nums text-foreground">
                      {TECHO_UX_HISTORICO}
                    </span>{' '}
                    sobre 100, no 100.
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ─── Profundidad de la conversación ─────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>Profundidad de la conversación</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cuántas sesiones tuvieron 1, 2, 3… turnos de ida y vuelta.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <BarRanking
                  data={barrasTurnos}
                  labelKey="etiqueta"
                  valueKey="sesiones"
                  height={260}
                  formatValue={num}
                  maxLabel={12}
                  multicolor
                />

                {resumenTurnos && (
                  <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <ListOrdered className="h-3.5 w-3.5" />
                      Mediana: {num(resumenTurnos.mediana)}{' '}
                      {resumenTurnos.mediana === 1 ? 'turno' : 'turnos'}
                    </span>
                    {' · '}
                    <span className="tabular-nums">
                      {pct1(resumenTurnos.pctHastaDos)}
                    </span>{' '}
                    de las sesiones (
                    <span className="tabular-nums">{num(resumenTurnos.hastaDos)}</span> de{' '}
                    <span className="tabular-nums">{num(resumenTurnos.total)}</span>) no pasa
                    de dos turnos: la gente pregunta una vez y se va.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ─── Dónde se le dice comprar ───────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>Dónde se le dice comprar</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cadena con el precio más bajo que el bot le mostró al cliente. No es una
                  preferencia del cliente ni una venta: es hacia dónde se está empujando el
                  tráfico.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <BarRanking
                  data={cadenas}
                  labelKey="cadena"
                  valueKey="impresiones"
                  height={260}
                  formatValue={num}
                  maxLabel={22}
                  multicolor
                />

                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Store className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {num(totalCadenas)} veces se mostró una cadena como la más barata.
                    Una misma sesión puede aparecer varias veces, una por cada producto
                    consultado.
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
