'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Download, Search, Filter, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// --- TIPOS DE DATOS ---

interface MetaData {
  fecha_utilizada: string;
  es_fecha_actual: boolean;
  pagina_actual: number;
  items_por_pagina: number;
  total_paginas: number | null;
}

interface ProductoRow {
  id_producto: number;
  producto: string;
  categoria: string;
  [key: string]: string | number | null; // Firma de índice para las cadenas dinámicas (Kielsa, Siman, etc.)
}

interface ApiResponse {
  meta: MetaData;
  columnas: string[];
  data: ProductoRow[];
}

// --- COMPONENTE PRINCIPAL ---

export default function PriceComparisonView() {
  // 1. Estados de Filtros y Paginación
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Límite fijo o podría ser seleccionable
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string>('');
  
  // 2. Estados de Datos
  const [data, setData] = useState<ProductoRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Función para obtener datos (Fetch)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Parsear la fecha seleccionada (YYYY-MM-DD)
      const dateObj = new Date(selectedDate);
      // Nota: getMonth() devuelve 0-11, sumamos 1. Ajustar zona horaria si es necesario.
      const dia = dateObj.getUTCDate(); 
      const mes = dateObj.getUTCMonth() + 1;
      const anio = dateObj.getUTCFullYear();

      // Construcción de la URL
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        dia: dia.toString(),
        mes: mes.toString(),
        anio: anio.toString(),
      });

      if (categoryId) {
        params.append('idCategoria', categoryId);
      }

      // IMPORTANTE: Ajusta la URL base según tu entorno
      const response = await fetch(`https://infarma.duckdns.org/api/priceComparison/get-comparison-table?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los datos del servidor');
      }

      const result: ApiResponse = await response.json();

      setData(result.data);
      setColumns(result.columnas);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedDate, categoryId]);

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 4. Función para Exportar a Excel
  const handleDownloadExcel = () => {
    if (data.length === 0) return;

    // Crear una hoja de trabajo a partir de los datos JSON
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Comparativa Precios");

    // Generar nombre de archivo con fecha
    const fileName = `Comparativa_Precios_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // 5. Manejadores de Eventos
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Resetear a página 1 al filtrar
    fetchData();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setPage(1);
  };

  // --- RENDERIZADO ---

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitor de Precios Farmacéuticos</h1>
            <p className="text-sm text-gray-500 mt-1">
              Comparativa de productos entre cadenas
              {meta?.fecha_utilizada && <span className="font-medium ml-1">({meta.fecha_utilizada})</span>}
            </p>
          </div>
          <button
            onClick={handleDownloadExcel}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Exportar Excel
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            
            {/* Filtro Fecha */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 mb-1">FECHA DE MUESTREO</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Filtro Categoría */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 mb-1">ID CATEGORÍA</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  placeholder="Ej: 5"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Botón Buscar (Opcional ya que los efectos disparan la búsqueda, pero bueno para UX) */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm h-[42px]"
            >
              Filtrar
            </button>
          </form>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center items-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              Cargando comparaciones...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-500 bg-red-50">
              <p>Ocurrió un error: {error}</p>
              <button onClick={fetchData} className="mt-2 text-blue-600 underline">Reintentar</button>
            </div>
          ) : data.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Search size={40} className="mx-auto mb-2 opacity-20" />
              <p>No se encontraron datos para los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    {columns.map((col, index) => (
                      <th key={index} scope="col" className="px-6 py-4 font-bold tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr 
                      key={row.id_producto || rowIndex} 
                      className="bg-white border-b hover:bg-gray-50 transition-colors"
                    >
                      {columns.map((col, colIndex) => {
                        // Lógica para renderizar la celda
                        const cellValue = row[col];
                        
                        // Estilos condicionales: Si es precio, alinear a la derecha, si es texto a la izquierda
                        const isPrice = !['producto', 'categoria', 'id_producto'].includes(col);
                        
                        return (
                          <td 
                            key={`${rowIndex}-${colIndex}`} 
                            className={`px-6 py-4 ${isPrice ? 'font-mono text-right' : 'font-medium text-gray-900'}`}
                          >
                            {cellValue !== null && cellValue !== undefined 
                              ? (isPrice ? `L. ${cellValue}` : cellValue) 
                              : <span className="text-gray-300 text-xs italic">N/D</span>
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && meta && (
            <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-600 mb-2 md:mb-0">
                Página <span className="font-semibold text-gray-900">{meta.pagina_actual}</span>
                {meta.total_paginas && <span> de <span className="font-semibold">{meta.total_paginas}</span></span>}
              </span>
              
              <div className="inline-flex mt-2 xs:mt-0">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} className="mr-1"/> Anterior
                </button>
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  // Si total_paginas es null (según tu JSON de ejemplo), quizás quieras deshabilitar si no hay datos
                  disabled={meta.total_paginas ? page >= meta.total_paginas : data.length < limit} 
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 border-l-0 rounded-r-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight size={16} className="ml-1"/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}