"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Search, FileSpreadsheet, Eye, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { getControlesTiempos, deleteControl, ProduccionControl } from "@/lib/services/produccion.service";
import { exportControlToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Ayudante para normalizar fechas del servidor (usualmente UTC) de forma robusta
const parseISO = (s: string) => {
  if (!s) return new Date();
  return new Date(s.replace(" ", "T"));
};

export default function ControlTiemposHistory() {
  const router = useRouter();
  const { data: session } = useSession();
  const [controles, setControles] = useState<ProduccionControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<ProduccionControl | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok = await deleteControl(deleteTarget.id, session?.user?.accessToken);
      if (ok) {
        setControles(prev => prev.filter(c => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert("No se pudo eliminar el registro. Verifique si tiene actividades en progreso.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al eliminar el registro.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredControles = controles.filter((c) => 
    c.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.n_lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.op?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcHoras = (control: ProduccionControl) => {
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
  };

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
                      Cargando registros...
                    </div>
                  </td>
                </tr>
              ) : filteredControles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : (
                filteredControles.map((control) => (
                  <tr 
                    key={control.id} 
                    onClick={() => router.push(`/page/produccion/control-tiempos/${control.id}`)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
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
                        {calcHoras(control)} hrs
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge estado={control.estado} />
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-blue-600"
                          onClick={() => router.push(`/page/produccion/control-tiempos/${control.id}`)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-emerald-600"
                          onClick={() => exportControlToExcel(control)}
                          title="Exportar a Excel"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                        {control.estado !== "REVISADO" && control.estado !== "APROBADO" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => setDeleteTarget(control)}
                            title="Eliminar registro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
            <p className="text-center text-slate-500 py-8">No se encontraron registros.</p>
          ) : (
            filteredControles.map((control) => (
              <div 
                key={control.id} 
                className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/page/produccion/control-tiempos/${control.id}`)}
                  >
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {format(new Date(control.fecha), "dd MMMM yyyy", { locale: es })}
                    </p>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{control.producto_nombre}</h3>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <StatusBadge estado={control.estado} />
                    {control.estado !== "REVISADO" && control.estado !== "APROBADO" && (
                      <button
                        onClick={() => setDeleteTarget(control)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div 
                  className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-700 cursor-pointer"
                  onClick={() => router.push(`/page/produccion/control-tiempos/${control.id}`)}
                >
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Lote / OP</p>
                    <p className="text-sm font-medium dark:text-slate-200">L: {control.n_lote} / {control.op}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Horas</p>
                    <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                      {calcHoras(control)} hrs
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL CONFIRMACIÓN DE BORRADO */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-base">Eliminar Registro</DialogTitle>
            </div>
          </DialogHeader>
          {deleteTarget && (
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                ¿Está seguro de que desea eliminar este registro? Esta acción eliminará también todas las actividades e intervalos de tiempo asociados y <strong>no se puede deshacer</strong>.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 border rounded-lg p-3 text-sm space-y-1">
                <p className="font-semibold text-slate-800 dark:text-white">{deleteTarget.producto_nombre}</p>
                <p className="text-slate-500">Lote: <span className="text-slate-700 dark:text-slate-300 font-medium">{deleteTarget.n_lote}</span></p>
                <p className="text-slate-500">OP: <span className="text-slate-700 dark:text-slate-300 font-medium">{deleteTarget.op}</span></p>
                <p className="text-slate-500">Fecha: <span className="text-slate-700 dark:text-slate-300 font-medium">{format(new Date(deleteTarget.fecha), "dd MMM yyyy", { locale: es })}</span></p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const StatusBadge = ({ estado }: { estado: string }) => {
  if (estado === 'EN_PROGRESO') return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
      En Progreso
    </span>
  );
  if (estado === 'FINALIZADO') return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
      Pend. Revisión
    </span>
  );
  if (estado === 'REVISADO') return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
      Validado
    </span>
  );
  if (estado === 'APROBADO') return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
      Aprobado
    </span>
  );
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
      {estado}
    </span>
  );
};
