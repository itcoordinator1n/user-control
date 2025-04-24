"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface FiltrosProps {
  filtrosActuales: {
    empleado: string
    area: string
    fechaInicio: string
    fechaFin: string
    tipoSolicitud: string
  }
  aplicarFiltros: (filtros: any) => void
  cerrarFiltros: () => void
}

interface FiltrosState {
  empleado: string
  area: string
  fechaInicio: string
  fechaFin: string
  tipoSolicitud: string
}

export default function AdvancedFilters({ filtrosActuales, aplicarFiltros, cerrarFiltros }: FiltrosProps) {
  const [filtros, setFiltros] = useState<FiltrosState>({
    empleado: filtrosActuales.empleado || "",
    area: filtrosActuales.area || "",
    fechaInicio: filtrosActuales.fechaInicio || "",
    fechaFin: filtrosActuales.fechaFin || "",
    tipoSolicitud: filtrosActuales.tipoSolicitud || "",
  })

  const [fechaInicioSeleccionada, setFechaInicioSeleccionada] = useState<Date | null>(null)
  const [fechaFinSeleccionada, setFechaFinSeleccionada] = useState<Date | null>(null)

  useEffect(() => {
    if (filtrosActuales.fechaInicio) {
      setFechaInicioSeleccionada(new Date(filtrosActuales.fechaInicio))
    }
    if (filtrosActuales.fechaFin) {
      setFechaFinSeleccionada(new Date(filtrosActuales.fechaFin))
    }
  }, [filtrosActuales])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFiltros((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFiltros((prev) => ({ ...prev, [name]: value }))
  }

  const handleFechaInicioChange = (date: Date | undefined) => {
    setFechaInicioSeleccionada(date || null)
    setFiltros((prev) => ({ ...prev, fechaInicio: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const handleFechaFinChange = (date: Date | undefined) => {
      setFechaFinSeleccionada(date || null)
      setFiltros((prev) => ({ ...prev, fechaFin: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      empleado: "",
      area: "",
      fechaInicio: "",
      fechaFin: "",
      tipoSolicitud: "",
    })
    setFechaInicioSeleccionada(null)
    setFechaFinSeleccionada(null)
  }

  const aplicarFiltrosHandler = () => {
    aplicarFiltros(filtros)
    cerrarFiltros()
  }

  return (
    <Card className="w-full animate-in slide-in-from-top duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Filtros Avanzados</CardTitle>
        <Button variant="ghost" size="icon" onClick={cerrarFiltros}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="empleado">Empleado</Label>
          <Input
            id="empleado"
            name="empleado"
            placeholder="Nombre o ID del empleado"
            value={filtros.empleado}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="area">Área</Label>
          <Select value={filtros.area} onValueChange={(value) => handleSelectChange("area", value)}>
            <SelectTrigger id="area">
              <SelectValue placeholder="Seleccionar área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las áreas</SelectItem>
              <SelectItem value="administracion">Administración</SelectItem>
              <SelectItem value="rrhh">Recursos Humanos</SelectItem>
              <SelectItem value="ventas">Ventas</SelectItem>
              <SelectItem value="produccion">Producción</SelectItem>
              <SelectItem value="it">Tecnología</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fecha Inicio</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaInicioSeleccionada ? (
                  format(fechaInicioSeleccionada, "dd/MM/yyyy", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={fechaInicioSeleccionada || undefined}
                onSelect={handleFechaInicioChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Fecha Fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaFinSeleccionada ? (
                  format(fechaFinSeleccionada, "dd/MM/yyyy", { locale: es })
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={fechaFinSeleccionada || undefined} onSelect={handleFechaFinChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoSolicitud">Tipo de Solicitud</Label>
          <Select value={filtros.tipoSolicitud} onValueChange={(value) => handleSelectChange("tipoSolicitud", value)}>
            <SelectTrigger id="tipoSolicitud">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las solicitudes</SelectItem>
              <SelectItem value="vacaciones">Vacaciones</SelectItem>
              <SelectItem value="permiso">Permisos</SelectItem>
              <SelectItem value="ausencia">Ausencias</SelectItem>
              <SelectItem value="licencia">Licencias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={limpiarFiltros}>
          Limpiar Filtros
        </Button>
        <Button onClick={aplicarFiltrosHandler}>Aplicar Filtros</Button>
      </CardFooter>
    </Card>
  )
}

