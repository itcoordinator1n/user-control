"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductAssignmentModal from "./product-assignment-modal";
import { useSession } from "next-auth/react";
import { 
  getTodasLasActividades, 
  createActividadCatalogo, 
  updateActividadCatalogo, 
  deleteActividadCatalogo,
  getTodosLosGrupos
} from "@/lib/services/produccion.service";

export default function ActividadesList() {
  const { data: session } = useSession();
  const [actividades, setActividades] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAct, setEditingAct] = useState<any | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [fkGrupo, setFkGrupo] = useState("");

  // Product Assignment state
  const [selectedActForProducts, setSelectedActForProducts] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [actsRes, gruposRes] = await Promise.all([
        getTodasLasActividades(session?.user?.accessToken),
        getTodosLosGrupos(session?.user?.accessToken)
      ]);
      setActividades(actsRes);
      setGrupos(gruposRes);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.accessToken) {
      loadData();
    }
  }, [session?.user?.accessToken]);

  const filtered = actividades.filter((a) =>
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.grupo_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!nombre.trim() || !fkGrupo) return;
    
    try {
      if (editingAct) {
        await updateActividadCatalogo(editingAct.id, { nombre, fk_grupo: Number(fkGrupo) }, session?.user?.accessToken);
      } else {
        await createActividadCatalogo({ nombre, fk_grupo: Number(fkGrupo) }, session?.user?.accessToken);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error al guardar la actividad");
    }
  };

  const openEdit = (act: any) => {
    setEditingAct(act);
    setNombre(act.nombre);
    setFkGrupo(act.fk_grupo.toString());
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingAct(null);
    setNombre("");
    setFkGrupo("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta actividad?")) {
      try {
        await deleteActividadCatalogo(id, session?.user?.accessToken);
        await loadData();
      } catch (error) {
        console.error(error);
        alert("Error al eliminar la actividad");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Actividad
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead>Nombre de la Actividad</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead className="text-center">Productos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No se encontraron actividades.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((act) => (
                <TableRow key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-semibold text-slate-900 dark:text-white">{act.nombre}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {act.grupo_nombre}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedActForProducts(act)}
                      className="h-8 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                    >
                      <Link2 className="h-3 w-3 mr-1.5" />
                      {act.total_productos !== undefined ? act.total_productos : act.products_count || 0} asignados
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(act)} className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(act.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAct ? "Editar Actividad" : "Nueva Actividad"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la Actividad</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Limpiar Tanques"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Grupo al que pertenece</Label>
              <Select value={fkGrupo} onValueChange={setFkGrupo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Asignación a Productos */}
      <ProductAssignmentModal
        isOpen={selectedActForProducts !== null}
        onClose={() => setSelectedActForProducts(null)}
        actividad={selectedActForProducts}
      />
    </div>
  );
}
