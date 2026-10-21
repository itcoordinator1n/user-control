'use client';

/**
 * Pestaña Demanda — "¿qué promociono?".
 *
 * Todo lo que se muestra acá sale de lo que la gente le preguntó al asistente de
 * productos: impresiones (veces que un producto apareció en una respuesta), términos
 * escritos a mano, intenciones clasificadas y ubicación. Nada de esto mide una venta,
 * así que la pestaña habla de demanda consultada y no de resultado comercial.
 *
 * No hay series temporales a propósito: el histórico tiene un solo día con el 86% de
 * los mensajes, por lo que cualquier tendencia o comparación entre períodos sería falsa.
 */

import { useMemo } from 'react';
import { Package, Eye, Star, Layers } from 'lucide-react';
import { useDemanda } from '@/hooks/useMercadeoQueries';
import {
  useFiltrosMercadeo, FiltroPeriodo, AvisoAnomalos,
  PageHeader, KpiCard, Loading, ErrorState, EmptyState,
} from '../_components';
import { BarRanking, DonutShare } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const NUM = new Intl.NumberFormat('es-HN');
const LEMPIRAS = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL',
  maximumFractionDigits: 2,
});

const fmtNum = (valor: number) => NUM.format(valor);

/** Cuántos productos entran en el ranking principal y en la tabla de detalle. */
const TOP_N = 20;

/**
 * Debajo de este número de impresiones no mostramos "% como principal": un 100% sobre
 * 3 impresiones aparenta una certeza que el dato no tiene. En esos casos se ve el conteo.
 */
const MINIMO_PARA_PORCENTAJE = 20;

/** Fecha en que el backend empezó a guardar la ubicación de la consulta. */
const INICIO_CAPTURA_UBICACION = '21 de octubre de 2026';

/** El ENUM del backend es legible para el equipo técnico, no para un gerente comercial. */
const INTENCIONES: Record<string, string> = {
  MALESTAR: 'Describe un síntoma',
  PRODUCTO_MARCA: 'Pide una marca',
  CATEGORIA: 'Pide una categoría',
  CONTEXTO: 'Sigue la conversación',
  OTROS: 'Otros',
  FALLBACK: 'Sin clasificar',
};

