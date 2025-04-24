"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Datos de ejemplo para marcajes
const datosMarcajes = [
  {
    id: 1,
    empleado: "Ana García",
    area: "Recursos Humanos",
    fecha: "2023-05-10",
    horaEntrada: "08:02",
    horaSalida: "17:05",
    estado: "Completo",
  },
  {
    id: 2,
    empleado: "Carlos Pérez",
    area: "Ventas",
    fecha: "2023-05-10",
    horaEntrada: "08:15",
    horaSalida: "17:30",
    estado: "Tardanza",
  },
  {
    id: 3,
    empleado: "María López",
    area: "Administración",
    fecha: "2023-05-10",
    horaEntrada: "07:55",
    horaSalida: "17:00",
    estado: "Completo",
  },
  {
    id: 4,
    empleado: "Juan Martínez",
    area: "Tecnología",
    fecha: "2023-05-10",
    horaEntrada: "09:20",
    horaSalida: "18:00",
    estado: "Tardanza",
  },
  {
    id: 5,
    empleado: "Laura Sánchez",
    area: "Producción",
    fecha: "2023-05-10",
    horaEntrada: "08:00",
    horaSalida: "16:30",
    estado: "Salida temprana",
  },
  {
    id: 6,
    empleado: "Pedro Ramírez",
    area: "Ventas",
    fecha: "2023-05-11",
    horaEntrada: "08:05",
    horaSalida: "17:10",
    estado: "Completo",
  },
  {
    id: 7,
    empleado: "Sofía Torres",
    area: "Recursos Humanos",
    fecha: "2023-05-11",
    horaEntrada: "08:00",
    horaSalida: "17:00",
    estado: "Completo",
  },
  {
    id: 8,
    empleado: "Diego Flores",
    area: "Tecnología",
    fecha: "2023-05-11",
    horaEntrada: "08:30",
    horaSalida: "17:45",
    estado: "Tardanza",
  },
  {
    id: 9,
    empleado: "Carmen Ruiz",
    area: "Administración",
    fecha: "2023-05-11",
    horaEntrada: "07:50",
    horaSalida: "17:00",
    estado: "Completo",
  },
  {
    id: 10,
    empleado: "Javier Morales",
    area: "Producción",
    fecha: "2023-05-11",
    horaEntrada: "08:00",
    horaSalida: "16:00",
    estado: "Salida temprana",
  },
]

// Datos de ejemplo para solicitudes
const datosSolicitudes = [
  {
    id: 1,
    empleado: "Ana García",
    area: "Recursos Humanos",
    tipo: "Vacaciones",
    fechaInicio: "2023-06-01",
    fechaFin: "2023-06-15",
    estado: "Aprobado",
  },
  {
    id: 2,
    empleado: "Carlos Pérez",
    area: "Ventas",
    tipo: "Permiso",
    fechaInicio: "2023-05-20",
    fechaFin: "2023-05-20",
    estado: "Pendiente",
  },
  {
    id: 3,
    empleado: "María López",
    area: "Administración",
    tipo: "Licencia",
    fechaInicio: "2023-07-01",
    fechaFin: "2023-07-30",
    estado: "Aprobado",
  },
  {
    id: 4,
    empleado: "Juan Martínez",
    area: "Tecnología",
    tipo: "Ausencia",
    fechaInicio: "2023-05-15",
    fechaFin: "2023-05-15",
    estado: "Rechazado",
  },
  {
    id: 5,
    empleado: "Laura Sánchez",
    area: "Producción",
    tipo: "Vacaciones",
    fechaInicio: "2023-08-01",
    fechaFin: "2023-08-10",
    estado: "Pendiente",
  },
  {
    id: 6,
    empleado: "Pedro Ramírez",
    area: "Ventas",
    tipo: "Permiso",
    fechaInicio: "2023-05-25",
    fechaFin: "2023-05-25",
    estado: "Aprobado",
  },
  {
    id: 7,
    empleado: "Sofía Torres",
    area: "Recursos Humanos",
    tipo: "Vacaciones",
    fechaInicio: "2023-09-01",
    fechaFin: "2023-09-15",
    estado: "Pendiente",
  },
  {
    id: 8,
    empleado: "Diego Flores",
    area: "Tecnología",
    tipo: "Licencia",
    fechaInicio: "2023-06-10",
    fechaFin: "2023-06-20",
    estado: "Aprobado",
  },
  {
    id: 9,
    empleado: "Carmen Ruiz",
    area: "Administración",
    tipo: "Ausencia",
    fechaInicio: "2023-05-18",
    fechaFin: "2023-05-18",
    estado: "Aprobado",
  },
  {
    id: 10,
    empleado: "Javier Morales",
    area: "Producción",
    tipo: "Permiso",
    fechaInicio: "2023-05-30",
    fechaFin: "2023-05-30",
    estado: "Pendiente",
  },
]

interface Filtros {
  empleado?: string;
  area?: string;
}

interface ReportingTableProps {
  tipo: "marcajes" | "solicitudes";
  filtros: Filtros;
}

