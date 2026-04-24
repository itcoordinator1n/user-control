"use client";

import { useEffect, useState } from "react";
import { getOcupacionGlobal, OcupacionGlobal } from "@/lib/services/produccion.service";
import { useSession } from "next-auth/react";
import { Factory, Clock, Users, RefreshCw, AlertCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Ayudante para normalizar fechas del servidor (usualmente UTC) de forma robusta
const parseISO = (s: string) => {
  if (!s) return new Date();
  // Normalizar formato y dejar que el navegador maneje la zona horaria local
  return new Date(s.replace(" ", "T"));
};

const TimerLive = ({ startTime }: { startTime: string }) => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const d = parseISO(startTime);
    const interval = setInterval(() => {
      setTime(formatDistanceToNow(d, { locale: es, includeSeconds: true }));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span>hace {time}</span>;
};

export default function TableroOcupacion() {
  const { data: session } = useSession();
  const [ocupacion, setOcupacion] = useState<OcupacionGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("Todas");
  const [filterActividad, setFilterActividad] = useState("Todas");

  const fetchData = async () => {
    try {
      const data = await getOcupacionGlobal(session?.user?.accessToken);
      setOcupacion(data);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data and set up polling
  useEffect(() => {
    if (!session?.user?.accessToken) return; // Wait for session
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [session?.user?.accessToken]);

  const totalOcupados = ocupacion.reduce((acc, area) => acc + area.operarios.length, 0);

  // Derived filter options
  const areasDisponibles = ["Todas", ...Array.from(new Set(ocupacion.map(o => o.area)))];
  const actividadesDisponibles = ["Todas", ...Array.from(new Set(ocupacion.flatMap(o => o.operarios.map(op => op.actividad_nombre))))];

  // Apply filters
  const filteredOcupacion = ocupacion
    .filter(a => filterArea === "Todas" || a.area === filterArea)
    .map(a => {
      const filteredOps = a.operarios.filter(op => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term || 
          op.operario_nombre.toLowerCase().includes(term) ||
          op.producto_nombre.toLowerCase().includes(term) ||
          op.n_lote.toLowerCase().includes(term);
        
        const matchesAct = filterActividad === "Todas" || op.actividad_nombre === filterActividad;
        
        return matchesSearch && matchesAct;
      });
      return { ...a, operarios: filteredOps };
    });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <p className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {totalOcupados} {totalOcupados === 1 ? 'operario activo' : 'operarios activos'} en planta
          </p>
        </div>
        <div className="flex flex-col items-end">
          <button 
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-full shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            Actualizar
          </button>
          <span className="text-xs text-slate-400 mt-2">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Seccion de Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Nombre del operario, lote, producto..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-48 space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Área</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
          >
            {areasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="w-full md:w-64 space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Actividad</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterActividad}
            onChange={(e) => setFilterActividad(e.target.value)}
          >
            {actividadesDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading && ocupacion.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : ocupacion.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No hay información de ocupación</h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2">Verifica la conexión con el servidor o asegúrate de que existan áreas registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredOcupacion.map((area) => (
            <div key={area.area} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
              
              {/* Card Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{area.area}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  area.operarios.length > 0 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {area.operarios.length} {area.operarios.length === 1 ? 'Activo' : 'Activos'}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1">
                {area.operarios.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                    <p className="text-sm">No hay operarios en esta área</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {area.operarios.map((op, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-blue-100 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-900/10">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{op.operario_nombre}</h3>
                          <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                            <Clock className="h-3 w-3" />
                            <TimerLive startTime={op.hora_inicio} />
                          </span>
                        </div>
                        
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-medium">{op.actividad_nombre}</span>
                        </div>
                        
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span><strong>Lote:</strong> {op.n_lote}</span>
                          <span><strong>Prod:</strong> {op.producto_nombre}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
