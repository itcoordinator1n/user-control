"use client";

import { useState, useEffect } from "react";
import { Search, Package, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { useSession } from "next-auth/react";
import { getProductos, getProductosDeActividad, updateProductosDeActividad } from "@/lib/services/produccion.service";

interface ProductAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  actividad: { id: number; nombre: string; grupo_nombre: string } | null;
}

export default function ProductAssignmentModal({ isOpen, onClose, actividad }: ProductAssignmentModalProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && actividad) {
      setSearchTerm("");
      loadData();
    }
  }, [isOpen, actividad]);

  const loadData = async () => {
    if (!actividad) return;
    try {
      setIsLoading(true);
      const [allProds, assignedIds] = await Promise.all([
        getProductos(session?.user?.accessToken),
        getProductosDeActividad(actividad.id, session?.user?.accessToken)
      ]);
      setProductos(allProds.map(p => ({ id: p.int_id_producto, nombre: p.txt_nombre, area: p.area_default || "General" })));
      setSelectedIds(new Set(assignedIds));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!actividad) return null;

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.area && p.area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    if (!actividad) return;
    setIsSaving(true);
    try {
      await updateProductosDeActividad(actividad.id, Array.from(selectedIds), session?.user?.accessToken);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar asignaciones");
    } finally {
      setIsSaving(false);
    }
  };

  const selectAllFiltered = () => {
    const newSet = new Set(selectedIds);
    filteredProducts.forEach(p => newSet.add(p.id));
    setSelectedIds(newSet);
  };

  const clearAllFiltered = () => {
    const newSet = new Set(selectedIds);
    filteredProducts.forEach(p => newSet.delete(p.id));
    setSelectedIds(newSet);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Asignación de Productos</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                ¿En qué productos aparecerá la actividad <strong className="text-slate-900 dark:text-white">{actividad.nombre}</strong>?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-900"
              />
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">
                {selectedIds.size} seleccionados de {productos.length}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllFiltered} className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                  Seleccionar visibles
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAllFiltered} className="h-7 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800">
                  Limpiar
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
                Cargando productos...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No se encontraron productos que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProducts.map(prod => {
                  const isSelected = selectedIds.has(prod.id);
                  return (
                    <div 
                      key={prod.id}
                      onClick={() => toggleSelection(prod.id)}
                      className={`
                        flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border
                        ${isSelected 
                          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50' 
                          : 'bg-white border-transparent hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          flex items-center justify-center h-5 w-5 rounded border flex-shrink-0 transition-colors
                          ${isSelected 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }
                        `}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {prod.nombre}
                          </p>
                          <Badge variant="outline" className={`mt-1 text-[10px] font-normal ${isSelected ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' : 'text-slate-500 dark:border-slate-700'}`}>
                            {prod.area}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
