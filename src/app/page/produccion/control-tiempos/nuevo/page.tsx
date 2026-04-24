"use client";

import { useState, useEffect, Fragment } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PlusCircle, StopCircle, Play, Save, Clock, ArrowLeft, Loader2, Trash2, LayoutGrid, Table, List, Eye, Search } from "lucide-react";
import { FORMATO_ACTIVIDADES } from "@/lib/exportExcel";

// Ayudante para normalizar fechas del servidor (usualmente UTC) de forma robusta
const parseISO = (s: string) => {
  if (!s) return new Date();
  // Crear fecha y restar 6 horas manualmente para ajustar al horario local
  const d = new Date(s.replace(" ", "T"));
  d.setHours(d.getHours() - 6);
  return d;
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createControlTiempos,
  getEmpleadosProduccion,
  getProductos,
  addActividad,
  iniciarIntervalo,
  terminarIntervalo,
  updateControlTiempos,
  deleteActividad,
  deleteIntervalo,
  ProduccionControl,
  ProduccionActividad,
  ProduccionEmpleado,
  ProductoBasico
} from "@/lib/services/produccion.service";

const ACTIVIDADES = [
  "Acomodar Etiqueta",
  "Armar caja",
  "Codificar",
  "Codificar frasco",
  "Colocar frascos",
  "Empacar",
  "Envasar",
  "Envasar/Taponar",
  "Etiquetar",
  "Fabricar",
  "Filtrar",
  "Lavar Frascos",
  "Limpiar Area",
  "Limpiar Filtros",
  "Limpiar Maquinas",
  "Limpiar Tanques",
  "Limpiar Utensilios",
  "Limpiar frasco",
  "Revisar y Apartar",
  "Sellar Corrugado y Estibar",
  "Tapar"
];



// Componente Timer
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

