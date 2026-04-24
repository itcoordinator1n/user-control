"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Search, FileSpreadsheet, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { getControlesTiempos, ProduccionControl } from "@/lib/services/produccion.service";
import { exportControlToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Ayudante para normalizar fechas del servidor (usualmente UTC) de forma robusta
const parseISO = (s: string) => {
  if (!s) return new Date();
  // Normalizar formato y dejar que el navegador maneje la zona horaria local
  return new Date(s.replace(" ", "T"));
};

export default function ControlTiemposHistory() {
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
      setControles(data);
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
      <div className="flex justify-end mb-4">
        <Link href="/page/produccion/control-tiempos/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo Registro
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 gap-4">
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 md:px-6 py-4 font-semibold whitespace-nowrap">Fecha</th>
                <th className="px-4 md:px-6 py-4 font-semibold whitespace-nowrap">Producto</th>
                <th className="px-4 md:px-6 py-4 font-semibold whitespace-nowrap">Lote / OP</th>
                <th className="px-4 md:px-6 py-4 font-semibold whitespace-nowrap">Total Horas</th>
                <th className="px-4 md:px-6 py-4 font-semibold whitespace-nowrap">Estado</th>
                <th className="px-4 md:px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                      Cargando registros...
                    </div>
                  </td>
                </tr>
              ) : filteredControles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron registros de control de tiempos.
                  </td>
                </tr>
              ) : (
                filteredControles.map((control) => (
                  <tr 
                    key={control.id} 
                    onClick={() => router.push(`/page/produccion/control-tiempos/${control.id}`)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 md:px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {format(new Date(control.fecha), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-600 dark:text-slate-300 min-w-[150px]">
                      {control.producto_nombre}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">L: {control.n_lote}</span>
                        <span className="text-xs text-slate-500">OP: {control.op}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 font-mono whitespace-nowrap">
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
                          const totalHours = totalMs / (1000 * 60 * 60);
                          return totalHours.toFixed(2);
                        })()} hrs
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      {control.estado === 'EN_PROGRESO' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          En Progreso
                        </span>
                      )}
                      {control.estado === 'FINALIZADO' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                          Finalizado (Pend. Revisión)
                        </span>
                      )}
                      {control.estado === 'REVISADO' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Validado
                        </span>
                      )}
                      {control.estado === 'APROBADO' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          Aprobado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Ver Detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-500 hover:text-green-600 dark:hover:text-green-400 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportControlToExcel(control);
                        }}
                        title="Exportar a Excel"
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
      </div>
    </div>
  );
}
