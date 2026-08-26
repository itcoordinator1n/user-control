"use client";

import { useEffect, useState } from "react";
import { Edit2, Search, Loader2, Filter, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SmartPagination } from "@/components/smart-pagination";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import {
  getProductos, getAreas, updateProducto,
  AREA_SIN_ASIGNAR,
  type ProductoBasico, type ProduccionArea,
} from "@/lib/services/produccion.service";

/** Centinela del Select para "sin área": Radix no admite value="". */
const SIN_AREA = "__sin__";

export default function ProductosList() {
  const { data: session } = useSession();
  const [productos, setProductos] = useState<ProductoBasico[]>([]);
  const [areas, setAreas] = useState<ProduccionArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editando, setEditando] = useState<ProductoBasico | null>(null);
  const [nombre, setNombre] = useState("");
  const [area, setArea] = useState<string>(SIN_AREA);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, ars] = await Promise.all([
        getProductos(session?.user?.accessToken),
        getAreas(session?.user?.accessToken),
      ]);
      setProductos(prods);
      setAreas(ars);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.accessToken) loadData();
  }, [session?.user?.accessToken]);

  const filtered = productos.filter((p) => {
    const coincideTexto =
      p.txt_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matnr?.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideArea =
      filterArea === "all" ||
      (filterArea === AREA_SIN_ASIGNAR ? !p.area_default : p.area_default === filterArea);
    return coincideTexto && coincideArea;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterArea]);

  const sinArea = productos.filter((p) => !p.area_default).length;

  const openEdit = (p: ProductoBasico) => {
    setEditando(p);
    setNombre(p.txt_nombre);
    setArea(p.area_default || SIN_AREA);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editando || !nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      await updateProducto(
        editando.int_id_producto,
        { nombre: nombre.trim(), area: area === SIN_AREA ? null : area },
        session?.user?.accessToken
      );
      await loadData();
      setIsModalOpen(false);
      setEditando(null);
    } catch (e) {
      // El backend responde 400 con las áreas válidas si el valor no existe
      setError(e instanceof Error ? e.message : "Error al guardar el producto");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o código SAP..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-full sm:w-52">
              <Filter className="mr-2 h-4 w-4 shrink-0" />
              <SelectValue placeholder="Todas las áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.nombre}>{a.nombre}</SelectItem>
              ))}
              {sinArea > 0 && (
                <SelectItem value={AREA_SIN_ASIGNAR}>Sin área ({sinArea})</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
          {productos.length} productos
        </p>
      </div>

      {/* Los productos sin área no salen en ningún filtro de la cabecera */}
      {sinArea > 0 && filterArea !== AREA_SIN_ASIGNAR && (
        <button
          onClick={() => setFilterArea(AREA_SIN_ASIGNAR)}
          className="w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {sinArea} producto{sinArea === 1 ? "" : "s"} sin área: no aparecerá
          {sinArea === 1 ? "" : "n"} al crear un control. Pulsa para revisarlo{sinArea === 1 ? "" : "s"}.
        </button>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="w-[130px]">Código SAP</TableHead>
              <TableHead className="w-[160px]">Área</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((p) => (
                <TableRow key={p.int_id_producto}>
                  <TableCell className="font-medium">{p.txt_nombre}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {p.matnr || "—"}
                  </TableCell>
                  <TableCell>
                    {p.area_default ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {p.area_default}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        Sin área
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filtered.length)} de {filtered.length} productos
          </p>
          <SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={(o) => { if (!o && !guardando) setIsModalOpen(false); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
            </div>

            <div className="space-y-2">
              <Label>Área de producción</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.nombre}>{a.nombre}</SelectItem>
                  ))}
                  <SelectItem value={SIN_AREA}>Sin área</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Determina en qué área aparece el producto al crear un control de tiempos.
              </p>
            </div>

            {editando?.matnr && (
              <p className="text-xs text-slate-500">
                Código SAP: <span className="font-mono">{editando.matnr}</span> — no editable
              </p>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={guardando || !nombre.trim()}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