export default function NuevoControlTiempos() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // State: Maestros
  const [empleados, setEmpleados] = useState<ProduccionEmpleado[]>([]);
  const [productos, setProductos] = useState<ProductoBasico[]>([]);
  
  // State: Control (Cabecera)
  const [control, setControl] = useState<ProduccionControl | null>(null);
  const [formCabecera, setFormCabecera] = useState({
    proceso: "Operaciones",
    area: "",
    n_lote: "",
    op: "",
    fk_producto: 0
  });
  const [isCreating, setIsCreating] = useState(false);

  // State: Modal Nueva Actividad
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaAct, setNuevaAct] = useState({
    categoria: "General", // Keeping field for backend compatibility if needed
    actividad_nombre: "",
    fk_operario: 0
  });
  const [isAddingAct, setIsAddingAct] = useState(false);

  // State: Modal Resumen
  const [resumenActividad, setResumenActividad] = useState<ProduccionActividad | null>(null);

  // State: Búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("list"); // Default to list for current view type

  // Load masters
  useEffect(() => {
    const load = async () => {
      const [emp, prod] = await Promise.all([
        getEmpleadosProduccion(session?.user?.accessToken),
        getProductos(session?.user?.accessToken)
      ]);
      setEmpleados(emp);
      setProductos(prod);
    };
    if (session?.user?.accessToken) {
      load();
    }
  }, [session?.user?.accessToken]);

  const handleCrearCabecera = async () => {
    if (!formCabecera.n_lote || !formCabecera.op || !formCabecera.fk_producto || !formCabecera.area) {
      alert("Por favor complete todos los campos de la cabecera.");
      return;
    }
    
    setIsCreating(true);
    try {
      const newControl = await createControlTiempos({
        ...formCabecera,
        registrado_por: session?.user?.id ? parseInt(session.user.id) : 1
      }, session?.user?.accessToken);
      setControl(newControl);
    } catch (e) {
      console.error(e);
      alert("Error al crear cabecera: " + (e instanceof Error ? e.message : "Error desconocido"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleAgregarActividad = async () => {
    if (!nuevaAct.actividad_nombre || !nuevaAct.fk_operario) {
      alert("Seleccione una actividad y un operario.");
      return;
    }

    // Validación: Verificar si el operario ya tiene un cronómetro corriendo en OTRA actividad
    if (control) {
      const isRunningElsewhere = control.actividades.some(a => 
        a.fk_operario === nuevaAct.fk_operario && 
        a.intervalos.some(i => i.hora_fin === null)
      );

      if (isRunningElsewhere) {
        alert("Este operario ya tiene un cronómetro activo en otra actividad. Deténgalo primero.");
        return;
      }
    }

    setIsAddingAct(true);
    try {
      // 1. Agregar actividad
      const operario = empleados.find(e => e.int_id_empleado === nuevaAct.fk_operario);
      const act = await addActividad({
        fk_control: control!.id,
        ...nuevaAct,
        operario_nombre: operario?.nombre_completo || "Operario Desconocido"
      }, session?.user?.accessToken);
      
      // 2. Iniciar el primer intervalo automáticamente
      const intervalo = await iniciarIntervalo(act.id, session?.user?.accessToken);
      act.intervalos = [intervalo];

      // 3. Actualizar estado local
      setControl(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          actividades: [...prev.actividades, act]
        };
      });
      
      setIsModalOpen(false);
      setNuevaAct({ categoria: "General", actividad_nombre: "", fk_operario: 0 });
    } catch (e) {
      console.error(e);
      alert("Error al iniciar actividad");
    } finally {
      setIsAddingAct(false);
    }
  };

  const handleTerminarAccion = async (actividadId: string, intervaloId: string) => {
    try {
      const intervaloFin = await terminarIntervalo(intervaloId, session?.user?.accessToken);
      
      setControl(prev => {
        if (!prev) return prev;
        const newActividades = prev.actividades.map(a => {
          if (a.id === actividadId) {
            return {
              ...a,
              intervalos: a.intervalos.map(i => i.id === intervaloId ? { ...i, hora_fin: intervaloFin.hora_fin } : i)
            };
          }
          return a;
        });
        return { ...prev, actividades: newActividades };
      });
    } catch (e) {
      console.error(e);
      alert("Error al detener el cronómetro");
    }
  };

  const handleNuevoIntervalo = async (actividad: ProduccionActividad) => {
    // Validar operario globalmente
    const isRunningElsewhere = control?.actividades.some(a => 
      a.fk_operario === actividad.fk_operario && 
      a.intervalos.some(i => i.hora_fin === null)
    );

    if (isRunningElsewhere) {
      alert("Este operario ya tiene un cronómetro activo. Deténgalo primero.");
      return;
    }

    try {
      const nuevoIntervalo = await iniciarIntervalo(actividad.id, session?.user?.accessToken);
      
      setControl(prev => {
        if (!prev) return prev;
        const newActividades = prev.actividades.map(a => {
          if (a.id === actividad.id) {
            return {
              ...a,
              intervalos: [...a.intervalos, nuevoIntervalo]
            };
          }
          return a;
        });
        return { ...prev, actividades: newActividades };
      });
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
        setControl(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            actividades: prev.actividades.filter(a => a.id !== actividadId)
          };
        });
        if (resumenActividad?.id === actividadId) {
          setResumenActividad(null);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error al eliminar la actividad");
    }
  };

  const handleEliminarIntervalo = async (actividadId: string, intervaloId: string) => {
    if (!confirm("¿Está seguro de eliminar este intervalo de tiempo?")) return;
    
    try {
      const ok = await deleteIntervalo(intervaloId, session?.user?.accessToken);
      if (ok) {
        setControl(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            actividades: prev.actividades.map(a => {
              if (a.id === actividadId) {
                return { ...a, intervalos: a.intervalos.filter(i => i.id !== intervaloId) };
              }
              return a;
            })
          };
        });
        
        // Update summary dialog if open
        setResumenActividad(prev => {
          if (prev && prev.id === actividadId) {
            return { ...prev, intervalos: prev.intervalos.filter(i => i.id !== intervaloId) };
          }
          return prev;
        });
      }
    } catch (e) {
      console.error(e);
      alert("Error al eliminar el intervalo");
    }
  };

  const handleFinalizarRegistro = async () => {
    // Verificar si hay relojes corriendo
    const hasRunning = control?.actividades.some(a => a.intervalos.some(i => i.hora_fin === null));
    if (hasRunning) {
      alert("Aún hay cronómetros en ejecución. Deténgalos todos antes de finalizar el registro.");
      return;
    }

    const obs = prompt("Observaciones opcionales para este registro:");
    
    try {
      await updateControlTiempos(control!.id, obs || "", "FINALIZADO", session?.user?.accessToken);
      router.push("/page/produccion/control-tiempos");
    } catch (e) {
      console.error(e);
      alert("Error al finalizar");
    }
  };

  const operariosOcupadosIds = control?.actividades
    .filter(a => a.intervalos.some(i => i.hora_fin === null))
    .map(a => a.fk_operario) || [];

  const empleadosDisponibles = empleados.filter(e => !operariosOcupadosIds.includes(e.int_id_empleado));

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push("/page/produccion/control-tiempos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {control ? "Registro en Progreso" : "Nuevo Control de Tiempos"}
          </h1>
        </div>
      </div>

      {/* CABECERA */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100 border-b pb-2">Datos del Proceso</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="space-y-2">
            <Label>Proceso</Label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-md bg-slate-50 dark:bg-slate-800" 
              value={formCabecera.proceso}
              onChange={e => setFormCabecera({...formCabecera, proceso: e.target.value})}
              disabled={!!control}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Producto</Label>
            {control ? (
              <input type="text" className="w-full px-3 py-2 border rounded-md bg-slate-100" disabled value={control.producto_nombre} />
            ) : (
              <Select onValueChange={(val) => {
                const prod = productos.find(p => p.int_id_producto === parseInt(val));
                setFormCabecera({
                  ...formCabecera, 
                  fk_producto: parseInt(val),
                  area: prod?.area_default || ""
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {productos.map(p => (
                    <SelectItem key={p.int_id_producto} value={p.int_id_producto.toString()}>
                      {p.txt_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Área</Label>
            {control ? (
              <input type="text" className="w-full px-3 py-2 border rounded-md bg-slate-100" disabled value={control.area} />
            ) : (
              <Select value={formCabecera.area} onValueChange={(val) => setFormCabecera({...formCabecera, area: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar área..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Líquidos">Líquidos</SelectItem>
                  <SelectItem value="Sólidos">Sólidos</SelectItem>
                  <SelectItem value="Semisólidos">Semisólidos</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nº de Lote</Label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-md" 
              value={formCabecera.n_lote}
              onChange={e => setFormCabecera({...formCabecera, n_lote: e.target.value})}
              disabled={!!control}
            />
          </div>

          <div className="space-y-2">
            <Label>O/P</Label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-md" 
              value={formCabecera.op}
              onChange={e => setFormCabecera({...formCabecera, op: e.target.value})}
              disabled={!!control}
            />
          </div>
        </div>

        {!control && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleCrearCabecera} 
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Iniciar Control
            </Button>
          </div>
        )}
      </div>

      {/* ACTIVIDADES */}
      {control && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Actividades en Curso</h2>
              {/* VISTA SELECTOR */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mt-2 w-fit">
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
            </div>
            <div className="flex w-full md:w-auto items-center gap-3">
              <input 
                type="text"
                placeholder="Buscar operario o actividad..."
                className="px-3 py-2 border rounded-md text-sm min-w-[250px] bg-slate-50 dark:bg-slate-800"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                <PlusCircle className="h-4 w-4" />
                Nueva Actividad
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {control.actividades.length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed">
                <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>No hay actividades registradas.</p>
                <p className="text-sm">Haga clic en "Nueva Actividad" para comenzar a medir el tiempo.</p>
              </div>
            ) : viewMode === "table" ? (() => {
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
                        const rows: JSX.Element[] = [];

                        // 1. Renderizar actividades del formato
                        FORMATO_ACTIVIDADES.forEach((item, i) => {
                          if (item.tipo === "header") {
                            rows.push(
                              <tr key={`h-${i}`} className="bg-slate-50 dark:bg-slate-800/40">
                                <td className="px-4 py-2 font-bold text-slate-800 dark:text-slate-200 uppercase" colSpan={totalCols}>{item.label}</td>
                              </tr>
                            );
                          } else if (item.tipo === "actividad") {
                            const matchingActs = (control?.actividades || []).filter(a => a.actividad_nombre === item.label);
                            
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
                                                <Button 
                                                  size="sm"
                                                  onClick={() => handleTerminarAccion(matchedAct.id, interval.id)}
                                                  className="h-6 px-2 text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase mt-1 shadow-sm"
                                                >
                                                  Finalizar
                                                </Button>
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
                        const leftovers = (control?.actividades || []).filter(a => !renderedIds.has(a.id));
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
                                            <Button 
                                              size="sm"
                                              onClick={() => handleTerminarAccion(matchedAct.id, interval.id)}
                                              className="h-6 px-2 text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase mt-1 shadow-sm"
                                            >
                                              Finalizar
                                            </Button>
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
            })() : viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {control.actividades
                  .filter(act => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return act.actividad_nombre.toLowerCase().includes(term) || 
                           act.operario_nombre.toLowerCase().includes(term);
                  })
                  .sort((a, b) => {
                    const aRunning = a.intervalos.some(i => i.hora_fin === null);
                    const bRunning = b.intervalos.some(i => i.hora_fin === null);
                    if (aRunning && !bRunning) return -1;
                    if (!aRunning && bRunning) return 1;
                    return 0;
                  })
                  .map((act) => {
                    const activeInterval = act.intervalos.find(i => i.hora_fin === null);
                    const isRunning = !!activeInterval;

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
                          {isRunning && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="flex items-center gap-1.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 px-2.5 py-1 rounded-full animate-pulse">
                                <Clock className="h-3.5 w-3.5" /> En Progreso
                              </span>
                              <div className="text-blue-600 dark:text-blue-400">
                                <TimerDisplay horaInicio={activeInterval.hora_inicio} />
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
                          {isRunning ? (
                            <Button onClick={() => handleTerminarAccion(act.id, activeInterval.id)} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto">
                              <StopCircle className="h-4 w-4" /> Detener
                            </Button>
                          ) : (
                            <>
                              <Button variant="outline" onClick={() => handleNuevoIntervalo(act)} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Play className="h-4 w-4" /> Agregar Cronómetro
                              </Button>
                              <Button variant="outline" onClick={() => setResumenActividad(act)} className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50">
                                <Eye className="h-4 w-4" /> Ver Resumen
                              </Button>
                              <Button variant="outline" onClick={() => handleEliminarActividad(act.id)} className="gap-2 text-red-600 border-red-200 hover:bg-red-50" title="Eliminar Acción">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="space-y-4">
                {control.actividades
                  .filter(act => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return act.actividad_nombre.toLowerCase().includes(term) || 
                           act.operario_nombre.toLowerCase().includes(term);
                  })
                  .sort((a, b) => {
                    const aRunning = a.intervalos.some(i => i.hora_fin === null);
                    const bRunning = b.intervalos.some(i => i.hora_fin === null);
                    if (aRunning && !bRunning) return -1;
                    if (!aRunning && bRunning) return 1;
                    return 0;
                  })
                  .map((act) => {
                    const activeInterval = act.intervalos.find(i => i.hora_fin === null);
                    const isRunning = !!activeInterval;

                    return (
                      <div key={act.id} className={`p-4 rounded-lg border flex flex-col md:flex-row justify-between items-center gap-4 transition-all ${isRunning ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'}`}>
                        
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white text-lg uppercase">{act.actividad_nombre}</span>
                            {isRunning && (
                              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Operario: <span className="font-medium text-slate-700 dark:text-slate-300">{act.operario_nombre}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-900 px-6 py-2 rounded-md border min-w-[150px]">
                          {isRunning ? (
                            <div className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <Clock className="h-4 w-4 animate-spin-slow" />
                              <TimerDisplay horaInicio={activeInterval.hora_inicio} />
                            </div>
                          ) : (
                            <div className="text-slate-500 font-mono text-sm">
                              {act.intervalos.length} intervalo(s) completado(s)
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {isRunning ? (
                            <Button 
                              variant="destructive" 
                              onClick={() => handleTerminarAccion(act.id, activeInterval.id)}
                              className="gap-2"
                            >
                              <StopCircle className="h-4 w-4" />
                              Terminar Acción
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="outline"
                                onClick={() => handleNuevoIntervalo(act)}
                                className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                              >
                                <Play className="h-4 w-4" />
                                Agregar Cronómetro
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => setResumenActividad(act)}
                                className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/30"
                              >
                                <Eye className="h-4 w-4" />
                                Ver Resumen
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleEliminarActividad(act.id)}
                                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30"
                                title="Eliminar Acción"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>

          {control.actividades.length > 0 && (
            <div className="mt-8 pt-6 border-t flex justify-end">
              <Button 
                size="lg" 
                onClick={handleFinalizarRegistro}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Save className="h-5 w-5" />
                Finalizar Registro de Horas
              </Button>
            </div>
          )}
        </div>
      )}

      {/* DIALOG NUEVA ACTIVIDAD */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Actividad</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid gap-2">
              <Label>Actividad a realizar</Label>
              <Combobox 
                options={ACTIVIDADES.map(act => ({ value: act, label: act }))}
                value={nuevaAct.actividad_nombre}
                onValueChange={(val) => setNuevaAct(prev => ({...prev, actividad_nombre: val}))}
                placeholder="Seleccione una actividad"
                searchPlaceholder="Buscar actividad..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Operario</Label>
              <Combobox 
                options={empleadosDisponibles.map(e => ({ value: e.int_id_empleado.toString(), label: e.nombre_completo }))}
                value={nuevaAct.fk_operario ? nuevaAct.fk_operario.toString() : ""}
                onValueChange={(val) => setNuevaAct(prev => ({...prev, fk_operario: parseInt(val)}))}
                placeholder="Seleccione un empleado"
                searchPlaceholder="Buscar operario..."
                emptyMessage={empleadosDisponibles.length === 0 ? "Todos los operarios están ocupados" : "No se encontraron resultados"}
              />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleAgregarActividad} 
              disabled={isAddingAct || !nuevaAct.actividad_nombre || !nuevaAct.fk_operario}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isAddingAct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Comenzar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG RESUMEN ACTIVIDAD */}
      <Dialog open={!!resumenActividad} onOpenChange={(open) => !open && setResumenActividad(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resumen de Actividad</DialogTitle>
          </DialogHeader>
          
          {resumenActividad && (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="text-xl font-bold uppercase text-slate-800 dark:text-white">{resumenActividad.actividad_nombre}</h3>
                <p className="text-slate-500">Operario: <span className="font-medium text-slate-700 dark:text-slate-300">{resumenActividad.operario_nombre}</span></p>
              </div>

              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">#</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Inicio</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Fin</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Duración</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-600 dark:text-slate-300"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {resumenActividad.intervalos.map((intervalo, index) => {
                      const hasEnded = !!intervalo.hora_fin;
                      const d1 = parseISO(intervalo.hora_inicio);
                      const d2 = hasEnded ? parseISO(intervalo.hora_fin!) : new Date();
                      const diffMs = Math.max(0, d2.getTime() - d1.getTime());
                      const hours = Math.floor(diffMs / 3600000);
                      const mins = Math.floor((diffMs % 3600000) / 60000);
                      const secs = Math.floor((diffMs % 60000) / 1000);

                      return (
                        <tr key={intervalo.id}>
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">{d1.toLocaleTimeString()}</td>
                          <td className="px-4 py-2">{hasEnded ? d2.toLocaleTimeString() : 'En progreso'}</td>
                          <td className="px-4 py-2 text-right">{hours}h {mins}m {secs}s</td>
                          <td className="px-4 py-2 text-center">
                            <button 
                              onClick={() => handleEliminarIntervalo(resumenActividad.id, intervalo.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Eliminar Intervalo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">Tiempo Total:</td>
                      <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
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
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResumenActividad(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
