'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

// --- Interfaces ---

interface CategoryItem {
  id: number;
  nombre: string;
}

interface ComparisonItem {
  id_comparacion: number;
  txt_nombre_comparacion: string;
  fk_unidad_venta: number;
  fk_categoria: number | null;
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

interface ChartDataPoint {
  displayDate: string;
  fullDate: number;
  [key: string]: string | number | boolean; 
}

const colors = [
  { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.2)" }, // Blue
  { stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.2)" },  // Red
  { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.2)" }, // Green
  { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.2)" }, // Purple
  { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.2)" }  // Orange
];

export default function MarketingDashboard() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [comparisons, setComparisons] = useState<ComparisonItem[]>([]);
  const [selectedComparisonId, setSelectedComparisonId] = useState<number | string>('');
  
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  
  // Date Filters
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(true);

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/priceComparison/get-all-categories`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setCategories(data);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch Comparisons List
  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/priceComparison/get-comparisons?page=1&limit=500`);
        if (res.ok) {
          const responseData = await res.json();
          let dataList: ComparisonItem[] = [];
          if (responseData.data) {
             dataList = responseData.data;
          } else if (Array.isArray(responseData)) {
             dataList = responseData;
          }
          setComparisons(dataList);
        }
      } catch (error) {
        console.error("Error al cargar comparaciones:", error);
      }
    };
    fetchComparisons();
  }, []);

  // 3. Filter Comparisons by Category
  const filteredComparisons = useMemo(() => {
    let result = comparisons;
    if (selectedCategoryId) {
      result = result.filter(c => c.fk_categoria === Number(selectedCategoryId));
    }
    return [...result].sort((a, b) => a.txt_nombre_comparacion.localeCompare(b.txt_nombre_comparacion));
  }, [comparisons, selectedCategoryId]);

  // Handle default comparison selection when list changes
  useEffect(() => {
    if (filteredComparisons.length > 0) {
      // Si el id actual no está en la lista filtrada, selecciona el primero
      const currentValid = filteredComparisons.find(c => String(c.id_comparacion) === String(selectedComparisonId));
      if (!currentValid) {
        setSelectedComparisonId(filteredComparisons[0].id_comparacion);
      }
    } else {
      setSelectedComparisonId('');
    }
  }, [filteredComparisons, selectedComparisonId]);

  // 4. Fetch History for Selection
  useEffect(() => {
    if (!selectedComparisonId) {
       setHistoryData([]);
       setLoading(false);
       return;
    }
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/priceComparison/price-comparison-history?idComparacion=${selectedComparisonId}`);
        if (res.ok) {
          const data = await res.json() as HistoryResponse;
          if (data.productos && data.productos.length > 0) {
            setHistoryData(data.productos[0].historial);
          } else {
            setHistoryData([]);
          }
        }
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [selectedComparisonId]);

  // --- Processing ---
  
  const pharmacyNames = useMemo<string[]>(() => {
    if (!historyData) return [];
    const names = new Set<string>();
    historyData.forEach(h => h.precios.forEach(p => names.add(p.cadena)));
    return Array.from(names);
  }, [historyData]);

  const rawProcessedData = useMemo<ChartDataPoint[]>(() => {
    if (!historyData) return [];
    return historyData.map((entry) => {
      const fullDateStr = `${entry.fecha[0]}T${entry.fecha[1].replace('Z', '')}`; 
      const dateObj = new Date(fullDateStr);
      const dataPoint: ChartDataPoint = {
        fullDate: dateObj.getTime(),
        displayDate: `${entry.fecha[0]}`,
      };
      entry.precios.forEach((p) => {
        if (p.precio !== null) {
          dataPoint[p.cadena] = p.precio;
        }
      });
      return dataPoint;
    });
  }, [historyData]);

  // Apply Date Filter Client-Side
  const filteredData = useMemo(() => {
    let result = rawProcessedData;
    if (startDate) {
      const sd = new Date(startDate + 'T00:00:00').getTime();
      result = result.filter(d => d.fullDate >= sd);
    }
    if (endDate) {
      // End of day
      const ed = new Date(endDate + 'T23:59:59').getTime();
      result = result.filter(d => d.fullDate <= ed);
    }
    return result.sort((a, b) => a.fullDate - b.fullDate);
  }, [rawProcessedData, startDate, endDate]);

  // --- Calculations for KPIs ---
  const latestData = filteredData[filteredData.length - 1];
  const firstData = filteredData[0];

  const currentAvgPrice = useMemo(() => {
    if (!latestData) return 0;
    const prices = pharmacyNames.map(n => latestData[n]).filter(p => typeof p === 'number') as number[];
    if (prices.length === 0) return 0;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }, [latestData, pharmacyNames]);

  const previousAvgPrice = useMemo(() => {
    if (!firstData) return 0;
    const prices = pharmacyNames.map(n => firstData[n]).filter(p => typeof p === 'number') as number[];
    if (prices.length === 0) return 0;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }, [firstData, pharmacyNames]);

  const priceVariation = previousAvgPrice > 0 ? ((currentAvgPrice - previousAvgPrice) / previousAvgPrice) * 100 : 0;
  
  const cheapestChain = useMemo(() => {
    if (!latestData) return { name: '-', price: 0 };
    let minPrice = Infinity;
    let chainName = '-';
    pharmacyNames.forEach(n => {
      if (typeof latestData[n] === 'number' && latestData[n] < minPrice) {
        minPrice = latestData[n] as number;
        chainName = n;
      }
    });
    return { name: chainName, price: minPrice === Infinity ? 0 : minPrice };
  }, [latestData, pharmacyNames]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard General</h1>
            <p className="text-gray-500 mt-1">Análisis competitivo e histórico del mercado.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
             
             {/* Filtro Categoría */}
             <div className="w-full sm:w-auto min-w-[150px]">
               <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
               <select
                 value={selectedCategoryId}
                 onChange={(e) => setSelectedCategoryId(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
               >
                 <option value="">Todas</option>
                 {categories.map(c => (
                   <option key={c.id} value={c.id}>{c.nombre}</option>
                 ))}
               </select>
             </div>

             {/* Filtro Comparación */}
             <div className="w-full sm:w-auto min-w-[200px]">
               <label className="block text-xs font-semibold text-gray-500 mb-1">Grupo / Producto</label>
               <select
                 value={selectedComparisonId}
                 onChange={(e) => setSelectedComparisonId(e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
               >
                 {filteredComparisons.map(c => (
                   <option key={c.id_comparacion} value={c.id_comparacion}>{c.txt_nombre_comparacion}</option>
                 ))}
               </select>
             </div>
             
             <div className="flex gap-2 w-full sm:w-auto">
               <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors" />
               </div>
             </div>
          </div>
        </div>

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Precio Promedio Mercado</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">L. {currentAvgPrice.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center font-medium ${priceVariation > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {priceVariation > 0 ? <ArrowTrendingUpIcon className="w-4 h-4 mr-1" /> : <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />}
                {Math.abs(priceVariation).toFixed(2)}%
              </span>
              <span className="text-gray-400 ml-2">vs {firstData?.displayDate || 'inicio'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-sm font-medium text-gray-500">Cadena Recomendada</p>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-2 leading-tight pr-2 break-words">{cheapestChain.name}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-xl shrink-0">
                <ShoppingBagIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
               <span className="text-sm text-gray-500">L. {cheapestChain.price.toFixed(2)} precio min. detectado</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Métricas en Intervalo</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{filteredData.length}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">Días con registros</span>
            </div>
          </div>

          {/* Quick Status / Alert */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-sm text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-blue-100 text-sm font-medium">Estado del Mercado</p>
                  <h3 className="text-xl font-bold mt-2 leading-tight">
                    {priceVariation > 5 ? "Alerta de Inflación" : priceVariation < -5 ? "Bajas Pronunciadas" : "Mercado Estable"}
                  </h3>
               </div>
               <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ExclamationCircleIcon className="w-6 h-6 text-white" />
               </div>
            </div>
            <p className="text-xs text-blue-200 mt-4 leading-relaxed">
              Basado en la variación porcentual del grupo durante el periodo de tiempo analizado.
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Histórico de Volatilidad</h2>
          </div>
          
          {loading ? (
             <div className="bg-gray-50 h-[400px] rounded-xl flex items-center justify-center animate-pulse">
               <span className="text-gray-400 font-medium">Analizando datos del mercado...</span>
             </div>
          ) : filteredData.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                     {pharmacyNames.map((name, i) => (
                       <linearGradient key={`grad-${name}`} id={`color-${name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor={colors[i % colors.length].stroke} stopOpacity={0.3}/>
                         <stop offset="95%" stopColor={colors[i % colors.length].stroke} stopOpacity={0}/>
                       </linearGradient>
                     ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="fullDate" 
                    type="number"
                    domain={[
                      startDate ? new Date(startDate + 'T00:00:00').getTime() : 'dataMin', 
                      endDate ? new Date(endDate + 'T23:59:59').getTime() : 'dataMax'
                    ]}
                    tickFormatter={(tick) => {
                      const d = new Date(tick);
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    }}
                    tick={{fontSize: 12, fill: '#6b7280'}} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                    minTickGap={30} 
                  />
                  <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} dx={-10} tickFormatter={val => typeof val === 'number' ? `L. ${val.toFixed(2)}` : val} />
                  <Tooltip 
                    labelFormatter={(label) => {
                       const d = new Date(label);
                       return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                    }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  {pharmacyNames.map((name, index) => (
                    <Area
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={colors[index % colors.length].stroke}
                      fillOpacity={1}
                      fill={`url(#color-${name.replace(/\s+/g, '')})`}
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 h-[400px] rounded-xl flex items-center justify-center">
              <span className="text-gray-400 font-medium">No hay registros para este rango de fechas.</span>
            </div>
          )}
        </div>

        {/* Data Breakdown Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-6 border-b border-gray-100">
             <h3 className="text-lg font-bold text-gray-900">Desglose de la Última Métrica</h3>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs font-semibold">
                 <tr>
                   <th className="px-6 py-4">Cadena</th>
                   <th className="px-6 py-4 text-right">Precio Inicial del Periodo</th>
                   <th className="px-6 py-4 text-right">Precio Actual</th>
                   <th className="px-6 py-4 text-right">Variación</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {pharmacyNames.map(name => {
                    const latestPrice = latestData ? latestData[name] as number : 0;
                    const firstPrice = firstData ? firstData[name] as number : 0;
                    const hasData = typeof latestPrice === 'number' && typeof firstPrice === 'number' && firstPrice > 0;
                    const pVariation = hasData && firstPrice > 0 ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0;
                    
                    return (
                      <tr key={name} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{name}</td>
                        <td className="px-6 py-4 text-right">{firstPrice ? `L. ${firstPrice.toFixed(2)}` : '-'}</td>
                        <td className="px-6 py-4 text-right font-semibold">{latestPrice ? `L. ${latestPrice.toFixed(2)}` : '-'}</td>
                        <td className="px-6 py-4 text-right">
                           {hasData ? (
                             <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${pVariation > 0 ? 'bg-red-50 text-red-600' : pVariation < 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {pVariation > 0 ? '+' : ''}{pVariation.toFixed(2)}%
                             </span>
                           ) : (
                             <span className="text-gray-400">-</span>
                           )}
                        </td>
                      </tr>
                    )
                  })}
                  {pharmacyNames.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Seleccione un grupo para visualizar el desglose</td>
                    </tr>
                  )}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
}
