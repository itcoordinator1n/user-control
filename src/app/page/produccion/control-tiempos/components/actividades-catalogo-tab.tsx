"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderTree, ActivitySquare, Package } from "lucide-react";
import GruposList from "./grupos-list";
import ActividadesList from "./actividades-list";
import ProductosList from "./productos-list";

export default function ActividadesCatalogoTab() {
  const [activeTab, setActiveTab] = useState("actividades");

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Catálogo de Producción
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestiona los productos y su área, y los grupos y actividades de producción.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full max-w-xl grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <TabsTrigger value="productos" className="flex items-center gap-2 rounded-md">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="actividades" className="flex items-center gap-2 rounded-md">
            <ActivitySquare className="h-4 w-4" />
            Actividades
          </TabsTrigger>
          <TabsTrigger value="grupos" className="flex items-center gap-2 rounded-md">
            <FolderTree className="h-4 w-4" />
            Grupos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="productos" className="mt-0 outline-none">
          <ProductosList />
        </TabsContent>

        <TabsContent value="actividades" className="mt-0 outline-none">
          <ActividadesList />
        </TabsContent>
        
        <TabsContent value="grupos" className="mt-0 outline-none">
          <GruposList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
