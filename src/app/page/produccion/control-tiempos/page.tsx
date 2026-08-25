"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TableroOcupacion from "./components/TableroOcupacion";
import Historial from "./components/Historial";
import Revisiones from "./components/Revisiones";
import ActividadesCatalogoTab from "./components/actividades-catalogo-tab";
import { useProduccionPermissions } from "../_hooks/use-produccion-permissions";

export default function ControlTiemposPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canBoard, canValidate, canCatalog } = useProduccionPermissions();
  const canReview = canValidate;

  // Historial es la línea base: siempre visible para quien llega al módulo
  const tabsVisibles = useMemo(
    () => ({ tablero: canBoard, historial: true, revisiones: canReview, actividades: canCatalog }),
    [canBoard, canReview, canCatalog]
  );
  const numTabs = Object.values(tabsVisibles).filter(Boolean).length;
  
  // Obtener pestaña activa desde URL o por defecto
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "historial");

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Cualquier ?tab= no autorizado cae al historial
  useEffect(() => {
    if (activeTab in tabsVisibles && !tabsVisibles[activeTab as keyof typeof tabsVisibles]) {
      setActiveTab("historial");
    }
  }, [tabsVisibles, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Actualizar URL sin recargar para mantener el estado al volver
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Control de Tiempos
        </h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">Gestión integral de ocupación, tiempos y auditorías de producción.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className="mb-6 flex w-full h-auto p-1 bg-slate-100 dark:bg-slate-800 overflow-x-auto overflow-y-hidden lg:grid max-w-4xl no-scrollbar whitespace-nowrap justify-start lg:justify-center"
          style={{ gridTemplateColumns: `repeat(${numTabs}, minmax(0, 1fr))` }}
        >
          {tabsVisibles.tablero && (
            <TabsTrigger value="tablero" className="px-4 py-2 text-sm lg:text-base">
              Tablero de Ocupación
            </TabsTrigger>
          )}
          <TabsTrigger value="historial" className="px-4 py-2 text-sm lg:text-base">
            Historial de Registros
          </TabsTrigger>
          {canReview && (
            <TabsTrigger value="revisiones" className="px-4 py-2 text-sm lg:text-base">
              Revisiones Pendientes
            </TabsTrigger>
          )}
          {tabsVisibles.actividades && (
            <TabsTrigger value="actividades" className="px-4 py-2 text-sm lg:text-base">
              Gestión de Actividades
            </TabsTrigger>
          )}
        </TabsList>
        
        {tabsVisibles.tablero && (
          <TabsContent value="tablero" className="mt-0 outline-none">
            <TableroOcupacion />
          </TabsContent>
        )}
        
        <TabsContent value="historial" className="mt-0 outline-none">
          <Historial />
        </TabsContent>
        
        {canReview && (
          <TabsContent value="revisiones" className="mt-0 outline-none">
            <Revisiones />
          </TabsContent>
        )}

        {tabsVisibles.actividades && (
          <TabsContent value="actividades" className="mt-0 outline-none">
            <ActividadesCatalogoTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
