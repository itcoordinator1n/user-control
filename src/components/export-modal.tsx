"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ExportModalProps {
  cerrarModal: () => void;
  exportarDatos: (opciones: {
    tipoExportacion: string;
    incluirGraficos: boolean;
    incluirTodosUsuarios: boolean;
    fechaInicio: string;
    fechaFin: string;
  }) => void;
}

export default function ExportModal({ cerrarModal, exportarDatos }: ExportModalProps) {
  const [tipoExportacion, setTipoExportacion] = useState("datos")
  const [incluirGraficos, setIncluirGraficos] = useState(false)
  const [incluirTodosUsuarios, setIncluirTodosUsuarios] = useState(true)
  const [fechaInicio, setFechaInicio] = useState(new Date())
  const [fechaFin, setFechaFin] = useState(new Date())

  const handleExportar = () => {
    const opciones = {
      tipoExportacion,
      incluirGraficos,
      incluirTodosUsuarios,
      fechaInicio: format(fechaInicio, "yyyy-MM-dd"),
      fechaFin: format(fechaFin, "yyyy-MM-dd"),
    }

    exportarDatos(opciones)
  }

  return (
    <Dialog open={true} onOpenChange={cerrarModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar a Excel
          </DialogTitle>
          <DialogDescription>Configura las opciones para exportar los datos a un archivo Excel</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Exportación</Label>
            <RadioGroup value={tipoExportacion} onValueChange={setTipoExportacion} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="datos" id="datos" />
                <Label htmlFor="datos" className="font-normal">
                  Datos en bruto
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="analisis" id="analisis" />
                <Label htmlFor="analisis" className="font-normal">
                  Análisis y resumen
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completo" id="completo" />
                <Label htmlFor="completo" className="font-normal">
                  Reporte completo
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Opciones Adicionales</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirGraficos"
                checked={incluirGraficos}
                onCheckedChange={(checked) => setIncluirGraficos(checked === true)}
              />
              <Label htmlFor="incluirGraficos" className="font-normal">
                Incluir gráficos en el reporte
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirTodosUsuarios"
                checked={incluirTodosUsuarios}
                onCheckedChange={(checked) => setIncluirTodosUsuarios(checked === true)}
              />
              <Label htmlFor="incluirTodosUsuarios" className="font-normal">
                Incluir todos los usuarios
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaInicio, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={(date) => date && setFechaInicio(date)}
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
                    {format(fechaFin, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaFin}
                    onSelect={(date) => date && setFechaFin(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={cerrarModal}>
            Cancelar
          </Button>
          <Button onClick={handleExportar} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

