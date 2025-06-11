"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "./date-picker"
import { Search, Filter, X } from "lucide-react"

interface TableFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  type: "permits" | "vacations"
}

export interface FilterState {
  keyword: string
  status: string
  startDate?: Date
  endDate?: Date
}

export function TableFilters({ onFiltersChange, type }: TableFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    keyword: "",
    status: "all", // Updated default value to "all"
    startDate: undefined,
    endDate: undefined,
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      keyword: "",
      status: "all", // Updated default value to "all"
      startDate: undefined,
      endDate: undefined,
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = filters.keyword || filters.status !== "all" || filters.startDate || filters.endDate

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda principal */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Buscar ${type === "permits" ? "permisos" : "vacaciones"}...`}
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`${hasActiveFilters ? "border-blue-500 text-blue-600" : ""}`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">!</span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} size="sm">
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avanzados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por Estado */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobada">Aprobada</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Fecha de Inicio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Desde fecha</Label>
                <DatePicker
                  date={filters.startDate}
                  onDateChange={(date) => handleFilterChange("startDate", date)}
                  placeholder="Fecha inicio"
                />
              </div>

              {/* Filtro por Fecha de Fin */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Hasta fecha</Label>
                <DatePicker
                  date={filters.endDate}
                  onDateChange={(date) => handleFilterChange("endDate", date)}
                  placeholder="Fecha fin"
                />
              </div>
            </div>

            {/* Información de filtros activos */}
            {hasActiveFilters && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Filtros activos:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.keyword && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Búsqueda: "{filters.keyword}"
                    </span>
                  )}
                  {filters.status !== "all" && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Estado: {filters.status}
                    </span>
                  )}
                  {filters.startDate && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Desde: {filters.startDate.toLocaleDateString("es-ES")}
                    </span>
                  )}
                  {filters.endDate && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Hasta: {filters.endDate.toLocaleDateString("es-ES")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
