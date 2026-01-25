'use client';

import { useState, useEffect, useMemo } from 'react';

// --- 1. Definición de Tipos ---

interface FilterState {
  idCadena: string;
  idCategoria: string;
  keyword: string;
  anio: number;
  mes: number;
  fechasEspecificas?: string[];
  page: number;      
  limit: number;     
  datePage: number;  
  dateLimit: number; 
}

interface ProductRow {
  producto_general: string;
  categoria: string;
  producto_cadena: string;
  [key: string]: string | number | undefined;
}

interface ApiResponse {
  meta: {
    total_fechas: number;
    pagina_fechas_actual: number;
    paginas_fechas_total: number;
    fechas_en_vista: string[];
    total_productos?: number; 
  };
  columnas: string[];
  data: ProductRow[];
}

export default function PriceComparisonTable() {
  // --- Estados ---
  const [filters, setFilters] = useState<FilterState>({
    idCadena: '1',
    idCategoria: '',
    keyword: '',
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    page: 1,
    limit: 10, 
    datePage: 1,
    dateLimit: 5,
  });

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // --- Lógica de Fecha Actual (Para validación) ---
  // Obtenemos la fecha de hoy en formato 'YYYY-MM-DD' local para comparar strings
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // --- Funciones Auxiliares ---
  
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
            params.append(key, JSON.stringify(value));
        } else {
            params.append(key, value.toString());
        }
      }
    });
    return params;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = buildQueryParams();
      const response = await fetch(`https://infarma.duckdns.org/api/priceComparison/get-comparison-by-dates?${params.toString()}`);
      
      if (!response.ok) throw new Error('Error al obtener datos');
      
      const result: ApiResponse = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
      alert('Error cargando la tabla. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const params = buildQueryParams();
      params.delete('page'); 
      params.delete('limit'); 
      
      const response = await fetch(`/api/priceComparison/export-excel?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Error al generar el Excel');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Comparativo_Precios_${filters.anio}_${filters.mes}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert('Hubo un error al intentar descargar el Excel.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.datePage, filters.anio, filters.mes, filters.idCadena]); 

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ 
        ...prev, 
        [name]: value, 
        page: 1,      
        datePage: 1   
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* --- ENCABEZADO --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Módulo de Comparación de Precios</h1>
            <p className="text-sm text-gray-500 mt-1">
                Visualiza variaciones de precios históricos.
            </p>
        </div>
        
        <button
            onClick={handleDownloadExcel}
            disabled={downloading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded shadow-sm font-medium transition-colors
                ${downloading 
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
            {downloading ? (
                <span>Generando...</span>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Descargar Reporte Excel</span>
                </>
            )}
        </button>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
            Filtros y Configuración
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* 1. Cadena */}
            <div className="flex flex-col">
                <label htmlFor="idCadena" className="text-xs font-bold text-gray-600 mb-1">Cadena</label>
                <select 
                    id="idCadena" name="idCadena" value={filters.idCadena} onChange={handleFilterChange}
                    className="border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="1">Farmacia Siman</option>
                    <option value="2">Farmacia Kielsa</option>
                    <option value="3">Punto Farma</option>
                </select>
            </div>

            {/* 2. Año */}
            <div className="flex flex-col">
                <label htmlFor="anio" className="text-xs font-bold text-gray-600 mb-1">Año</label>
                <input
                    id="anio" type="number" name="anio" value={filters.anio} onChange={handleFilterChange}
                    className="border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* 3. Mes */}
            <div className="flex flex-col">
                <label htmlFor="mes" className="text-xs font-bold text-gray-600 mb-1">Mes</label>
                <select 
                    id="mes" name="mes" value={filters.mes} onChange={handleFilterChange}
                    className="border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es-HN', {month: 'short'})}</option>
                    ))}
                </select>
            </div>

            {/* 4. Categoría */}
            <div className="flex flex-col">
                <label htmlFor="idCategoria" className="text-xs font-bold text-gray-600 mb-1">Categoría</label>
                <select 
                    id="idCategoria" name="idCategoria" value={filters.idCategoria} onChange={handleFilterChange}
                    className="border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">Todas</option>
                    <option value="101">Analgesicos</option>
                    <option value="102">Antibióticos</option>
                </select>
            </div>

             {/* 5. Límite de Filas */}
             <div className="flex flex-col">
                <label htmlFor="limit" className="text-xs font-bold text-gray-600 mb-1">Filas por pág.</label>
                <select 
                    id="limit" name="limit" value={filters.limit} onChange={handleFilterChange}
                    className="border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                >
                    <option value="10">10 registros</option>
                    <option value="25">25 registros</option>
                    <option value="50">50 registros</option>
                    <option value="100">100 registros</option>
                </select>
            </div>

             {/* 6. Buscador */}
             <div className="flex flex-col">
                <label htmlFor="keyword" className="text-xs font-bold text-gray-600 mb-1">Buscar</label>
                <div className="flex gap-1">
                    <input
                        id="keyword" type="text" name="keyword" placeholder="Nombre..." value={filters.keyword} onChange={handleFilterChange}
                        className="border border-gray-300 p-2 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button onClick={fetchData} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700">🔍</button>
                </div>
            </div>
        </div>
      </div>

      {/* --- TABLA --- */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden relative min-h-[400px]">
         {loading && (
            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <span className="mt-2 text-sm text-gray-600">Actualizando tabla...</span>
            </div>
        )}

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                    <tr>
                        <th className="px-6 py-4 sticky left-0 bg-gray-100 z-10 border-r shadow-sm">Producto General</th>
                        <th className="px-6 py-4 border-r">Producto Cadena</th>
                        <th className="px-4 py-4 border-r">Categoría</th>
                        {data?.columnas.map((fecha) => (
                            <th key={fecha} className="px-4 py-4 text-center min-w-[100px] bg-blue-50 text-blue-800 border-r border-blue-100">
                                {fecha}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data?.data.map((row, index) => (
                        <tr key={index} className="bg-white border-b hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-900 sticky left-0 bg-white border-r shadow-sm">{row.producto_general}</td>
                            <td className="px-6 py-3 border-r text-gray-500">{row.producto_cadena}</td>
                            <td className="px-4 py-3 border-r"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{row.categoria}</span></td>
                            
                            {/* Renderizado de Precios con Validación de Fechas Futuras */}
                            {data.columnas.map((fecha) => {
                                // Lógica: Si la fecha de la columna es mayor a hoy, NO mostramos relleno
                                const isFutureDate = fecha > todayStr;
                                const precio = row[fecha];

                                return (
                                    <td key={`${index}-${fecha}`} className={`px-4 py-3 text-center border-r border-gray-100 ${isFutureDate ? 'bg-gray-50' : ''}`}>
                                        {isFutureDate ? (
                                            <span className="text-gray-300" title="Fecha futura">-</span>
                                        ) : precio ? (
                                            <span className="font-mono font-medium text-gray-800">
                                                L. {Number(precio).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {!loading && (!data || data.data.length === 0) && (
                        <tr><td colSpan={10} className="text-center py-10">No hay datos.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* --- PAGINACIÓN FOOTER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 border-t gap-4">
            
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 uppercase">
                    Productos (Pág {filters.page})
                </span>
                <div className="flex items-center bg-white border rounded shadow-sm">
                    <button
                        disabled={filters.page <= 1}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 border-r"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="px-3 py-1.5 hover:bg-gray-100"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {data?.meta && (
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-700 uppercase">Fechas ({data.meta.pagina_fechas_actual}/{data.meta.paginas_fechas_total})</span>
                    <div className="flex items-center bg-white border border-blue-200 rounded shadow-sm">
                        <button
                            disabled={data.meta.pagina_fechas_actual <= 1}
                            onClick={() => setFilters(prev => ({ ...prev, datePage: prev.datePage - 1 }))}
                            className="px-3 py-1.5 hover:bg-blue-50 text-blue-700 disabled:opacity-40 border-r border-blue-100"
                        >
                            &laquo;
                        </button>
                        <button
                            disabled={data.meta.pagina_fechas_actual >= data.meta.paginas_fechas_total}
                            onClick={() => setFilters(prev => ({ ...prev, datePage: prev.datePage + 1 }))}
                            className="px-3 py-1.5 hover:bg-blue-50 text-blue-700 disabled:opacity-40"
                        >
                            &raquo;
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}