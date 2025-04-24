"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Filter, RefreshCw } from "lucide-react"
import AdvancedFilters from "@/components/advanced-filters"
import ReportingTable from "@/components/reporting-table"
import GraphicsAnalysis from "@/components/graphics-analysis"
import KeyIndicators from "@/components/key-indicators"
import ExportModal from "@/components/export-modal"

export default function DashboardReports() {
  const [filtrosVisibles, setFiltrosVisibles] = useState(false)
  const [modalExportacionAbierto, setModalExportacionAbierto] = useState(false)
  const [filtrosActivos, setFiltrosActivos] = useState({
    empleado: "",
    area: "",
    fechaInicio: "",
    fechaFin: "",
    tipoSolicitud: "",
  })

  const toggleFiltros = () => {
    setFiltrosVisibles(!filtrosVisibles)
  }

interface Filtros {
    empleado: string;
    area: string;
    fechaInicio: string;
    fechaFin: string;
    tipoSolicitud: string;
}

const aplicarFiltros = (filtros: Filtros) => {
    setFiltrosActivos(filtros)
    // Aquí se aplicarían los filtros a los datos
}

  const abrirModalExportacion = () => {
    setModalExportacionAbierto(true)
  }

  const cerrarModalExportacion = () => {
    setModalExportacionAbierto(false)
  }

interface ExportOptions {
    tipoExportacion: string;
    incluirGraficos: boolean;
    incluirTodosUsuarios: boolean;
    fechaInicio: string;
    fechaFin: string;
}

const exportarDatos = (opciones: ExportOptions) => {
    // Aquí iría la lógica para exportar a Excel
    cerrarModalExportacion()
}

  return (
    <div className="container mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes de Personal</h1>
          <p className="text-muted-foreground">Análisis detallado y gestión de datos del personal</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleFiltros} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="default" size="sm" onClick={abrirModalExportacion} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>
      </header>

      {filtrosVisibles && (
        <AdvancedFilters
          filtrosActuales={filtrosActivos}
          aplicarFiltros={aplicarFiltros}
          cerrarFiltros={() => setFiltrosVisibles(false)}
        />
      )}

      <KeyIndicators />

      <Tabs defaultValue="graficos" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="graficos">Gráficos y Análisis</TabsTrigger>
          <TabsTrigger value="marcajes">Marcajes</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
        </TabsList>
        <TabsContent value="graficos" className="space-y-6 mt-6">
          <GraphicsAnalysis />
        </TabsContent>
        <TabsContent value="marcajes" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Marcajes</CardTitle>
              <CardDescription>Registro detallado de entradas y salidas del personal</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportingTable tipo="marcajes" filtros={filtrosActivos} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="solicitudes" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Permisos y Vacaciones</CardTitle>
              <CardDescription>Historial de solicitudes realizadas por el personal</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportingTable tipo="solicitudes" filtros={filtrosActivos} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {modalExportacionAbierto && (
        <ExportModal cerrarModal={cerrarModalExportacion} exportarDatos={exportarDatos} />
      )}
    </div>
  )
}

