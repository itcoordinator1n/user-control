'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TableCellsIcon, 
  Squares2X2Icon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon // <--- Nuevo icono importado
} from '@heroicons/react/24/outline';

// --- Interfaces ---

interface ComparisonItem {
  id_comparacion: number;
  txt_nombre_comparacion: string;
  fk_unidad_venta: number;
}

interface ComparisonsResponse {
  pagina: number;
  items_por_pagina: number;
  total_en_vista: number;
  data: ComparisonItem[];
}

interface PriceDetail {
  cadena: string;
  precio: number | null;
  es_estimado: boolean;
}

interface HistoryEntry {
  fecha: [string, string];
  precios: PriceDetail[];
}

interface ProductHistory {
  producto_general: string;
  historial: HistoryEntry[];
}

interface HistoryResponse {
  productos: ProductHistory[];
}

// Data Flattened para Gráficos y Tabla
interface ChartDataPoint {
  displayDate: string;
  fullDate: Date;
  [key: string]: string | number | Date | boolean; 
}

// --- Componente Principal ---

const ComparisonDashboardPage = () => {
  // --- Estados de Datos ---
  const [comparisons, setComparisons] = useState<ComparisonItem[]>([]);
  const [selectedComparisonId, setSelectedComparisonId] = useState<number | string>('');
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [productName, setProductName] = useState<string>('');
  
  // --- Estados de UI ---
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false); // <--- Nuevo estado para la descarga
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // --- Paginación de Tabla ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Fetch Comparaciones
  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        setLoadingList(true);
        const res = await fetch(`https://infarma.duckdns.org/api/priceComparison/get-comparisons?page=1&limit=100`);
        if (res.ok) {
          const responseData = await res.json();
          if (responseData.data && typeof responseData.total_en_vista === "number") {
             const typedResponse = responseData as ComparisonsResponse;
             setComparisons(typedResponse.data);
             if (typedResponse.data.length > 0 && !selectedComparisonId) {
               setSelectedComparisonId(typedResponse.data[0].id_comparacion);
             }
          } else if (Array.isArray(responseData)) {
             const typedResponse = responseData as ComparisonItem[];
             setComparisons(typedResponse);
             if (typedResponse.length > 0 && !selectedComparisonId) setSelectedComparisonId(typedResponse[0].id_comparacion);
          }
        }
      } catch (error) {
        console.error("Error al cargar comparaciones:", error);
      } finally {
        setLoadingList(false);
      }
    };
    fetchComparisons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch Historial
  useEffect(() => {
    if (!selectedComparisonId) return;
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await fetch(`https://infarma.duckdns.org/api/priceComparison/price-comparison-history?idComparacion=${selectedComparisonId}`);
        if (res.ok) {
          const data = await res.json() as HistoryResponse;
          if (data.productos && data.productos.length > 0) {
            setHistoryData(data.productos[0].historial);
            setProductName(data.productos[0].producto_general);
          } else {
            setHistoryData([]);
            setProductName('');
          }
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedComparisonId]);

  // --- Nueva Función: Descargar Excel ---
  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const res = await fetch('https://infarma.duckdns.org/api/priceComparison/download-full-history-excel', {
        method: 'GET',
      });

      if (!res.ok) throw new Error('Error en la descarga del archivo');

      // Convertir la respuesta a un Blob (archivo binario)
      const blob = await res.blob();
      
      // Crear una URL temporal para el blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear un elemento <a> invisible para forzar la descarga
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Reporte_Comparativo_Precios.xlsx'); // Nombre del archivo
      document.body.appendChild(link);
      link.click();
      
      // Limpieza
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error descargando el reporte:", error);
      alert("Hubo un error al intentar descargar el reporte.");
    } finally {
      setDownloading(false);
    }
  };

  // --- Transformación de Datos ---

  const pharmacyNames = useMemo<string[]>(() => {
    if (!historyData) return [];
    const names = new Set<string>();
    historyData.forEach(h => h.precios.forEach(p => names.add(p.cadena)));
    return Array.from(names);
  }, [historyData]);

  const processedData = useMemo<ChartDataPoint[]>(() => {
    if (!historyData || historyData.length === 0) return [];
    return historyData.map((entry) => {
      const fullDateStr = `${entry.fecha[0]}T${entry.fecha[1].replace('Z', '')}`; 
      const dateObj = new Date(fullDateStr);
      
      const dataPoint: ChartDataPoint = {
        fullDate: dateObj,
        displayDate: `${entry.fecha[0]} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };

      entry.precios.forEach((p) => {
        if (p.precio !== null) {
          dataPoint[p.cadena] = p.precio;
          dataPoint[`${p.cadena}_est`] = p.es_estimado;
        }
      });
      return dataPoint;
    });
  }, [historyData]);

  const sortedTableData = useMemo(() => {
    return [...processedData].sort((a, b) => b.fullDate.getTime() - a.fullDate.getTime());
  }, [processedData]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTableData.slice(start, start + itemsPerPage);
  }, [sortedTableData, currentPage]);
  
  const totalPages = Math.ceil(sortedTableData.length / itemsPerPage);

  const latestPrices = useMemo(() => {
    if (sortedTableData.length === 0) return [];
    const latest = sortedTableData[0];
    
    return pharmacyNames.map(name => {
      const price = latest[name] as number | undefined;
      const isEstimated = latest[`${name}_est`] as boolean;
      
      let trend: 'up' | 'down' | 'equal' = 'equal';
      if (sortedTableData.length > 1 && price) {
        const prevPrice = sortedTableData[1][name] as number | undefined;
        if (prevPrice) {
          if (price > prevPrice) trend = 'up';
          else if (price < prevPrice) trend = 'down';
        }
      }

      return { name, price, isEstimated, trend };
    }).filter(item => item.price !== undefined);
  }, [sortedTableData, pharmacyNames]);

  const getMinPriceForRow = (row: ChartDataPoint): number => {
    const prices = pharmacyNames
      .map(name => row[name])
      .filter(val => typeof val === 'number') as number[];
    return Math.min(...prices);
  };

  const colors = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c"];

  // --- Render ---
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header y Controles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitor de Precios</h1>
            <p className="text-gray-500 text-sm">Comparativa histórica entre cadenas</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            {/* Botón de Descarga Excel */}
            <button
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Descargar Informe Completo
                </>
              )}
            </button>

            {/* Selector de Comparación */}
            <div className="w-full sm:w-64">
              <select
                value={selectedComparisonId}
                onChange={(e) => setSelectedComparisonId(Number(e.target.value))}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={loadingList}
              >
                {comparisons.map((item) => (
                  <option key={item.id_comparacion} value={item.id_comparacion}>
                    {item.txt_nombre_comparacion}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Gráfico Principal */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-6">Tendencia de Precios</h2>
          {loadingHistory ? (
             <div className="h-64 flex items-center justify-center text-gray-400 animate-pulse">Cargando gráfico...</div>
          ) : processedData.length > 0 ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="displayDate" tick={{fontSize: 11}} height={50} dy={10} />
                  <YAxis width={40} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  {pharmacyNames.map((name, index) => (
                    <Line
                      key={name}
                      type="stepAfter"
                      dataKey={name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">Sin datos</div>
          )}
        </div>

        {/* Sección Inferior: Tablero de Datos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Toolbar de la Tabla */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-700">Detalle de Precios</h3>
            
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Ver Tabla Histórica"
              >
                <TableCellsIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Ver Precios Actuales"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido: Modo Tabla o Modo Tarjetas */}
          <div className="p-6">
            {loadingHistory ? (
               <div className="text-center py-10 text-gray-400">Cargando datos...</div>
            ) : processedData.length === 0 ? (
               <div className="text-center py-10 text-gray-400">No hay historial disponible</div>
            ) : (
              <>
                {/* VISTA 1: TABLA HISTÓRICA */}
                {viewMode === 'table' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                              Fecha / Hora
                            </th>
                            {pharmacyNames.map(name => (
                              <th key={name} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedData.map((row, idx) => {
                            const minPrice = getMinPriceForRow(row);
                            return (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium sticky left-0 bg-white">
                                  {row.displayDate}
                                </td>
                                {pharmacyNames.map(name => {
                                  const price = row[name] as number | undefined;
                                  const isEstimated = row[`${name}_est`] as boolean;
                                  const isCheapest = price === minPrice;

                                  return (
                                    <td key={name} className="px-6 py-4 whitespace-nowrap text-center">
                                      {price !== undefined ? (
                                        <div className="flex flex-col items-center">
                                          <span className={`text-sm font-semibold ${isCheapest ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-full' : 'text-gray-700'}`}>
                                            L. {price.toFixed(2)}
                                          </span>
                                          {isEstimated && (
                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 rounded border border-amber-100 mt-1">
                                              Estimado
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-300 text-lg">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    <div className="flex items-center justify-between mt-4 px-2">
                      <span className="text-sm text-gray-500">
                        Mostrando página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VISTA 2: TARJETAS */}
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-300">
                    {latestPrices.map((item) => (
                      <div key={item.name} className="bg-white border border-gray-200 rounded-xl p-6 relative hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{item.name}</p>
                            <h4 className="text-3xl font-bold text-gray-900 mt-1">
                              L. {Number(item.price).toFixed(2)}
                            </h4>
                          </div>
                          <div className={`p-2 rounded-full ${item.trend === 'up' ? 'bg-red-50 text-red-600' : item.trend === 'down' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {item.trend === 'up' && <ArrowTrendingUpIcon className="w-6 h-6" />}
                            {item.trend === 'down' && <ArrowTrendingDownIcon className="w-6 h-6" />}
                            {item.trend === 'equal' && <span className="text-xl font-bold px-1">=</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                           {item.isEstimated ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                               Precio Estimado
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                               Verificado
                             </span>
                           )}
                           <span className="text-xs text-gray-400 ml-auto">
                             Última act. hoy
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ComparisonDashboardPage;