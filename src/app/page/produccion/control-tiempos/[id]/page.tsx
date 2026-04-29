"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlusCircle, StopCircle, Play, Save, Clock, ArrowLeft, Loader2, Trash2, Eye, CheckCircle, ShieldCheck, LayoutGrid, Table, List, Search, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getControlTiemposById,
  getEmpleadosProduccion,
  getAreas,
  getGruposPorArea,
  getActividadesPorGrupo,
  addActividad,
  iniciarIntervalo,
  terminarIntervalo,
  crearInterrupcion,
  terminarInterrupcion,
  deleteActividad,
  deleteIntervalo,
  updateControlTiempos,
  marcarComoRevisado,
  deleteControl,
  ProduccionControl,
  ProduccionActividad,
  ProduccionEmpleado,
  ProduccionArea,
  ProduccionGrupo,
  ActividadCatalogo
} from "@/lib/services/produccion.service";
import { StopTimerModal, StopAction } from "@/components/produccion/stop-timer-modal";

// Ayudante para normalizar fechas del servidor (usualmente UTC) de forma robusta
const parseISO = (s: string) => {
  if (!s) return new Date();
  // Normalizar formato y dejar que el navegador maneje la zona horaria local
  return new Date(s.replace(" ", "T"));
};

const TimerDisplay = ({ horaInicio }: { horaInicio: string }) => {
  const [timeStr, setTimeStr] = useState("00:00:00");

  useEffect(() => {
    const startDate = parseISO(horaInicio);
    const start = startDate.getTime();
    
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, now - start);
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeStr(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [horaInicio]);

  return <span className="font-mono font-medium text-lg">{timeStr}</span>;
};

import { FORMATO_ACTIVIDADES } from "@/lib/exportExcel";

export default function DetalleControlTiempos() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isReviewMode = searchParams.get("mode") === "review";
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ? parseInt(session.user.id as string) : 2; // Default mock boss ID
  
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState<ProduccionEmpleado[]>([]);
  const [areasCatalog, setAreasCatalog] = useState<ProduccionArea[]>([]);
  const [control, setControl] = useState<ProduccionControl | null>(null);

  // Step-by-step modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4>(1);
  const [modalGrupos, setModalGrupos] = useState<ProduccionGrupo[]>([]);
  const [modalActividades, setModalActividades] = useState<ActividadCatalogo[]>([]);
  const [modalLoadingGrupos, setModalLoadingGrupos] = useState(false);
  const [modalLoadingActs, setModalLoadingActs] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<ProduccionGrupo | null>(null);
  const [nuevaAct, setNuevaAct] = useState({ categoria: "General", actividad_nombre: "", fk_operario: 0 });
  const [pendingQueue, setPendingQueue] = useState<Array<{
    categoria: string;
    actividad_nombre: string;
    fk_operario: number;
    operario_nombre: string;
  }>>([]);
  const [isAddingAct, setIsAddingAct] = useState(false);
  const [resumenActividad, setResumenActividad] = useState<ProduccionActividad | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");

  // Stop-timer modal state
  const [stopModal, setStopModal] = useState<{
    actividadId: string;
    actividadNombre: string;
    intervaloId: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.accessToken) return;
      setLoading(true);
      try {
        const [emp, areas, ctrl] = await Promise.all([
          getEmpleadosProduccion(session?.user?.accessToken),
          getAreas(session?.user?.accessToken),
          getControlTiemposById(id, session?.user?.accessToken)
        ]);
        setEmpleados(emp);
        setAreasCatalog(areas);
        if (ctrl) {
          setControl(ctrl);
        } else {
          const { getControlesTiempos } = await import("@/lib/services/produccion.service");
          const all = await getControlesTiempos(session?.user?.accessToken);
          const found = all.find(c => c.id === id);
          if (found) setControl(found);
          else {
            alert("Registro no encontrado");
            router.push("/page/produccion/control-tiempos");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, router]);

  // Añade la actividad actual a la cola y pasa al paso 4
  const handleAddToQueue = () => {
    if (!nuevaAct.actividad_nombre || !nuevaAct.fk_operario) return;
    const operario = empleados.find(e => e.int_id_empleado === nuevaAct.fk_operario);
    setPendingQueue(prev => [
      ...prev,
      {
        categoria: nuevaAct.categoria,
        actividad_nombre: nuevaAct.actividad_nombre,
        fk_operario: nuevaAct.fk_operario,
        operario_nombre: operario?.nombre_completo || "Operario",
      },
    ]);
    setModalStep(4);
    setNuevaAct({ categoria: "General", actividad_nombre: "", fk_operario: 0 });
  };

  // Inicia todas las actividades de la cola en paralelo
  const handleIniciarTodas = async () => {
    if (pendingQueue.length === 0 || !control) return;
    setIsAddingAct(true);
    try {
      const results = await Promise.all(
        pendingQueue.map(async (item) => {
          const act = await addActividad(
            { fk_control: control.id, ...item },
            session?.user?.accessToken
          );
          const intervalo = await iniciarIntervalo(act.id, session?.user?.accessToken);
          act.intervalos = [intervalo];
          return act;
        })
      );
      setControl(prev =>
        prev ? { ...prev, actividades: [...prev.actividades, ...results] } : prev
      );
      // Reset modal
      setIsModalOpen(false);
      setModalStep(1);
      setSelectedGrupo(null);
      setPendingQueue([]);
      setNuevaAct({ categoria: "General", actividad_nombre: "", fk_operario: 0 });
    } catch (e) {
      console.error(e);
      alert("Error al iniciar actividades");
    } finally {
      setIsAddingAct(false);
    }
  };


  const handleOpenModal = async () => {
    setModalStep(1);
    setSelectedGrupo(null);
    setNuevaAct({ categoria: "General", actividad_nombre: "", fk_operario: 0 });
    setPendingQueue([]);
    setModalGrupos([]);
    setModalActividades([]);
    setIsModalOpen(true);

    const areaObj = areasCatalog.find(a => a.nombre === control?.area);
    if (areaObj) {
      setModalLoadingGrupos(true);
      try {
        const grupos = await getGruposPorArea(areaObj.id, session?.user?.accessToken);
        setModalGrupos(grupos);
      } catch (e) {
        console.error("Error cargando grupos:", e);
      } finally {
        setModalLoadingGrupos(false);
      }
    }
  };

  const handleSelectGrupo = async (grupo: ProduccionGrupo) => {
    setSelectedGrupo(grupo);
    setNuevaAct(prev => ({ ...prev, actividad_nombre: "", categoria: grupo.nombre }));
    setModalActividades([]);
    setModalLoadingActs(true);
    setModalStep(2);
    try {
      const acts = await getActividadesPorGrupo(grupo.id, session?.user?.accessToken);
      setModalActividades(acts);
    } catch (e) {
      console.error("Error cargando actividades:", e);
    } finally {
      setModalLoadingActs(false);
    }
  };

  // Abre el modal de pausa en lugar de detener directo
  const handleTerminarAccion = (actividadId: string, intervaloId: string) => {
    const act = control?.actividades.find(a => a.id === actividadId);
    setStopModal({
      actividadId,
      actividadNombre: act?.actividad_nombre ?? "Actividad",
      intervaloId,
    });
  };

  // Se llama cuando el usuario confirma en el modal de pausa
  const handleStopConfirm = async (action: StopAction, observaciones: string) => {
    if (!stopModal) return;
    const { actividadId, intervaloId } = stopModal;

    if (action === "TRABAJO_TERMINADO") {
      const intervaloFin = await terminarIntervalo(
        intervaloId,
        { motivo_pausa: action, observaciones },
        session?.user?.accessToken
      );
      setControl(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: prev.actividades.map(a =>
            a.id === actividadId
              ? { ...a, intervalos: a.intervalos.map(i => i.id === intervaloId ? { ...i, hora_fin: intervaloFin.hora_fin, motivo_pausa: intervaloFin.motivo_pausa, observaciones: intervaloFin.observaciones } : i) }
              : a
          ),
        };
      });
      setStopModal(null);
    } else if (action === "INTERRUPCION") {
      // 1. Cerrar el intervalo activo
      const intervaloFin = await terminarIntervalo(
        intervaloId,
        { motivo_pausa: "INTERRUPCION", observaciones },
        session?.user?.accessToken
      );
      // 2. Crear registro de interrupción
      const interrupcion = await crearInterrupcion(intervaloId, observaciones, session?.user?.accessToken);
      // 3. Actualizar estado local
      setControl(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: prev.actividades.map(a =>
            a.id === actividadId
              ? {
                  ...a,
                  intervalos: a.intervalos.map(i =>
                    i.id === intervaloId
                      ? { ...i, hora_fin: intervaloFin.hora_fin, motivo_pausa: "INTERRUPCION", observaciones, interrupciones: [interrupcion] }
                      : i
                  ),
                }
              : a
          ),
        };
      });
      setStopModal(null);
    }
  };

  const handleNuevoIntervalo = async (actividad: ProduccionActividad) => {
    const isRunningElsewhere = control?.actividades.some(a => a.fk_operario === actividad.fk_operario && a.intervalos.some(i => i.hora_fin === null));
    if (isRunningElsewhere) return alert("Este operario ya tiene un cronómetro activo. Deténgalo primero.");
    try {
      const nuevoIntervalo = await iniciarIntervalo(actividad.id, session?.user?.accessToken);
      setControl(prev => prev ? { ...prev, actividades: prev.actividades.map(a => a.id === actividad.id ? { ...a, intervalos: [...a.intervalos, nuevoIntervalo] } : a) } : prev);
    } catch (e) {
      console.error(e);
      alert("Error al iniciar nuevo intervalo");
    }
  };

  const handleEliminarActividad = async (actividadId: string) => {
    if (!confirm("¿Está seguro de eliminar esta actividad y todos sus tiempos registrados?")) return;
    try {
      const ok = await deleteActividad(actividadId, session?.user?.accessToken);
      if (ok) {
        setControl(prev => prev ? { ...prev, actividades: prev.actividades.filter(a => a.id !== actividadId) } : prev);
        if (resumenActividad?.id === actividadId) setResumenActividad(null);
      }
    } catch (e) { console.error(e); alert("Error al eliminar la actividad"); }
  };

  const handleEliminarIntervalo = async (actividadId: string, intervaloId: string) => {
    if (!confirm("¿Está seguro de eliminar este intervalo de tiempo?")) return;
    try {
      const ok = await deleteIntervalo(intervaloId, session?.user?.accessToken);
      if (ok) {
        setControl(prev => prev ? { ...prev, actividades: prev.actividades.map(a => a.id === actividadId ? { ...a, intervalos: a.intervalos.filter(i => i.id !== intervaloId) } : a) } : prev);
        setResumenActividad(prev => (prev && prev.id === actividadId) ? { ...prev, intervalos: prev.intervalos.filter(i => i.id !== intervaloId) } : prev);
      }
    } catch (e) { console.error(e); alert("Error al eliminar el intervalo"); }
  };

  const handleFinalizarRegistro = async () => {
    const hasRunning = control?.actividades.some(a => a.intervalos.some(i => i.hora_fin === null));
    if (hasRunning) return alert("Aún hay cronómetros en ejecución. Deténgalos todos antes de finalizar el registro.");
    const obs = prompt("Observaciones opcionales para este registro:", control?.observaciones || "");
    if (obs === null) return; // cancelled
    try {
      await updateControlTiempos(control!.id, obs, "FINALIZADO", session?.user?.accessToken);
      router.push("/page/produccion/control-tiempos");
    } catch (e) { console.error(e); alert("Error al finalizar"); }
  };

  const handleEliminarControl = async () => {
    if (!confirm("¿Está seguro de eliminar TODO el registro de control de tiempos y todas sus actividades? Esta acción no se puede deshacer.")) return;
    try {
      const ok = await deleteControl(control!.id, session?.user?.accessToken);
      if (ok) {
        alert("Registro eliminado exitosamente");
        router.push("/page/produccion/control-tiempos");
      } else {
        alert("No se pudo eliminar el registro. Verifique si tiene actividades en progreso.");
      }
    } catch (e) { console.error(e); alert("Error al eliminar el registro"); }
  };

  const handleMarcarRevisado = async () => {
    if (!confirm("¿Confirma que ha revisado este control de tiempos?")) return;
    try {
      const ok = await marcarComoRevisado(control!.id, currentUserId, session?.user?.accessToken);
      if (ok) {
        setControl(prev => prev ? { ...prev, estado: "REVISADO", revisado_por: currentUserId, revisado_por_nombre: session?.user?.name || "Jefe de Manufactura" } : prev);
        alert("Marcado como revisado exitosamente");
        if (isReviewMode) router.push("/page/produccion/revisiones");
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  if (!control) return <div className="p-10 text-center">No se encontró el registro</div>;

  const isEnProgreso = control.estado === "EN_PROGRESO";
  const isFinalizado = control.estado === "FINALIZADO";
  const isRevisado = control.estado === "REVISADO";
  const isReadonly = !isEnProgreso;

  const operariosOcupadosIds = control.actividades.filter(a => a.intervalos.some(i => i.hora_fin === null)).map(a => a.fk_operario) || [];
  const empleadosDisponibles = empleados.filter(e => !operariosOcupadosIds.includes(e.int_id_empleado));

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Detalle de Registro
            {isEnProgreso && <span className="text-xs px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 font-semibold tracking-wider animate-pulse">EN PROGRESO</span>}
            {isFinalizado && <span className="text-xs px-2.5 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-semibold tracking-wider">FINALIZADO (PEND. REVISIÓN)</span>}
            {isRevisado && <span className="text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold tracking-wider">REVISADO / COMPLETADO</span>}
          </h1>
        </div>
        {!isRevisado && (
          <Button 
            variant="ghost" 
            onClick={handleEliminarControl}
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Eliminar Registro</span>
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100 border-b pb-2">Datos del Proceso</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="space-y-2"><Label>Proceso</Label><input type="text" className="w-full px-3 py-2 border rounded-md bg-slate-100 dark:bg-slate-800" disabled value={control.proceso} /></div>
          <div className="space-y-2"><Label>Producto</Label><input type="text" className="w-full px-3 py-2 border rounded-md bg-slate-100 dark:bg-slate-800" disabled value={control.producto_nombre} /></div>
          <div className="space-y-2"><Label>Área</Label><input type="text" className="w-full px-3 py-2 border rounded-md bg-slate-100 dark:bg-slate-800" disabled value={control.area} /></div>
          <div className="space-y-2"><Label>Nº de Lote</Label><input type="text" className="w-full px-3 py-2 border rounded-md bg-slate-100 dark:bg-slate-800" disabled value={control.n_lote} /></div>
          <div className="space-y-2"><Label>O/P</Label><input type="text" className="w-full px-3 py-2 border rounded-md bg-slate-100 dark:bg-slate-800" disabled value={control.op} /></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Actividades Registradas</h2>
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-md flex items-center shadow-inner">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`px-3 py-1.5 text-xs h-8 gap-2 ${viewMode === 'cards' ? 'bg-white shadow-sm dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setViewMode('cards')}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Tarjetas
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`px-3 py-1.5 text-xs h-8 gap-2 ${viewMode === 'list' ? 'bg-white shadow-sm dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setViewMode('list')}
                title="Vista Lista"
              >
                <List className="h-3.5 w-3.5" />
                Lista
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`px-3 py-1.5 text-xs h-8 gap-2 ${viewMode === 'table' ? 'bg-white shadow-sm dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setViewMode('table')}
                title="Vista Planilla"
              >
                <Table className="h-3.5 w-3.5" />
                Planilla
              </Button>
            </div>
            {viewMode === 'cards' && (
              <input type="text" placeholder="Buscar operario o actividad..." className="px-3 py-2 border rounded-md text-sm min-w-[200px] bg-slate-50 dark:bg-slate-800" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            )}
            {!isReadonly && (
              <Button onClick={handleOpenModal} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                <PlusCircle className="h-4 w-4" /> Nueva Actividad
              </Button>
            )}
          </div>
        </div>

        {/* CONDITIONAL RENDER: TABLE OR CARDS */}
        {viewMode === "table" ? (() => {
          const maxIntervalsInControl = Math.max(3, ...control.actividades.map(a => a.intervalos.length));
          const intervalIndices = Array.from({ length: maxIntervalsInControl }, (_, i) => i);
          const totalCols = 3 + (maxIntervalsInControl * 2);

          return (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mt-4 bg-white dark:bg-slate-900">
              <table className="w-full text-xs text-left min-w-[900px] divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2 font-bold border-r border-slate-200 dark:border-slate-700" rowSpan={2}>Actividad</th>
                    <th className="px-4 py-2 font-bold text-center border-r border-slate-200 dark:border-slate-700" rowSpan={2}>Operario</th>
                    {intervalIndices.map(idx => (
                      <th key={`h-int-${idx}`} className={`px-4 py-1 text-center font-bold border-b border-slate-200 dark:border-slate-700 ${idx > 0 ? 'border-l' : ''}`} colSpan={2}>
                        Intervalo {idx + 1}
                      </th>
                    ))}
                    <th className="px-4 py-2 font-bold text-center border-l border-slate-200 dark:border-slate-700" rowSpan={2}>TOTAL HORAS</th>
                  </tr>
                  <tr>
                    {intervalIndices.map(idx => (
                      <Fragment key={`h-de-hasta-${idx}`}>
                        <th className={`px-2 py-1 text-center font-semibold text-[10px] uppercase ${idx > 0 ? 'border-l border-slate-200 dark:border-slate-700' : ''}`}>DE</th>
                        <th className="px-2 py-1 text-center font-semibold text-[10px] uppercase">HASTA</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(() => {
                    let globalMs = 0;
                    const renderedIds = new Set<string>();
                    const rows = [];

                    // 1. Renderizar actividades del formato
                    FORMATO_ACTIVIDADES.forEach((item, i) => {
                      if (item.tipo === "header") {
                        rows.push(
                          <tr key={`h-${i}`} className="bg-slate-50 dark:bg-slate-800/40">
                            <td className="px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase" colSpan={totalCols}>{item.label}</td>
                          </tr>
                        );
                      } else if (item.tipo === "actividad") {
                        const matchingActs = control.actividades.filter(a => a.actividad_nombre === item.label && !renderedIds.has(a.id));
                        
                        if (matchingActs.length === 0) {
                          rows.push(
                            <tr key={`empty-${i}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-2 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">{item.label}</td>
                              <td className="px-4 py-2 border-r border-slate-100 dark:border-slate-800"></td>
                              {intervalIndices.map(idx => (
                                <Fragment key={`empty-cell-${idx}`}>
                                  <td className={`px-2 py-2 ${idx > 0 ? 'border-l border-slate-100 dark:border-slate-800' : ''}`}></td>
                                  <td className="px-2 py-2"></td>
                                </Fragment>
                              ))}
                              <td className="px-4 py-2 border-l border-slate-100 dark:border-slate-800"></td>
                            </tr>
                          );
                        } else {
                          matchingActs.forEach((matchedAct, mIdx) => {
                            renderedIds.add(matchedAct.id);
                            let rowTotalMs = 0;
                            rows.push(
                              <tr key={`${matchedAct.id}-${i}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-100 dark:border-slate-800">{item.label}</td>
                                <td className="px-4 py-2 text-center text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">{matchedAct.operario_nombre}</td>
                                {intervalIndices.map((idx) => {
                                  const interval = matchedAct.intervalos[idx];
                                  if (!interval || !interval.hora_inicio) return (
                                    <Fragment key={`empty-${idx}`}>
                                      <td className={`px-2 py-2 ${idx > 0 ? 'border-l border-slate-100 dark:border-slate-800' : ''}`}></td>
                                      <td className="px-2 py-2"></td>
                                    </Fragment>
                                  );
                                  
                                  const st = parseISO(interval.hora_inicio);
                                  const ed = interval.hora_fin ? parseISO(interval.hora_fin) : null;
                                  if (ed) {
                                    const diffMs = ed.getTime() - st.getTime();
                                    rowTotalMs += Math.max(0, diffMs);
                                  }
                                  return (
                                    <Fragment key={`int-${idx}`}>
                                      <td className={`px-2 py-2 text-center text-slate-600 dark:text-slate-400 ${idx > 0 ? 'border-l border-slate-100 dark:border-slate-800' : ''}`}>{st.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                      <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                                        {ed ? (
                                          ed.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                        ) : (
                                          <div className="flex flex-col items-center leading-tight">
                                            <span className="text-amber-500 animate-pulse">...</span>
                                            {!isReadonly && (
                                              <Button 
                                                size="sm"
                                                onClick={() => handleTerminarAccion(matchedAct.id, interval.id)}
                                                className="h-6 px-2 text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase mt-1 shadow-sm"
                                              >
                                                Finalizar
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    </Fragment>
                                  );
                                })}
                                <td className="px-4 py-2 text-center font-mono font-medium text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                                  {(() => {
                                    globalMs += rowTotalMs;
                                    if (rowTotalMs === 0) return "";
                                    const h = Math.floor(rowTotalMs / (1000 * 60 * 60));
                                    const m = Math.floor((rowTotalMs % (1000 * 60 * 60)) / (1000 * 60));
                                    return `${h}:${m.toString().padStart(2, '0')}`;
                                  })()}
                                </td>
                              </tr>
                            );
                          });
                        }
                      }
                    });

                    // 2. Renderizar actividades "sueltas" (que no están en el formato)
                    const leftovers = control.actividades.filter(a => !renderedIds.has(a.id));
                    if (leftovers.length > 0) {
                      rows.push(
                        <tr key="extra-h" className="bg-slate-100 dark:bg-slate-700/50">
                          <td className="px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase" colSpan={totalCols}>Otras Actividades</td>
                        </tr>
                      );
                      leftovers.forEach((matchedAct, lIdx) => {
                        let rowTotalMs = 0;
                        rows.push(
                          <tr key={`extra-${matchedAct.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-100 dark:border-slate-800">{matchedAct.actividad_nombre}</td>
                            <td className="px-4 py-2 text-center text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">{matchedAct.operario_nombre}</td>
                            {intervalIndices.map((idx) => {
                              const interval = matchedAct.intervalos[idx];
                              if (!interval || !interval.hora_inicio) return (
                                <Fragment key={`empty-${idx}`}>
                                  <td className={`px-2 py-2 ${idx > 0 ? 'border-l border-slate-100 dark:border-slate-800' : ''}`}></td>
                                  <td className="px-2 py-2"></td>
                                </Fragment>
                              );
                              
                              const st = parseISO(interval.hora_inicio);
                              const ed = interval.hora_fin ? parseISO(interval.hora_fin) : null;
                              if (ed) {
                                const diffMs = ed.getTime() - st.getTime();
                                rowTotalMs += Math.max(0, diffMs);
                              }
                              return (
                                <Fragment key={`int-${idx}`}>
                                  <td className={`px-2 py-2 text-center text-slate-600 dark:text-slate-400 ${idx > 0 ? 'border-l border-slate-100 dark:border-slate-800' : ''}`}>{st.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                  <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                                    {ed ? (
                                      ed.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                    ) : (
                                      <div className="flex flex-col items-center leading-tight">
                                        <span className="text-amber-500 animate-pulse">...</span>
                                        {!isReadonly && (
                                          <Button 
                                            size="sm"
                                            onClick={() => handleTerminarAccion(matchedAct.id, interval.id)}
                                            className="h-6 px-2 text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase mt-1 shadow-sm"
                                          >
                                            Finalizar
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </Fragment>
                              );
                            })}
                            <td className="px-4 py-2 text-center font-mono font-medium text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                              {(() => {
                                globalMs += rowTotalMs;
                                if (rowTotalMs === 0) return "";
                                const h = Math.floor(rowTotalMs / (1000 * 60 * 60));
                                const m = Math.floor((rowTotalMs % (1000 * 60 * 60)) / (1000 * 60));
                                return `${h}:${m.toString().padStart(2, '0')}`;
                              })()}
                            </td>
                          </tr>
                        );
                      });
                    }

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          );
        })() : viewMode === "list" ? (
          <div className="space-y-4 mt-6">
            {control.actividades.filter(a => a.actividad_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || a.operario_nombre.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-500">No hay actividades registradas.</p>
              </div>
            ) : (
              control.actividades
                .filter(a => a.actividad_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || a.operario_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => {
                  const aRunning = a.intervalos.some(i => i.hora_fin === null);
                  const bRunning = b.intervalos.some(i => i.hora_fin === null);
                  if (aRunning && !bRunning) return -1;
                  if (!aRunning && bRunning) return 1;
                  return 0;
                })
                .map((act) => {
                  const runningInterval = act.intervalos.find(i => i.hora_fin === null);
                  return (
                    <div key={act.id} className={`p-4 rounded-lg border flex flex-col md:flex-row justify-between items-center gap-4 transition-all ${runningInterval ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'}`}>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white text-lg uppercase">{act.actividad_nombre}</span>
                          {runningInterval && <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Operario: <span className="font-medium text-slate-700 dark:text-slate-300">{act.operario_nombre}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 px-6 py-2 rounded-md border min-w-[150px]">
                        {runningInterval ? (
                          <div className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <Clock className="h-4 w-4 animate-spin-slow" />
                            <TimerDisplay horaInicio={runningInterval.hora_inicio} />
                          </div>
                        ) : (
                          <div className="text-slate-500 font-mono text-sm">{act.intervalos.length} intervalo(s)</div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {runningInterval ? (
                          <Button variant="destructive" onClick={() => handleTerminarAccion(act.id, runningInterval.id)} className="gap-2">
                            <StopCircle className="h-4 w-4" /> Terminar
                          </Button>
                        ) : (
                          <>
                            {!isReadonly && (
                              <Button variant="outline" onClick={() => handleNuevoIntervalo(act)} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Play className="h-4 w-4" /> Nuevo Cronómetro
                              </Button>
                            )}
                            <Button variant="outline" onClick={() => setResumenActividad(act)} className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50">
                              <Eye className="h-4 w-4" /> Resumen
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {control.actividades.filter(a => a.actividad_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || a.operario_nombre.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-500">No hay actividades registradas que coincidan con la búsqueda.</p>
              </div>
            ) : (
              control.actividades
                .filter(a => a.actividad_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || a.operario_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => {
                  const aRunning = a.intervalos.some(i => i.hora_fin === null);
                  const bRunning = b.intervalos.some(i => i.hora_fin === null);
                  if (aRunning && !bRunning) return -1;
                  if (!aRunning && bRunning) return 1;
                  return 0;
                })
                .map((act) => {
                  const runningInterval = act.intervalos.find(i => i.hora_fin === null);
                  return (
                    <div key={act.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/50">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{act.categoria}</span>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{act.actividad_nombre}</h3>
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            {act.operario_nombre}
                          </p>
                        </div>
                        {runningInterval && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="flex items-center gap-1.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 px-2.5 py-1 rounded-full animate-pulse">
                              <Clock className="h-3.5 w-3.5" /> En Progreso
                            </span>
                            <div className="text-blue-600 dark:text-blue-400">
                              <TimerDisplay horaInicio={runningInterval.hora_inicio} />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 flex-1">
                        <div className="space-y-3 mb-6">
                          {act.intervalos.map((interval, idx) => (
                              <div key={interval.id} className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Int. {idx + 1}</span>
                                <div className="flex items-center gap-2 font-mono">
                                  <span>{parseISO(interval.hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  <span className="text-slate-400">-</span>
                                  <span>{interval.hora_fin ? parseISO(interval.hora_fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}</span>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-wrap gap-2 justify-end">
                        {runningInterval ? (
                          <Button onClick={() => handleTerminarAccion(act.id, runningInterval.id)} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto">
                            <StopCircle className="h-4 w-4" /> Detener
                          </Button>
                        ) : (
                          <>
                            {!isReadonly && (
                              <Button variant="outline" onClick={() => handleNuevoIntervalo(act)} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Play className="h-4 w-4" /> Agregar Cronómetro
                              </Button>
                            )}
                            <Button variant="outline" onClick={() => setResumenActividad(act)} className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50">
                              <Eye className="h-4 w-4" /> Ver Resumen
                            </Button>
                            {!isReadonly && (
                              <Button variant="outline" onClick={() => handleEliminarActividad(act.id)} className="gap-2 text-red-600 border-red-200 hover:bg-red-50" title="Eliminar Acción">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                  </div>
                );
              })
          )}
        </div>
        )}

        {isEnProgreso && control.actividades.length > 0 && (
          <div className="mt-8 pt-6 border-t flex justify-end">
            <Button size="lg" onClick={handleFinalizarRegistro} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Save className="h-5 w-5" /> Finalizar Registro de Horas
            </Button>
          </div>
        )}
      </div>

      {/* SECCION DE FIRMAS Y REVISIÓN (Solo si no está en progreso) */}
      {!isEnProgreso && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6 text-slate-800 dark:text-slate-100 border-b pb-2">Firmas de Validación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creador */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Registrado Por (Finalizado)</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                {control.registrado_por_nombre}
              </p>
              <p className="text-xs text-slate-500 mt-1">Fecha: {new Date(control.fecha).toLocaleDateString()}</p>
            </div>

            {/* Revisor (Jefe Manufactura) */}
            <div className={`p-4 rounded-lg border ${isRevisado ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/20' : 'border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30'}`}>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Validado Por (Jefe Manufactura)</p>
              {control.revisado_por_nombre ? (
                <>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    {control.revisado_por_nombre}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Revisión y validación completada</p>
                </>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-slate-500 mb-3">Pendiente de validación</p>
                  {isReviewMode && (
                    <Button onClick={handleMarcarRevisado} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                      <ShieldCheck className="h-4 w-4" /> Aprobar y Validar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIALOG NUEVA ACTIVIDAD - Paso a Paso + Cola */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) { setIsModalOpen(false); setModalStep(1); setPendingQueue([]); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            {/* Indicador de pasos — solo mostrar 1-3 */}
            {modalStep !== 4 && (
              <div className="flex items-center gap-2 mb-1">
                {["Grupo", "Actividad", "Operario"].map((label, idx) => {
                  const step = (idx + 1) as 1 | 2 | 3;
                  const isActive = modalStep === step;
                  const isDone = (modalStep as number) > step;
                  return (
                    <div key={step} className="flex items-center gap-1.5">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                        isDone ? "bg-emerald-500 text-white" :
                        isActive ? "bg-blue-600 text-white" :
                        "bg-slate-200 dark:bg-slate-700 text-slate-400"
                      }`}>
                        {isDone ? "✓" : step}
                      </div>
                      <span className={`text-xs font-medium ${isActive ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>{label}</span>
                      {idx < 2 && <div className="h-px w-6 bg-slate-200 dark:bg-slate-700" />}
                    </div>
                  );
                })}
                {pendingQueue.length > 0 && (
                  <span className="ml-auto text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    {pendingQueue.length} en cola
                  </span>
                )}
              </div>
            )}
            <DialogTitle className="text-base">
              {modalStep === 1 && "Seleccionar Grupo"}
              {modalStep === 2 && `${selectedGrupo ? selectedGrupo.nombre : ""} — Seleccionar Actividad`}
              {modalStep === 3 && "Asignar Operario"}
              {modalStep === 4 && `Actividades a iniciar (${pendingQueue.length})`}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 min-h-[200px]">
            {/* PASO 1: Grupos */}
            {modalStep === 1 && (
              <div className="space-y-2">
                {modalLoadingGrupos ? (
                  <div className="flex items-center justify-center py-10 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando grupos...
                  </div>
                ) : modalGrupos.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No hay grupos disponibles para el área seleccionada.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {modalGrupos.map((grupo) => (
                      <button
                        key={grupo.id}
                        onClick={() => handleSelectGrupo(grupo)}
                        className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center group"
                      >
                        <span className="text-2xl">
                          {grupo.nombre === "Fabricar" ? "🔬" :
                           grupo.nombre === "Filtrar" ? "🌀" :
                           grupo.nombre === "Envasar" ? "🧴" :
                           grupo.nombre === "Etiquetar" ? "🏷️" :
                           grupo.nombre === "Empacar" ? "📦" :
                           grupo.nombre === "Codificar" ? "🔢" : "⚙️"}
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600">{grupo.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PASO 2: Actividades */}
            {modalStep === 2 && (
              <div className="space-y-3">
                {modalLoadingActs ? (
                  <div className="flex items-center justify-center py-10 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando actividades...
                  </div>
                ) : (
                  <Combobox
                    options={modalActividades.map(a => ({ value: a.nombre, label: a.nombre }))}
                    value={nuevaAct.actividad_nombre}
                    onValueChange={(val) => {
                      setNuevaAct(prev => ({ ...prev, actividad_nombre: val }));
                      if (val) setModalStep(3);
                    }}
                    placeholder="Buscar actividad..."
                    searchPlaceholder="Escriba para filtrar..."
                    emptyMessage="No se encontraron actividades"
                  />
                )}
                {nuevaAct.actividad_nombre && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-2 rounded-md">
                    <span className="font-medium">Seleccionado:</span> {nuevaAct.actividad_nombre}
                  </div>
                )}
              </div>
            )}

            {/* PASO 3: Operario */}
            {modalStep === 3 && (() => {
              // Excluir operarios con cronómetro activo Y los ya en cola
              const operariosEnCola = new Set(pendingQueue.map(q => q.fk_operario));
              const disponibles = empleadosDisponibles.filter(e => !operariosEnCola.has(e.int_id_empleado));
              return (
                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border rounded-lg p-3 text-sm space-y-1">
                    <div className="flex gap-2">
                      <span className="text-slate-500">Grupo:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{selectedGrupo ? selectedGrupo.nombre : ""}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500">Actividad:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{nuevaAct.actividad_nombre}</span>
                    </div>
                  </div>
                  <Label>Asignar a operario</Label>
                  <Combobox
                    options={disponibles.map(e => ({ value: e.int_id_empleado.toString(), label: e.nombre_completo }))}
                    value={nuevaAct.fk_operario ? nuevaAct.fk_operario.toString() : ""}
                    onValueChange={(val) => setNuevaAct(prev => ({ ...prev, fk_operario: parseInt(val) }))}
                    placeholder="Seleccione un operario"
                    searchPlaceholder="Buscar operario..."
                    emptyMessage={disponibles.length === 0 ? "Todos los operarios están ocupados o asignados" : "No se encontraron resultados"}
                  />
                </div>
              );
            })()}

            {/* PASO 4: Cola de actividades */}
            {modalStep === 4 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Las siguientes actividades iniciarán al mismo tiempo:</p>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {pendingQueue.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border rounded-lg px-3 py-2.5 text-sm">
                      <div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">{item.categoria}</span>
                        <p className="font-medium text-slate-800 dark:text-white">{item.actividad_nombre}</p>
                        <p className="text-xs text-slate-500">{item.operario_nombre}</p>
                      </div>
                      <button
                        onClick={() => setPendingQueue(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Eliminar de la cola"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            {/* Atrás: en pasos 2 y 3 */}
            {(modalStep === 2 || modalStep === 3) && (
              <Button variant="outline" onClick={() => setModalStep(s => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}>
                Atrás
              </Button>
            )}
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setModalStep(1); setPendingQueue([]); }}>
              Cancelar
            </Button>
            {/* Paso 3: añadir a cola */}
            {modalStep === 3 && (
              <Button
                onClick={handleAddToQueue}
                disabled={!nuevaAct.actividad_nombre || !nuevaAct.fk_operario}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Añadir a lista
              </Button>
            )}
            {/* Paso 4: agregar otra o iniciar todas */}
            {modalStep === 4 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => { setModalStep(1); setNuevaAct({ categoria: "General", actividad_nombre: "", fk_operario: 0 }); }}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" /> Agregar otra
                </Button>
                <Button
                  onClick={handleIniciarTodas}
                  disabled={isAddingAct || pendingQueue.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {isAddingAct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Iniciar {pendingQueue.length > 1 ? `${pendingQueue.length} actividades` : "actividad"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG RESUMEN ACTIVIDAD */}
      <Dialog open={!!resumenActividad} onOpenChange={(open) => !open && setResumenActividad(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Resumen de Actividad</DialogTitle></DialogHeader>
          {resumenActividad && (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="text-xl font-bold uppercase">{resumenActividad.actividad_nombre}</h3>
                <p className="text-slate-500">Operario: <span className="font-medium text-slate-700">{resumenActividad.operario_nombre}</span></p>
              </div>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Inicio</th>
                      <th className="px-4 py-2 text-left">Fin</th>
                      <th className="px-4 py-2 text-right">Duración</th>
                      {!isReadonly && <th className="px-4 py-2 text-center"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {resumenActividad.intervalos.map((intervalo, index) => {
                      const hasEnded = !!intervalo.hora_fin;
                      const d1 = parseISO(intervalo.hora_inicio);
                      const d2 = hasEnded ? parseISO(intervalo.hora_fin!) : new Date();
                      const diffMs = Math.max(0, d2.getTime() - d1.getTime());
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
                      return (
                        <tr key={intervalo.id}>
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">{d1.toLocaleTimeString()}</td>
                          <td className="px-4 py-2">{hasEnded ? d2.toLocaleTimeString() : 'En progreso'}</td>
                          <td className="px-4 py-2 text-right">{hours}h {mins}m {secs}s</td>
                          {!isReadonly && (
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => handleEliminarIntervalo(resumenActividad.id, intervalo.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">Tiempo Total:</td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {(() => {
                          const totalMs = resumenActividad.intervalos.reduce((acc, curr) => {
                            const end = curr.hora_fin ? new Date(curr.hora_fin).getTime() : new Date().getTime();
                            const start = new Date(curr.hora_inicio).getTime();
                            return acc + Math.max(0, end - start);
                          }, 0);
                          const totalH = Math.floor(totalMs / (1000 * 60 * 60));
                          const totalM = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
                          const totalS = Math.floor((totalMs % (1000 * 60)) / 1000);
                          return `${totalH}h ${totalM}m ${totalS}s`;
                        })()}
                      </td>
                      {!isReadonly && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setResumenActividad(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETENER CRONÓMETRO */}
      <StopTimerModal
        open={!!stopModal}
        actividadNombre={stopModal ? stopModal.actividadNombre : ""}
        onClose={() => setStopModal(null)}
        onConfirm={handleStopConfirm}
      />
    </div>
  );
}
