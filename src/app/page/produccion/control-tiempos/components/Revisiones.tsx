"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Eye, CheckCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRevisionesPendientes, ProduccionControl } from "@/lib/services/produccion.service";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportControlToExcel } from "@/lib/exportExcel";

export default function RevisionesProduccion() {
  const [controles, setControles] = useState<ProduccionControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRevisiones();
  }, []);

  const fetchRevisiones = async () => {
    setLoading(true);
    const data = await getRevisionesPendientes();
    setControles(data);
    setLoading(false);
  };

  const filteredControles = controles.filter((c) => 
    c.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.n_lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.op?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                      Cargando revisiones...
                    </div>
                  </td>
                </tr>
              ) : filteredControles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No hay controles de tiempo pendientes de revisión.
                  </td>
                </tr>
              ) : (
                filteredControles.map((control) => (
                  <tr key={control.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
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
                        {control.total_horas.toFixed(2)} hrs
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {control.estado === 'FINALIZADO' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Pendiente Revisión
                        </span>
                      )}
                      {control.estado === 'REVISADO' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Revisado (Pendiente Aprobar)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Link href={`/page/produccion/control-tiempos/${control.id}?mode=review`}>
                        <Button variant="outline" size="sm" className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                          <CheckCircle className="h-4 w-4" />
                          Auditar
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-slate-500 hover:text-green-600 dark:hover:text-green-400 border-slate-200"
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
