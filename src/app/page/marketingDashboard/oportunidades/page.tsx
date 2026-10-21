'use client';

/**
 * Pestaña Oportunidades — ¿qué NO estamos cubriendo?
 *
 * El hueco tiene dos caras que NO son lo mismo y por eso van en secciones
 * separadas, con encabezados que dicen qué decisión habilita cada una:
 *
 *  - Demanda sin respuesta: alguien preguntó y el bot no devolvió ningún producto.
 *    Es demanda real insatisfecha, y la acción es de catálogo o de abastecimiento.
 *  - Catálogo sin demanda: el producto existe y nadie lo pregunta nunca. El
 *    inventario está bien; lo que falla es la promoción o la pertinencia.
 *
 * Mezclarlas en una sola tabla de "oportunidades" sugeriría una misma acción para
 * dos problemas opuestos, así que se mantienen distinguibles a simple vista.
 */

import { useMemo, useState } from 'react';
import { SearchX, PackageX, Megaphone, Siren, Baby, Crown } from 'lucide-react';
import { useOportunidades } from '@/hooks/useMercadeoQueries';
import {
  useFiltrosMercadeo, FiltroPeriodo, AvisoAnomalos,
  PageHeader, KpiCard, Loading, ErrorState, EmptyState,
} from '../_components';
import { BarRanking } from '@/components/charts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Tamaño total del catálogo, para que "X productos sin demanda" se lea contra su
 * universo. El DTO de oportunidades no trae el total (sólo la lista de los que no
 * tienen demanda); mientras el backend no lo exponga queda acá como constante.
 */

const POR_PAGINA = 20;

const SIN_CATEGORIA = 'Sin categoría';

const numero = new Intl.NumberFormat('es-HN');

function formatearPrecio(precio: number | null): string {
  if (precio == null) return '—';
  return `L. ${precio.toFixed(2)}`;
}

