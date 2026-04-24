"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CheckCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { getControlesTiempos, ProduccionControl } from "@/lib/services/produccion.service";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportControlToExcel } from "@/lib/exportExcel";

// Ayudante para normalizar fechas del servidor (usualmente UTC) de forma robusta
const parseISO = (s: string) => {
  if (!s) return new Date();
  // Normalizar formato y dejar que el navegador maneje la zona horaria local
  return new Date(s.replace(" ", "T"));
};

export default function ControlTiemposRevisiones() {
  const router = useRouter();
  const { data: session } = useSession();
  const [controles, setControles] = useState<ProduccionControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    fetchControles();
  }, [session?.user?.accessToken]);

  const fetchControles = async () => {
    setLoading(true);
    try {
      const data = await getControlesTiempos(session?.user?.accessToken);
      // Solo controles en estado FINALIZADO (Pendiente Revisión)
      setControles(data.filter(c => c.estado === 'FINALIZADO'));
    } catch(e) { console.error(e); setControles([]); }
    finally { setLoading(false); }
  };

  const filteredControles = controles.filter((c) => 
    c.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.n_lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.op?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por producto, lote, OP..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Vista de Tabla (Desktop) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Lote / OP</th>
                <th className="px-6 py-4 font-semibold">Total Horas</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                      Cargando revisiones...
                    </div>
                  </td>
                </tr>
              ) : filteredControles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No hay revisiones pendientes.
                  </td>
                </tr>
              ) : (
                filteredControles.map((control) => (
                  <tr key={control.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {format(new Date(control.fecha), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {control.producto_nombre}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">L: {control.n_lote}</span>
                        <span className="text-xs text-slate-500">OP: {control.op}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {(() => {
                          let totalMs = 0;
                          control.actividades?.forEach(act => {
                            act.intervalos?.forEach(int => {
                              if (int.hora_inicio) {
                                const st = parseISO(int.hora_inicio).getTime();
                                const ed = int.hora_fin ? parseISO(int.hora_fin).getTime() : Date.now();
                                totalMs += Math.max(0, ed - st);
                              }
                            });
                          });
                          return (totalMs / (1000 * 60 * 60)).toFixed(2);
                        })()} hrs
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        Pendiente Revisión
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400"
                        onClick={() => router.push(`/page/produccion/control-tiempos/${control.id}`)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Auditar
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-slate-500"
                        onClick={() => exportControlToExcel(control)}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista de Tarjetas (Tablet/Mobile) */}
        <div className="lg:hidden p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : filteredControles.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No hay revisiones pendientes.</p>
          ) : (
            filteredControles.map((control) => (
              <div 
                key={control.id} 
                className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {format(new Date(control.fecha), "dd MMMM yyyy", { locale: es })}
                    </p>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{control.producto_nombre}</h3>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Pendiente
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-700 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Lote / OP</p>
                    <p className="text-sm font-medium dark:text-slate-200">L: {control.n_lote} / {control.op}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Horas</p>
                    <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                      {(() => {
                        let totalMs = 0;
                        control.actividades?.forEach(act => {
                          act.intervalos?.forEach(int => {
                            if (int.hora_inicio) {
                              const st = parseISO(int.hora_inicio).getTime();
                              const ed = int.hora_fin ? parseISO(int.hora_fin).getTime() : Date.now();
                              totalMs += Math.max(0, ed - st);
                            }
                          });
                        });
                        return (totalMs / (1000 * 60 * 60)).toFixed(2);
                      })()} hrs
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
                    onClick={() => router.push(`/page/produccion/control-tiempos/${control.id}`)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Auditar Registro
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9 text-slate-500"
                    onClick={() => exportControlToExcel(control)}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