export default function ReportingTable({ tipo, filtros }: ReportingTableProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const [elementosPorPagina, setElementosPorPagina] = useState(5)
  const [ordenarPor, setOrdenarPor] = useState("")
  const [ordenAscendente, setOrdenAscendente] = useState(true)
  const [busqueda, setBusqueda] = useState("")

  // Determinar qué datos mostrar según el tipo
  const datos = tipo === "marcajes" ? datosMarcajes : datosSolicitudes

  // Aplicar filtros (simplificado para el ejemplo)
  const datosFiltrados = datos.filter((item) => {
    if (filtros.empleado && !item.empleado.toLowerCase().includes(filtros.empleado.toLowerCase())) return false
    if (filtros.area && filtros.area !== "todas" && item.area !== filtros.area) return false
    // Más filtros se aplicarían aquí
    return true
  })

  // Aplicar búsqueda
  const datosConBusqueda = datosFiltrados.filter((item) => {
    if (!busqueda) return true
    return Object.values(item).some(
      (val) => typeof val === "string" && val.toLowerCase().includes(busqueda.toLowerCase()),
    )
  })

  // Ordenar datos
  const datosOrdenados = [...datosConBusqueda].sort((a, b) => {
    if (!ordenarPor) return 0

    const valorA = a[ordenarPor as keyof typeof a]
    const valorB = b[ordenarPor as keyof typeof b]

    if (typeof valorA === "string" && typeof valorB === "string") {
      return ordenAscendente ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA)
    }

    if (typeof valorA === "number" && typeof valorB === "number") {
      return ordenAscendente ? valorA - valorB : valorB - valorA
    }
    return 0
  })

  // Paginación
  const indiceInicial = (paginaActual - 1) * elementosPorPagina
  const indiceFinal = indiceInicial + elementosPorPagina
  const datosPaginados = datosOrdenados.slice(indiceInicial, indiceFinal)
  const totalPaginas = Math.ceil(datosOrdenados.length / elementosPorPagina)

interface CambiarPaginaProps {
    pagina: number;
}

const cambiarPagina = (pagina: CambiarPaginaProps['pagina']) => {
    setPaginaActual(pagina)
}

interface OrdenarTablaProps {
    campo: keyof typeof datosMarcajes[0] | keyof typeof datosSolicitudes[0];
}

const ordenarTabla = ({ campo }: OrdenarTablaProps) => {
    if (ordenarPor === campo) {
        setOrdenAscendente(!ordenAscendente);
    } else {
        setOrdenarPor(campo);
        setOrdenAscendente(true);
    }
};

interface EstadoBadgeProps {
    estado: string;
}

const getEstadoBadge = ({ estado }: EstadoBadgeProps) => {
    const estilos: { [key: string]: string } = {
        Completo: "bg-green-100 text-green-800 hover:bg-green-100",
        Tardanza: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        "Salida temprana": "bg-orange-100 text-orange-800 hover:bg-orange-100",
        Aprobado: "bg-green-100 text-green-800 hover:bg-green-100",
        Pendiente: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        Rechazado: "bg-red-100 text-red-800 hover:bg-red-100",
    };

    return (
        <Badge variant="outline" className={estilos[estado] || ""}>
            {estado}
        </Badge>
    );
};

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar:</span>
          <Select
            value={elementosPorPagina.toString()}
            onValueChange={(value) => {
              setElementosPorPagina(Number.parseInt(value))
              setPaginaActual(1)
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {tipo === "marcajes" ? (
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => ordenarTabla({ campo: "empleado" })}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Empleado
                    {ordenarPor === "empleado" && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => ordenarTabla({ campo: "area" })}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Área
                    {ordenarPor === "area" && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => ordenarTabla({ campo: "fecha" })}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Fecha
                    {ordenarPor === "fecha" && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                </TableHead>
                <TableHead>Hora Entrada</TableHead>
                <TableHead>Hora Salida</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => ordenarTabla({ campo: "empleado" })}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Empleado
                    {ordenarPor === "empleado" && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => ordenarTabla({ campo: "area" })}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Área
                    {ordenarPor === "area" && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => ordenarTabla({ campo: "tipo" })}
                    className="flex items-center gap-1 p-0 h-auto font-medium"
                  >
                    Tipo
                    {ordenarPor === "tipo" && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                </TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {datosPaginados.length > 0 ? (
              datosPaginados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.empleado}</TableCell>
                  <TableCell>{item.area}</TableCell>
                  {tipo === "marcajes" ? (
                    <>
                      {"fecha" in item && <TableCell>{item.fecha}</TableCell>}
                      {"horaEntrada" in item && <TableCell>{item.horaEntrada}</TableCell>}
                      {"horaSalida" in item && <TableCell>{item.horaSalida}</TableCell>}
                    </>
                  ) : (
                    <>
                      {"tipo" in item && <TableCell>{item.tipo}</TableCell>}
                      {"fechaInicio" in item && <TableCell>{item.fechaInicio}</TableCell>}
                      {"fechaFin" in item && <TableCell>{item.fechaFin}</TableCell>}
                    </>
                  )}
                  <TableCell>{getEstadoBadge({ estado: item.estado })}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tipo === "marcajes" ? 7 : 7} className="text-center py-4">
                  No se encontraron resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, datosOrdenados.length)} de {datosOrdenados.length}{" "}
          registros
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => cambiarPagina(Math.max(1, paginaActual - 1))}
                className={paginaActual === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              // Lógica para mostrar páginas cercanas a la actual
              let pageToShow
              if (totalPaginas <= 5) {
                pageToShow = i + 1
              } else if (paginaActual <= 3) {
                pageToShow = i + 1
              } else if (paginaActual >= totalPaginas - 2) {
                pageToShow = totalPaginas - 4 + i
              } else {
                pageToShow = paginaActual - 2 + i
              }

              return (
                <PaginationItem key={i}>
                  <PaginationLink isActive={pageToShow === paginaActual} onClick={() => cambiarPagina(pageToShow)}>
                    {pageToShow}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => cambiarPagina(Math.min(totalPaginas, paginaActual + 1))}
                className={paginaActual === totalPaginas ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