export default function OportunidadesPage() {
  const filtros = useFiltrosMercadeo();
  const { data, isLoading, error } = useOportunidades(filtros.params);

  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  // Extract all data before JSX — prevents SWC _ref bug with Recharts
  const noCubierta = data ? data.noCubierta : [];
  const catalogoSinDemanda = data ? data.catalogoSinDemanda : [];
  const competidores = data ? data.competidores : [];
  const segmentos = data ? data.segmentos : null;
  // El total del catálogo lo manda el backend: antes estaba fijo en 113 aquí y la
  // tabla ya tenía 115, así que el "de N" mentía sin que nadie lo notara.
  const catalogoTotal = data ? data.catalogoTotal : 0;

  const noCubiertaOrdenada = useMemo(
    () => [...noCubierta].sort((a, b) => b.veces - a.veces),
    [noCubierta],
  );

  // Ordenado por categoría y después por nombre: la lista es larga y se recorre
  // buscando huecos de promoción por familia de producto, no alfabéticamente.
  const catalogoOrdenado = useMemo(() => {
    return [...catalogoSinDemanda].sort((a, b) => {
      const catA = a.categoria ?? SIN_CATEGORIA;
      const catB = b.categoria ?? SIN_CATEGORIA;
      const porCategoria = catA.localeCompare(catB, 'es');
      if (porCategoria !== 0) return porCategoria;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
  }, [catalogoSinDemanda]);

  const catalogoFiltrado = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return catalogoOrdenado;
    return catalogoOrdenado.filter((p) => {
      const categoria = (p.categoria ?? SIN_CATEGORIA).toLowerCase();
      return p.nombre.toLowerCase().includes(termino) || categoria.includes(termino);
    });
  }, [catalogoOrdenado, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(catalogoFiltrado.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);

  const catalogoPagina = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return catalogoFiltrado.slice(inicio, inicio + POR_PAGINA);
  }, [catalogoFiltrado, paginaSegura]);

  const terminosSinRespuesta = noCubiertaOrdenada.length;
  const productosSinDemanda = catalogoSinDemanda.length;
  const mencionesCompetencia = useMemo(
    () => competidores.reduce((acc, c) => acc + c.menciones, 0),
    [competidores],
  );
  const marcasDistintas = competidores.length;
  const urgencia = segmentos ? segmentos.urgencia : 0;
  const pediatrico = segmentos ? segmentos.pediatrico : 0;
  const premium = segmentos ? segmentos.premium : 0;

  const desdeFila = catalogoFiltrado.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1;
  const hastaFila = Math.min(paginaSegura * POR_PAGINA, catalogoFiltrado.length);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Oportunidades"
        description="Qué no estamos cubriendo: lo que la gente pidió y no encontró, y lo que tenemos y nadie pide."
        actions={<FiltroPeriodo filtros={filtros} />}
      />

      <AvisoAnomalos filtros={filtros} />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <div className="space-y-6">
          {/* ── KPIs ────────────────────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Términos sin respuesta"
              value={numero.format(terminosSinRespuesta)}
              hint="Búsquedas que no devolvieron ningún producto"
              icon={SearchX}
              accent="amber"
            />
            <KpiCard
              label="Catálogo sin demanda"
              value={numero.format(productosSinDemanda)}
              hint={`de ${numero.format(catalogoTotal)} productos del catálogo`}
              icon={PackageX}
              accent="red"
            />
            <KpiCard
              label="Menciones de la competencia"
              value={numero.format(mencionesCompetencia)}
              hint={`${numero.format(marcasDistintas)} marcas ajenas nombradas en los mensajes`}
              icon={Megaphone}
              accent="purple"
            />
            <KpiCard
              label="Mensajes con urgencia"
              value={numero.format(urgencia)}
              hint="El mensaje transmitía apuro"
              icon={Siren}
              accent="sky"
            />
          </div>

          {/* ── Cara 1: la gente preguntó y no hubo respuesta ───────────── */}
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <SearchX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-base">Demanda sin respuesta</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Son búsquedas que <span className="font-medium text-foreground">no devolvieron
                ningún producto</span>: alguien preguntó y el bot no encontró nada que ofrecer.
                Puede ser porque el producto no existe en el catálogo o porque no había
                existencias. <span className="font-medium text-foreground">El dato no distingue
                entre las dos cosas</span>, así que cada término hay que verificarlo contra el
                catálogo antes de decidir si se compra o se repone.
              </p>
            </CardHeader>
            <CardContent>
              {noCubiertaOrdenada.length === 0 ? (
                <EmptyState message="Ninguna búsqueda del período se quedó sin respuesta." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Término buscado</TableHead>
                        <TableHead className="text-right">Veces</TableHead>
                        <TableHead className="text-right">Usuarios distintos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {noCubiertaOrdenada.map((fila) => (
                        <TableRow key={fila.termino}>
                          <TableCell className="font-medium">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{fila.termino}</span>
                              {fila.pediatrico > 0 && (
                                <Badge variant="secondary" className="font-normal">
                                  pediátrico
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {numero.format(fila.veces)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {numero.format(fila.usuarios)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Cara 2: existe en el catálogo y nadie lo nombra ─────────── */}
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <PackageX className="h-4 w-4 text-red-600 dark:text-red-400" />
                <CardTitle className="text-base">Catálogo sin demanda</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Productos que <span className="font-medium text-foreground">están en el catálogo y
                nadie preguntó</span> en el período. Acá el hueco no es de inventario: si el
                producto existe y nunca se nombra, el problema es de{' '}
                <span className="font-medium text-foreground">promoción</span> (la gente no sabe que
                lo tenemos) o de <span className="font-medium text-foreground">pertinencia</span> (no
                es lo que esta clientela busca). Son dos salidas distintas: campaña, o depurar la
                lista.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                  placeholder="Buscar por producto o categoría…"
                  aria-label="Buscar en el catálogo sin demanda"
                  className="sm:max-w-xs"
                />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {catalogoFiltrado.length === 0
                    ? 'Sin coincidencias'
                    : `${numero.format(desdeFila)}–${numero.format(hastaFila)} de ${numero.format(
                        catalogoFiltrado.length,
                      )}`}
                </span>
              </div>

              {catalogoFiltrado.length === 0 ? (
                <EmptyState
                  message={
                    busqueda.trim()
                      ? 'Ningún producto sin demanda coincide con la búsqueda.'
                      : 'Todo el catálogo recibió al menos una consulta en el período.'
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catalogoPagina.map((producto) => (
                          <TableRow key={producto.idProducto}>
                            <TableCell className="font-medium">{producto.nombre}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {producto.categoria ?? SIN_CATEGORIA}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatearPrecio(producto.precio)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPaginas > 1 && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={paginaSegura <= 1}
                        onClick={() => setPagina(paginaSegura - 1)}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        Página {numero.format(paginaSegura)} de {numero.format(totalPaginas)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={paginaSegura >= totalPaginas}
                        onClick={() => setPagina(paginaSegura + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Cuota de voz de la competencia ──────────────────────────── */}
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-base">Cuota de voz de la competencia</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Marcas ajenas que la gente nombró por iniciativa propia al escribir. Se muestra el
                conteo de menciones, no una cuota de mercado.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <BarRanking
                data={competidores}
                labelKey="marca"
                valueKey="menciones"
                height={260}
                color={4}
                formatValue={(valor) => numero.format(valor)}
                emptyLabel="Ninguna marca de la competencia fue mencionada en el período."
              />
              <p className="text-xs text-muted-foreground">
                Son marcas de la competencia <span className="font-medium text-foreground">escritas
                por la propia gente</span> en sus mensajes, detectadas contra una lista cerrada de 20
                marcas. No es un estudio de mercado: una marca fuera de esa lista no aparece acá, y
                el conteo depende de cómo la escribieron.
              </p>
            </CardContent>
          </Card>

          {/* ── Segmentos con intención especial ────────────────────────── */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Segmentos con intención especial
              </h2>
              <p className="text-sm text-muted-foreground">
                Mensajes donde el pedido traía una señal extra sobre quién pregunta o con qué ánimo.
                Sirven para elegir el tono de una campaña, no para dimensionar un público: un mismo
                mensaje puede caer en más de un segmento.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <KpiCard
                label="Pediátrico"
                value={numero.format(pediatrico)}
                hint="Pidió algo para un niño"
                icon={Baby}
                accent="sky"
              />
              <KpiCard
                label="Urgencia"
                value={numero.format(urgencia)}
                hint="El mensaje transmitía apuro"
                icon={Siren}
                accent="amber"
              />
              <KpiCard
                label="Premium"
                value={numero.format(premium)}
                hint="Pidió lo más fuerte o lo mejor"
                icon={Crown}
                accent="purple"
              />
            </div>
          </section>

          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Piloto con poco volumen orgánico: los conteos de este panel se leen como señales a
            verificar, no como medidas estables. Nada de lo que se muestra acá mide una venta.
          </p>
        </div>
      )}
    </div>
  );
}
