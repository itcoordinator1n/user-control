"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Chain, SimpleProduct } from "@/types/comparison";
import { set } from "date-fns";

// --- TIPOS ---
interface SalesUnit {
  id_unidad_venta: number;
  txt_unidad_venta: string;
}

interface Comparison {
  id_comparacion: number;
  txt_nombre_comparacion: string;
  fk_unidad_venta: number;
}

// --- COMPONENTE PRINCIPAL ---
export default function ComparisonsPage() {
  // Estados de Datos
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [chains, setChains] = useState<Chain[]>([]);

  // Estados de Paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0); // Total real en BD

  // Estado para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComparison, setSelectedComparison] =
    useState<Comparison | null>(null);

  // Cargar lista de comparaciones al montar y al cambiar página/límite
  useEffect(() => {
    fetchComparisons();
    fetchChains();
  }, [page, limit]);

  const fetchChains = async () => {
    const res2 = await fetch(
      `https://infarma.duckdns.org/api/priceComparison/get-all-chains`,
    );
    if (res2.ok) {
      const responseData = await res2.json();
      console.log(responseData);
      // Manejo flexible de respuesta

      setChains(responseData);
    }
  };

  const fetchComparisons = async () => {
    try {
      setLoading(true);
      // El backend debe devolver: { data: Comparison[], total: number }
      const res = await fetch(
        `https://infarma.duckdns.org/api/priceComparison/get-comparisons?page=${page}&limit=${limit}`,
      );

      if (res.ok) {
        const responseData = await res.json();

        // Manejo flexible de respuesta
        if (
          responseData.data &&
          typeof responseData.total_en_vista === "number"
        ) {
          // Caso ideal: Backend devuelve datos y total
          setComparisons(responseData.data);
          setTotalRecords(responseData.total);
        } else if (Array.isArray(responseData)) {
          // Caso fallback: Backend solo devuelve array
          setComparisons(responseData);
          setTotalRecords(responseData.length);
        }
      }
    } catch (error) {
      console.error("Error cargando comparaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta comparación?")) return;

    try {
      await fetch(`/api/delete-comparison/${id}`, { method: "DELETE" });
      fetchComparisons();
    } catch (error) {
      console.error(error);
    }
  };

  const openNewModal = () => {
    setSelectedComparison(null); // Modo Creación
    setIsModalOpen(true);
  };

  const openEditModal = (comp: Comparison) => {
    setSelectedComparison(comp); // Modo Edición
    setIsModalOpen(true);
  };

  // Calculo de total de páginas
  const totalPages = Math.ceil(totalRecords / limit);

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Comparaciones de Precios
          </h1>
          <p className="text-gray-500">
            Gestiona tus listas de comparación y sus productos.
          </p>
        </div>
        <Button
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Comparación
        </Button>
      </div>

      {/* --- TABLA DE COMPARACIONES --- */}
      <div className="bg-white border rounded-lg shadow-sm flex flex-col justify-between min-h-[500px]">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Nombre de Comparación</TableHead>
                <TableHead>Unidad Venta ID</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : comparisons.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-gray-500"
                  >
                    No hay comparaciones creadas.
                  </TableCell>
                </TableRow>
              ) : (
                comparisons.map((comp) => (
                  <TableRow key={comp.id_comparacion}>
                    <TableCell className="font-medium">
                      {comp.id_comparacion}
                    </TableCell>
                    <TableCell>{comp.txt_nombre_comparacion}</TableCell>
                    <TableCell>{comp.fk_unidad_venta}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(comp)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(comp.id_comparacion)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- CONTROLES DE PAGINACIÓN --- */}
        <div className="border-t">
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            limit={limit}
            totalRecords={totalRecords}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* --- MODAL (EDITOR DE COMPARACIÓN) --- */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) fetchComparisons(); // Recargar lista al cerrar
        }}
      >
        <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedComparison
                ? "Editar Comparación"
                : "Crear Nueva Comparación"}
            </DialogTitle>
          </DialogHeader>

          <ComparisonEditor
            initialData={selectedComparison}
            onSuccess={() => fetchComparisons()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- COMPONENTE EDITOR (Lógica interna del Modal) ---
function ComparisonEditor({
  initialData,
  onSuccess,
}: {
  initialData: Comparison | null;
  onSuccess: () => void;
}) {
  const [comparisonId, setComparisonId] = useState<number | null>(
    initialData ? initialData.id_comparacion : null,
  );
  const [comparisonName, setComparisonName] = useState(
    initialData ? initialData.txt_nombre_comparacion : "",
  );
  const [unitId, setUnitId] = useState(
    initialData ? initialData.fk_unidad_venta.toString() : "",
  );

  const [salesUnits, setSalesUnits] = useState<SalesUnit[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  // useEffect(() => {
  //   const fetchProductChains = async () => {
  //     const response = await fetch(
  //       `https://infarma.duckdns.org/api/priceComparison/get-products-by-comparison?id=${comparisonId}`,
  //     );

  //     if (!response.ok) {
  //       throw new Error(`Error HTTP: ${response.status}`);
  //     }
  //     const responseData = await response.json();

  //     setRows(responseData);
  //     console.log(responseData);
  //   };
  //   fetchProductChains();
  // }, []);

  useEffect(() => {
    const fetchProductChains = async () => {
      const response = await fetch(
        `https://infarma.duckdns.org/api/priceComparison/get-products-by-comparison?id=${comparisonId}`,
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const responseData = await response.json();
      console.log(responseData);
    };
    fetchProductChains();
  }, []);

  useEffect(() => {
    fetch("https://infarma.duckdns.org/api/priceComparison/get-all-sales-units")
      .then((res) => res.json())
      .then((data) => setSalesUnits(data))
      .catch((err) => console.error(err));
  }, [comparisonId]);

  const handleCreateHead = async () => {
    if (!comparisonName || !unitId) return;

    try {
      const res = await fetch(
        "https://infarma.duckdns.org/api/priceComparison/create-comparison",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idUnidadVenta: Number(unitId),
            nombreComparacion: comparisonName,
            fkProducto: selectedProd?.int_id_producto,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setComparisonId(data.id_comparacion);
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [searchResults, setSearchResults] = useState<SimpleProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [selectedProd, setSelectedProd] = useState<SimpleProduct>();
  const [selectedChain, setSelectedChain] = useState("");
  const [chainProductName, setChainProductName] = useState("");
  const [flags, setFlags] = useState("");
  const handleSelectProduct = (product: SimpleProduct) => {
    setSelectedProd(product); // Guardas el objeto completo
    setSearch(product.txt_nombre); // Rellenas el input con el nombre
    setSearchResults([]); // Ocultas la lista
  };

  // useEffect(() => {
  //   const sea = async () => {
  //     const res = await fetch(
  //       `https://infarma.duckdns.org/api/priceComparison/search-product-by-name?query=${debouncedSearch}`,
  //     );
  //     const data: SimpleProduct[] = await res.json();

  //     return data;
  //   };
  //   sea()
  // }, [debouncedSearch]);
const [chains, setChains] = useState<Chain[]>([]);
  useEffect(() => {
    const searchApi = async () => {
      if (!debouncedSearch) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `https://infarma.duckdns.org/api/priceComparison/search-product-by-name?query=${debouncedSearch}`,
        );

        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          console.log(data)
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    };
    fetchChains();

    searchApi();
  }, [debouncedSearch]);

  const fetchChains = async () => {
    const res2 = await fetch(
      `https://infarma.duckdns.org/api/priceComparison/get-all-chains`,
    );
    if (res2.ok) {
      const responseData = await res2.json();
      console.log(responseData);
      // Manejo flexible de respuesta

      setChains(responseData);
    }
  };


  return (
    <div className="space-y-6 py-4">
      <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-md border">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-600">
            Nombre de la Comparación
          </label>
          <Input
            value={comparisonName}
            onChange={(e) => setComparisonName(e.target.value)}
            disabled={!!comparisonId}
            placeholder="Ej: Canasta Básica"
          />
        </div>
        <div className="col-span-3 relative group">
          {/* 'relative' es vital para que la lista flote respecto a este div */}

          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Producto Mock
          </label>

          <div className="relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className={searchResults.length > 0 ? "rounded-b-none" : ""} // Estilo opcional
            />

            {/* Icono de carga opcional */}
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* LISTA DESPLEGABLE */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full bg-white border border-t-0 border-gray-200 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.int_id_producto} // Asegúrate que tu producto tenga ID
                  onClick={() => handleSelectProduct(product)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                >
                  {product.txt_nombre}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-64">
          <label className="text-sm font-medium text-gray-600">
            Unidad Venta
          </label>
          <Select
            value={unitId}
            onValueChange={setUnitId}
            disabled={!!comparisonId}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {salesUnits.map((u) => (
                <SelectItem
                  key={u.id_unidad_venta}
                  value={u.id_unidad_venta.toString()}
                >
                  {u.txt_unidad_venta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!comparisonId && (
          <Button
            onClick={handleCreateHead}
            className="bg-green-600 hover:bg-green-700"
          >
            Crear y Continuar
          </Button>
        )}
      </div>

      {comparisonId ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Productos Asignados</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              ID Comp: {comparisonId}
            </span>
          </div>

          <div className="border rounded-md p-4 bg-white mb-6 shadow-sm">
            <NewProductRow
              comparisonId={comparisonId}
              onAdd={(newRow: any) => setRows([...rows, newRow])}
            />
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>Cadena</TableHead>
                  <TableHead>Producto General</TableHead>
                  <TableHead>Nombre en Cadena</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-20 text-gray-400"
                    >
                      Aún no has agregado productos a esta comparación.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => (
                    <TableRow key={row.id_producto_cadena}>
                      <TableCell>{row.nombre_cadena}</TableCell>
                      <TableCell className="font-medium">
                        {row.producto_general}
                      </TableCell>
                      <TableCell>{row.txt_nombre_producto}</TableCell>
                      <TableCell>
                        {row.flags && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                            {row.flags}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
          <p>
            Completa la información superior para comenzar a agregar productos.
          </p>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTE ADD ROW ---
function NewProductRow({ comparisonId, onAdd }: any) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [selectedProd, setSelectedProd] = useState<SimpleProduct>();
  const [selectedChain, setSelectedChain] = useState("");
  const [chainProductName, setChainProductName] = useState("");
  const [flags, setFlags] = useState("");

  // Aquí iría tu fetch de búsqueda...
  // useEffect(() => {
  //   const sea = async () => {
  //     const res = await fetch(
  //       `https://infarma.duckdns.org/api/priceComparison/search-products?query=${debouncedSearch}`,
  //     );
  //     const data: SimpleProduct[] = await res.json();

  //     return data;
  //   };
  //   sea();
  // }, [debouncedSearch]);

  // useEffect(() => {
  //   const fetchProductChains = async () => {
  //     const response = await fetch(
  //       `https://infarma.duckdns.org/api/priceComparison/get-products-by-comparison?id=${comparisonId}`,
  //     );

  //     if (!response.ok) {
  //       throw new Error(`Error HTTP: ${response.status}`);
  //     }
  //     const responseData = await response.json();

  //     console.log(responseData);
  //   };
  //   fetchProductChains();
  // }, []);

  const handleAdd = async () => {
    // ... Logica de agregar existente
    // Simulando que funciona para no alargar el código:
    onAdd({
      chainName: selectedChain === "1" ? "Kielsa" : "Otra",
      productGeneralName: "Producto Mock",
      productChainName: chainProductName,
      flags: flags,
    });

    console.log(
      chainProductName,
      flags,
      selectedChain,
      selectedProd,
      comparisonId,
    );

    const payload = {
      idProducto: selectedProd?.int_id_producto,
      idCadena: selectedChain,
      nombreProducto: chainProductName,
      idComparacion: comparisonId,
      flag: flags,
    };

    try {
      // 3. Llamada al Endpoint
      const res = await fetch(
        "https://infarma.duckdns.org/api/priceComparison/create-product-chain",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        throw new Error(`Error en la petición: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Producto guardado:", data);

      // 4. Actualizar la UI (Tabla)
      // Buscamos el nombre de la cadena para mostrarlo bonito en la tabla
      const chainObj = chains.find(
        (c) => c.id_cadena.toString() === selectedChain,
      );

      onAdd({
        // Usamos el ID que retorna la BD si es necesario para borrar/editar luego
        id_producto_cadena: data.insertId || data.id,
        chainName: chainObj ? chainObj.txt_nombre : "Desconocida",
        productGeneralName: selectedProd?.txt_nombre,
        productChainName: payload.nombreProducto,
      });

      // 5. Limpiar el formulario
      setChainProductName("");
      setFlags("");
      setSelectedProd(undefined);
      setSearch("");
      setSelectedChain("");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar el producto. Revisa la consola.");
    }

    setChainProductName("");
    setFlags("");
  };
  const [chains, setChains] = useState<Chain[]>([]);



  const [searchResults, setSearchResults] = useState<SimpleProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const handleSelectProduct = (product: SimpleProduct) => {
    setSelectedProd(product); // Guardas el objeto completo
    setSearch(product.txt_nombre); // Rellenas el input con el nombre
    setSearchResults([]); // Ocultas la lista
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-end">
      {/* ... Inputs existentes ... */}
      {/* Simplificado para brevedad, mantener tu código original aquí si es necesario */}
      {/*
        <div className="col-span-3 relative group">

        <label className="text-xs font-semibold text-gray-500 mb-1 block">
          Producto Mock
        </label>

        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className={searchResults.length > 0 ? "rounded-b-none" : ""} // Estilo opcional
          />

          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-t-0 border-gray-200 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <button
                key={product.int_id_producto} // Asegúrate que tu producto tenga ID
                onClick={() => handleSelectProduct(product)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
              >
                {product.txt_nombre}
              </button>
            ))}
          </div>
        )}
      </div>


      */}
      <div className="col-span-3">
        <Select value={selectedChain} onValueChange={setSelectedChain}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar Cadena" />
          </SelectTrigger>
          <SelectContent>
            {/* Validación de seguridad: (chains || []) evita el crash si chains es undefined */}
            {(chains || []).map((chain) => (
              <SelectItem
                key={chain.id_cadena}
                value={chain.id_cadena.toString()} // Radix requiere value como string
              >
                {chain.txt_nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-3">
        <Input
          placeholder="Nombre"
          value={chainProductName}
          onChange={(e) => setChainProductName(e.target.value)}
        />
      </div>
      <div className="col-span-2">
        <Input
          placeholder="Flags"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
        />
      </div>
      <div className="col-span-1">
        <Button onClick={handleAdd} className="w-full bg-blue-600">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// --- COMPONENTE DE PAGINACIÓN INTERNO ---
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  totalRecords: number;
}

function PaginationControl({
  currentPage,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  totalRecords,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white">
      <div className="flex-1 text-sm text-gray-500">
        Mostrando {(currentPage - 1) * limit + 1} a{" "}
        {Math.min(currentPage * limit, totalRecords)} de {totalRecords}{" "}
        resultados.
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Filas</p>
          <Select
            value={`${limit}`}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
