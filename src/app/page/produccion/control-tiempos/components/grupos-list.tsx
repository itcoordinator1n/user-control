"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { getTodosLosGrupos, createGrupo, updateGrupo, deleteGrupo } from "@/lib/services/produccion.service";

export default function GruposList() {
  const { data: session } = useSession();
  const [grupos, setGrupos] = useState<{ id: number; nombre: string; count?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<{ id: number; nombre: string } | null>(null);
  const [nombre, setNombre] = useState("");

  const loadGrupos = async () => {
    try {
      setIsLoading(true);
      const data = await getTodosLosGrupos(session?.user?.accessToken);
      setGrupos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.accessToken) {
      loadGrupos();
    }
  }, [session?.user?.accessToken]);

  const filteredGrupos = grupos.filter((g) =>
    g.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!nombre.trim()) return;
    
    try {
      if (editingGrupo) {
        await updateGrupo(editingGrupo.id, nombre, session?.user?.accessToken);
      } else {
        await createGrupo(nombre, session?.user?.accessToken);
      }
      await loadGrupos();
      setIsModalOpen(false);
      setEditingGrupo(null);
      setNombre("");
    } catch (error) {
      console.error(error);
      alert("Error al guardar el grupo");
    }
  };

  const openEdit = (grupo: { id: number; nombre: string }) => {
    setEditingGrupo(grupo);
    setNombre(grupo.nombre);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingGrupo(null);
    setNombre("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este grupo? Se perderán las actividades asociadas.")) {
      try {
        await deleteGrupo(id, session?.user?.accessToken);
        await loadGrupos();
      } catch (error) {
        console.error(error);
        alert("Error al eliminar el grupo");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Grupo
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nombre del Grupo</TableHead>
              <TableHead className="text-center">Actividades</TableHead>
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
            ) : filteredGrupos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No se encontraron grupos.
                </TableCell>
              </TableRow>
            ) : (
              filteredGrupos.map((grupo) => (
                <TableRow key={grupo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="font-medium text-slate-500">#{grupo.id}</TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-white">{grupo.nombre}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {grupo.count !== undefined ? grupo.count : 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(grupo)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(grupo.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
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
            <DialogTitle>{editingGrupo ? "Editar Grupo" : "Nuevo Grupo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Grupo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Fabricar, Envasar..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
