"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserTable } from "@/components/user-table"
import { UserDialog } from "@/components/user-dialog"
import { PlusCircle, Search, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSession } from "next-auth/react"

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

interface RoleOption {
  id: number;
  nombreRol: string;
  area: string;
  colorEtiqueta: string;
}

interface AreaOption {
  id: number;
  nombre: string;
}

export function UserManagement() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)
  const [activeFilters, setActiveFilters] = useState<{
    role: string | null;
    area: string | null;
    status: boolean | null;
  }>({
    role: null,
    area: null,
    status: null,
  })
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([])
  const [availableAreas, setAvailableAreas] = useState<AreaOption[]>([])

  // Fetch roles and areas for filter dropdowns
  useEffect(() => {
    const token = session?.user?.accessToken;
    if (!token) return;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const fetchFilterOptions = async () => {
      try {
        const [rolesRes, areasRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/get-all-roles`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/get-all-areas`, { headers }),
        ]);
        if (rolesRes.ok) {
          const data = await rolesRes.json();
          setAvailableRoles(Array.isArray(data) ? data : []);
        }
        if (areasRes.ok) {
          const data = await areasRes.json();
          setAvailableAreas(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error cargando filtros:", err);
      }
    };
    fetchFilterOptions();
  }, [session?.user?.accessToken]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsAddUserOpen(true)
  }

  const handleCloseDialog = () => {
    setIsAddUserOpen(false)
    setSelectedUser(undefined)
  }

  const hasActiveFilters = activeFilters.role || activeFilters.area || activeFilters.status != null;

  const clearFilters = () => {
    setActiveFilters({ role: null, area: null, status: null });
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
        <div className="flex flex-col space-y-4 mb-4">
          {/* Search + Filters Row */}
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-x-3 md:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, usuario o correo..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <Select
              value={activeFilters.role || "all"}
              onValueChange={(val) => setActiveFilters({ ...activeFilters, role: val === "all" ? null : val })}
            >
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todos los Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Roles</SelectItem>
                {availableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.nombreRol}>
                    {r.nombreRol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Area Filter */}
            <Select
              value={activeFilters.area || "all"}
              onValueChange={(val) => setActiveFilters({ ...activeFilters, area: val === "all" ? null : val })}
            >
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todas las Áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Áreas</SelectItem>
                {availableAreas.map((a) => (
                  <SelectItem key={a.id} value={a.nombre}>
                    {a.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={activeFilters.status === null ? "all" : activeFilters.status ? "active" : "inactive"}
              onValueChange={(val) => {
                setActiveFilters({
                  ...activeFilters,
                  status: val === "all" ? null : val === "active",
                });
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {activeFilters.role && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Rol: {activeFilters.role}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setActiveFilters({ ...activeFilters, role: null })}
                  />
                </Badge>
              )}
              {activeFilters.area && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Área: {activeFilters.area}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setActiveFilters({ ...activeFilters, area: null })}
                  />
                </Badge>
              )}
              {activeFilters.status != null && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {activeFilters.status ? "Activo" : "Inactivo"}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setActiveFilters({ ...activeFilters, status: null })}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6">
                Limpiar todo
              </Button>
            </div>
          )}
        </div>

        <UserTable searchQuery={searchQuery} filters={activeFilters} onEditUser={handleEditUser} />

        <UserDialog open={isAddUserOpen} onOpenChange={handleCloseDialog} user={selectedUser} />
      </CardContent>
    </Card>
  )
}