export default function DemandaPage() {
  const filtros = useFiltrosMercadeo();
  const { data, isLoading, error } = useDemanda(filtros.params);

  // Extract all data before JSX — prevents SWC _ref bug with Recharts
  const {
    productos = [],
    categorias = [],
    terminos = [],
    intenciones = [],
    ciudades = [],
  } = data ?? {};

  /** Ranking de productos: el backend no garantiza orden, así que ordenamos acá. */
  const productosTop = useMemo(
    () => [...productos].sort((a, b) => b.impresiones - a.impresiones).slice(0, TOP_N),
    [productos],
  );

  const barrasProductos = useMemo(
    () => productosTop.map((p) => ({ nombre: p.nombre, impresiones: p.impresiones })),
    [productosTop],
  );

  const donutCategorias = useMemo(
    () => categorias.map((c) => ({ categoria: c.categoria, impresiones: c.impresiones })),
    [categorias],
  );

  const donutIntenciones = useMemo(
    () =>
      intenciones.map((i) => ({
        etiqueta: INTENCIONES[i.intencion] ?? i.intencion,
        mensajes: i.mensajes,
      })),
    [intenciones],
  );

  const impresionesTotales = useMemo(
    () => productos.reduce((acc, p) => acc + p.impresiones, 0),
    [productos],
  );

  const productoLider = useMemo(
    () => productosTop[0] ?? null,
    [productosTop],
  );

  const categoriaLider = useMemo(() => {
    if (categorias.length === 0) return null;
    return [...categorias].sort((a, b) => b.impresiones - a.impresiones)[0];
  }, [categorias]);

  const terminosOrdenados = useMemo(
    () => [...terminos].sort((a, b) => b.veces - a.veces),
    [terminos],
  );

  const ciudadesOrdenadas = useMemo(
    () => [...ciudades].sort((a, b) => b.consultas - a.consultas),
    [ciudades],
  );

  // La ubicación recién se empezó a capturar: con una o dos filas no hay nada que leer,
  // y un ranking de un solo renglón se interpretaría como "sólo consultan de ahí".
  const ubicacionIncipiente = ciudadesOrdenadas.length > 0 && ciudadesOrdenadas.length < 5;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Demanda"
        description="Qué productos y qué palabras aparecen en las consultas al asistente. Son impresiones y consultas del bot: ninguna cifra de esta pestaña mide una venta."
        actions={<FiltroPeriodo filtros={filtros} />}
      />

      <AvisoAnomalos filtros={filtros} />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Productos consultados"
              value={fmtNum(productos.length)}
              hint="Productos distintos que aparecieron al menos una vez"
              icon={Package}
              accent="sky"
            />
            <KpiCard
              label="Impresiones totales"
              value={fmtNum(impresionesTotales)}
              hint="Veces que un producto apareció en una respuesta"
              icon={Eye}
              accent="purple"
            />
            <KpiCard
              label="Producto más consultado"
              value={productoLider ? productoLider.nombre : '—'}
              hint={
                productoLider
                  ? `${fmtNum(productoLider.impresiones)} impresiones`
                  : 'Sin datos para el período'
              }
              icon={Star}
              accent="emerald"
            />
            <KpiCard
              label="Categoría con más demanda"
              value={categoriaLider ? categoriaLider.categoria : '—'}
              hint={
                categoriaLider
                  ? `${fmtNum(categoriaLider.impresiones)} impresiones · ${fmtNum(categoriaLider.productos)} productos`
                  : 'Sin datos para el período'
              }
              icon={Layers}
              accent="amber"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top {TOP_N} productos por impresiones</CardTitle>
              <p className="text-xs text-muted-foreground">
                Una impresión es una aparición del producto en una respuesta del asistente,
                sea como recomendación principal o acompañando la lista.
              </p>
            </CardHeader>
            <CardContent>
              <BarRanking
                data={barrasProductos}
                labelKey="nombre"
                valueKey="impresiones"
                height={620}
                maxLabel={24}
                formatValue={fmtNum}
                emptyLabel="Ningún producto fue consultado en el período."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recomendado vs. solo mostrado</CardTitle>
              <p className="text-xs text-muted-foreground">
                {/* El "% como principal" separa el producto que el asistente realmente
                    propone del que solo rellena la lista: dos productos con las mismas
                    impresiones no merecen la misma inversión de campaña si uno encabeza
                    la respuesta y el otro nunca lo hace. */}
                El <span className="font-medium text-foreground">% como principal</span> es{' '}
                <span className="font-medium text-foreground">top1 / impresiones</span>: qué tanto
                de su exposición fue como recomendación encabezando la respuesta y no como
                acompañante de la lista. Con menos de {MINIMO_PARA_PORCENTAJE} impresiones se
                muestra el conteo en lugar del porcentaje.
              </p>
            </CardHeader>
            <CardContent>
              {productosTop.length === 0 ? (
                <EmptyState message="Ningún producto fue consultado en el período." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Impresiones</TableHead>
                      <TableHead className="text-right">Como principal</TableHead>
                      <TableHead className="text-right">% como principal</TableHead>
                      <TableHead className="text-right">Usuarios distintos</TableHead>
                      <TableHead className="text-right">Precio promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosTop.map((p) => {
                      const suficiente = p.impresiones >= MINIMO_PARA_PORCENTAJE;
                      const pct = p.impresiones > 0 ? (p.top1 / p.impresiones) * 100 : 0;
                      return (
                        <TableRow key={p.idProducto}>
                          <TableCell className="font-medium">{p.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.categoria ?? 'Sin categoría'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtNum(p.impresiones)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtNum(p.top1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {suficiente ? (
                              `${pct.toFixed(1)}%`
                            ) : (
                              <span className="text-muted-foreground">
                                {fmtNum(p.top1)} de {fmtNum(p.impresiones)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtNum(p.usuarios)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.precioPromedio != null ? (
                              LEMPIRAS.format(p.precioPromedio)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Demanda por categoría</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Reparto de las impresiones entre las categorías del catálogo.
                </p>
              </CardHeader>
              <CardContent>
                <DonutShare
                  data={donutCategorias}
                  labelKey="categoria"
                  valueKey="impresiones"
                  height={280}
                  maxSlices={6}
                  formatValue={fmtNum}
                  emptyLabel="Sin categorías con demanda en el período."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Intenciones de consulta</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Cómo llega la persona al asistente: describiendo un síntoma, pidiendo una
                  marca puntual o continuando una conversación anterior.
                </p>
              </CardHeader>
              <CardContent>
                <DonutShare
                  data={donutIntenciones}
                  labelKey="etiqueta"
                  valueKey="mensajes"
                  height={280}
                  maxSlices={6}
                  formatValue={fmtNum}
                  emptyLabel="Sin mensajes clasificados en el período."
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lo que la gente escribe</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {/* Los términos se guardan tal cual los tipeó la persona: la misma marca
                      aparece repetida con distinta grafía, así que sumar estas filas no da
                      el total de veces que se pidió un producto. Su valor es el vocabulario
                      real para redactar campañas y palabras clave, no el conteo. */}
                  Texto libre{' '}
                  <span className="font-medium text-foreground">tal como lo escribió la persona</span>,
                  sin normalizar. Por eso hay duplicados como{' '}
                  <span className="font-medium text-foreground">aliviol</span> y{' '}
                  <span className="font-medium text-foreground">ALIVIOL FORTE</span>: sirve para el
                  vocabulario de campañas, no para contar.
                </p>
              </CardHeader>
              <CardContent>
                {terminosOrdenados.length === 0 ? (
                  <EmptyState message="Sin términos registrados en el período." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Término escrito</TableHead>
                        <TableHead className="text-right">Veces</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {terminosOrdenados.map((t, i) => (
                        <TableRow key={`${t.termino}-${i}`}>
                          <TableCell className="font-mono text-xs">{t.termino}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtNum(t.veces)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Consultas por ciudad</CardTitle>
                <p className="text-xs text-muted-foreground">
                  La ubicación de la consulta se empezó a capturar el{' '}
                  <span className="font-medium text-foreground">{INICIO_CAPTURA_UBICACION}</span> y
                  está acumulando: todavía no alcanza para leer una distribución geográfica.
                </p>
              </CardHeader>
              <CardContent>
                {ciudadesOrdenadas.length === 0 ? (
                  <EmptyState
                    message={`Todavía sin ubicaciones registradas. La captura empezó el ${INICIO_CAPTURA_UBICACION}.`}
                  />
                ) : (
                  <>
                    {ubicacionIncipiente && (
                      <p className="mb-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        Solo hay{' '}
                        <span className="font-medium text-foreground">
                          {fmtNum(ciudadesOrdenadas.length)}
                        </span>{' '}
                        {ciudadesOrdenadas.length === 1 ? 'ubicación registrada' : 'ubicaciones registradas'}.
                        Es lo esperado a esta altura; no la tomes como el mapa de la demanda.
                      </p>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ciudad</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead className="text-right">Consultas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ciudadesOrdenadas.map((c, i) => (
                          <TableRow key={`${c.ciudad}-${i}`}>
                            <TableCell className="font-medium">{c.ciudad}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.departamento ?? '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmtNum(c.consultas)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
