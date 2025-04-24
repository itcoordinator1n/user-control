"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserTable } from "@/components/user-table"
import { UserDialog } from "@/components/user-dialog"
import { PlusCircle, Search, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)
  const [activeFilters, setActiveFilters] = useState<{
    role: {
      nombreRol: string;
      area: string;
      colorEtiqueta: string;
    }|null;
    area?: number |null;
    status?: boolean |null;
  } >({
    role: null,
    area: null,
    status: null,
  })

interface User {
    id: number;
    user: string;
    name: string;
    role: string;
    area: number;
    status: string;
    email: string;
    roles: number[];
}

const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsAddUserOpen(true)
}

  const handleCloseDialog = () => {
    setIsAddUserOpen(false)
    setSelectedUser(undefined)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Cuentas de Usuario</CardTitle>
            <CardDescription>Gestiona cuentas de usuario, permisos y accesos</CardDescription>
          </div>
          <Button onClick={() => setIsAddUserOpen(true)} className="md:self-end">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Usuario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Rol</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters,role:{...activeFilters.role  as any, nombreRol:"Este Rol"}  })}>
                  Administrador
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters,role:{...activeFilters.role  as any, nombreRol:"Segundo Rol"}  })}>
                  Supervisor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters,role:{...activeFilters.role  as any, nombreRol:"Tercer Rol"}  })}>
                  Empleado
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Área</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, area: 0 })}>
                  TI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, area: 1 })}>
                  RRHH
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Estado</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, status: true })}>
                  Activo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilters({ ...activeFilters, status: false })}>
                  Inactivo
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveFilters({ role: null, area: null, status: null })}>
                Limpiar Filtros
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <UserTable searchQuery={searchQuery} filters={activeFilters} onEditUser={handleEditUser} />

        <UserDialog open={isAddUserOpen} onOpenChange={handleCloseDialog} user={selectedUser} />
      </CardContent>
    </Card>
  )
}

