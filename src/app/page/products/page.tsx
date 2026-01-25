// app/products/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Agregamos iconos para la paginación visualmente atractiva
import { ChevronLeft, ChevronRight } from "lucide-react"; 
import { Category, Product, SimpleProduct } from "@/types/comparison";

// Tipos definidos (basado en tu código anterior)
interface ApiResponse {
  pagina: number;
  items_por_pagina: number;
  total_en_vista: number;
  data: Product[];
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para la paginación
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Lo hacemos estado constante para referenciarlo en la lógica
  const [hasMore, setHasMore] = useState(true); // Para saber si habilitar el botón "Siguiente"

  const { register, handleSubmit, reset } = useForm<Product>();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        fetch("https://infarma.duckdns.org/api/priceComparison/get-all-categories")
    .then(res => res.json())
    .then((data: Category[]) => {
       setCategories(data); // TypeScript no se quejará porque las claves coinciden
    });
        // Construcción de la URL
        const url = `https://infarma.duckdns.org/api/priceComparison/get-all-products?page=${page}&limit=${limit}`;
        
        // NOTA: Si en el futuro implementas búsqueda en backend, añade: &search=${searchTerm}
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        setProducts(result.data);

        // Lógica para saber si hay más páginas:
        // Si la cantidad de datos recibidos es menor al límite, llegamos al final.
        if (result.data.length < limit) {
            setHasMore(false);
        } else {
            setHasMore(true);
        }
        
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };

    const timeoutId = setTimeout(() => {
        fetchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);

  }, [page, searchTerm, limit]); // Añadimos limit a las dependencias

  const onSubmit = async (data: SimpleProduct) => {
    console.log("Enviando datos al servidor:", data);

    try {
      // 1. Realizar la petición POST al endpoint creado
      // Ajusta la URL si tu puerto o prefijo '/api' son diferentes.
      const response = await fetch("https://infarma.duckdns.org/api/priceComparison/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // El backend espera { nombre_producto: string }
        body: JSON.stringify({ 
            nombre_producto: data.txt_nombre, 
            fk_categoria: data.fk_categoria
        }),
      });

      if (!response.ok) {
        throw new Error(`Error al crear producto: ${response.statusText}`);
      }

      // 2. Obtener la respuesta del servidor (contiene el ID generado)
      const result = await response.json();
      
      // El backend devuelve: { mensaje: "...", data: { id_producto: X, nombre_producto: "Y" } }
      const nuevoProductoInfo = result.data;

      // 3. Actualizar el estado local 'products'
      // Debemos adaptar el objeto de respuesta a la interfaz 'Product' que usa tu tabla principal
      // (recuerda que la tabla usa 'int_id_producto' y 'txt_nombre')
      const nuevoProductoParaEstado: Product = {
        int_id_producto: nuevoProductoInfo.id_producto,
        txt_nombre: nuevoProductoInfo.nombre_producto,
        fk_categoria: 0, // Valor por defecto ya que la creación simple no incluye categoría
      };

      // Agregamos el nuevo producto al final de la lista actual
      setProducts((prevProducts) => [...prevProducts, nuevoProductoParaEstado]);

      // 4. Cerrar modal y limpiar formulario
      setIsModalOpen(false);
      reset();
      
      alert("Producto creado exitosamente");

    } catch (error) {
      console.error("Error al crear el producto:", error);
      alert("Hubo un error al intentar crear el producto.");
    }
  };

  // Manejadores de cambio de página
  const handlePrevious = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (hasMore) setPage((prev) => prev + 1);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Inventario de Productos</h1>
        <Button onClick={() => setIsModalOpen(true)}>+ Nuevo Producto</Button>
      </div>

      {/* Buscador */}
      <Input 
        placeholder="Buscar producto..." 
        value={searchTerm}
        onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // Importante: Reiniciar a página 1 al buscar
        }}
        className="max-w-sm"
      />

      {/* Tabla */}
      <div className="border rounded-md bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
                products.map((prod) => (
                <TableRow key={prod.int_id_producto} onClick={() => {
                    reset(prod); 
                    setIsModalOpen(true);
                }} className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">{prod.int_id_producto}</TableCell>
                    <TableCell>{prod.txt_nombre}</TableCell>
                    <TableCell>{prod.categoria?.txt_nombre || 'Sin Categoría'}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Editar</Button>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                        No se encontraron productos.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Componente de Paginación --- */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
            {/* Opcional: Mostrar conteo si el API lo devolviera */}
             Mostrando {products.length} resultados
        </div>
        <div className="space-x-2 flex items-center">
            <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={page === 1}
                className="h-8 px-2 lg:px-3"
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
            </Button>
            
            <div className="text-sm font-medium w-24 text-center">
                Página {page}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!hasMore} // Se deshabilita si no hay más datos
                className="h-8 px-2 lg:px-3"
            >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
      </div>

      {/* Modal de Creación/Edición */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestión de Producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre General</label>
              <Input {...register("txt_nombre", { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select {...register("fk_categoria")} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-black focus:outline-none">
                 {categories.map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                 ))}
              </select>
            </div>
            <div className="pt-4">
                <Button type="submit" className="w-full">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}