"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ChevronLeft, ChevronRight, Download, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useSession } from "next-auth/react"

// Mock data for demonstration
const mock = [
  {
    id: 1,
    action: "User Created",
    description: "Created new user account for Emily Davis",
    performedBy: "John Doe",
    timestamp: "2023-10-15T10:30:00",
    category: "User Management",
    ip: "192.168.1.100",
  },
  {
    id: 2,
    action: "Role Modified",
    description: "Updated permissions for Supervisor role",
    performedBy: "John Doe",
    timestamp: "2023-10-15T09:45:00",
    category: "Role Management",
    ip: "192.168.1.100",
  },
  {
    id: 3,
    action: "User Login",
    description: "User logged in successfully",
    performedBy: "Jane Smith",
    timestamp: "2023-10-14T14:20:00",
    category: "Authentication",
    ip: "192.168.1.105",
  },
  {
    id: 4,
    action: "Password Reset",
    description: "Password reset for user Michael Wilson",
    performedBy: "John Doe",
    timestamp: "2023-10-14T11:15:00",
    category: "User Management",
    ip: "192.168.1.100",
  },
  {
    id: 5,
    action: "User Deleted",
    description: "Deleted user account for David Miller",
    performedBy: "Sarah Brown",
    timestamp: "2023-10-13T16:30:00",
    category: "User Management",
    ip: "192.168.1.110",
  },
  {
    id: 6,
    action: "Role Created",
    description: "Created new role: Project Manager",
    performedBy: "Sarah Brown",
    timestamp: "2023-10-13T15:45:00",
    category: "Role Management",
    ip: "192.168.1.110",
  },
  {
    id: 7,
    action: "Failed Login Attempt",
    description: "Multiple failed login attempts for user Robert Johnson",
    performedBy: "System",
    timestamp: "2023-10-12T09:10:00",
    category: "Authentication",
    ip: "192.168.1.120",
  },
  {
    id: 8,
    action: "System Settings Changed",
    description: "Updated email notification settings",
    performedBy: "John Doe",
    timestamp: "2023-10-11T14:05:00",
    category: "System Settings",
    ip: "192.168.1.100",
  },
]

type Auditoria = {
  id: number;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
  category: string;
  ip: string;
};

// Traducción de categorías y acciones
const categoryTranslations = {
  "User Management": "Gestión de Usuarios",
  "Role Management": "Gestión de Roles",
  Authentication: "Autenticación",
  "System Settings": "Configuración del Sistema",
}

const actionTranslations: { [key: string]: string } = {
  "User Created": "Usuario Creado",
  "Role Modified": "Rol Modificado",
  "User Login": "Inicio de Sesión",
  "Password Reset": "Restablecimiento de Contraseña",
  "User Deleted": "Usuario Eliminado",
  "Role Created": "Rol Creado",
  "Failed Login Attempt": "Intento de Inicio de Sesión Fallido",
  "System Settings Changed": "Configuración del Sistema Modificada",
}

export function AuditLog() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [date, setDate] = useState<Date | null>(null)
  const [activeFilters, setActiveFilters] = useState<Filters>({
    category: null,
    user: null,
  })
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const itemsPerPage = 5

  useEffect(() => {
    const fetchAuditorias = async () => {
      try {
        const res = await fetch('http://137.184.62.130:3000/api/audit/get-audit', {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }

        const data = await res.json();
        setAuditorias(data);
        console.log(data)
      } catch (err: any) {
        setError(err.message || 'Error al obtener auditorías');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditorias();
  }, [session]);

  // Filter logs based on search query, date, and active filters
  const filteredLogs = auditorias.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDate = !date || new Date(log.timestamp).toDateString() === date.toDateString()

    const matchesCategory = !activeFilters.category || log.category === activeFilters.category
    const matchesUser = !activeFilters.user || log.performedBy === activeFilters.user

    return matchesSearch && matchesDate && matchesCategory && matchesUser
  })

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

  interface AuditLog {
    id: number
    action: string
    description: string
    performedBy: string
    timestamp: string
    category: string
    ip: string
  }

  interface Filters {
    category: string | null
    user: string | null
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const handleExport = () => {
    // In a real application, you would export the logs here
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Registro de Auditoría</CardTitle>
            <CardDescription>Seguimiento y monitoreo de actividades y cambios en el sistema</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Registros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar registros..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent mode="single" selected={date || undefined} onSelect={(day) => setDate(day || null)} initialFocus />
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Categoría</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, category: "User Management" })}>
                  Gestión de Usuarios
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, category: "Role Management" })}>
                  Gestión de Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, category: "Authentication" })}>
                  Autenticación
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, category: "System Settings" })}>
                  Configuración del Sistema
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Usuario</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, user: "John Doe" })}>
                  John Doe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, user: "Jane Smith" })}>
                  Jane Smith
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, user: "Sarah Brown" })}>
                  Sarah Brown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, user: "System" })}>
                  Sistema
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveFilters({ category: null, user: null })}>
                Limpiar Filtros
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acción</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Dirección IP</TableHead>
                <TableHead>Fecha y Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{actionTranslations[log.action as keyof typeof actionTranslations] || log.action}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>{log.performedBy === "System" ? "Sistema" : log.performedBy}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryTranslations[log.category as keyof typeof categoryTranslations] || log.category}</Badge>
                    </TableCell>
                    <TableCell>{log.ip}</TableCell>
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron registros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

