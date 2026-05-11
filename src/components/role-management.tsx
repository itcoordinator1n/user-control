"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, Edit,  Trash2, UserMinus, UserPlus, Shield, Users, ChevronLeft, ChevronRight,
  Search as SearchIcon, Heart, Factory, BarChart3 as ChartIcon, Ticket
} from "lucide-react";
import { SYSTEM_PERMISSIONS, type PermissionModule, type PermissionDefinition } from "@/lib/permissions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";

/* ───────────── Interfaces ───────────── */

interface Area {
  int_id_area: number;
  nombre_area: string;
  descripcion: string;
  label_color: string;
}

interface Role {
  id_rol: number;
  nombre_rol: string;
  descripcion: string;
  area: Area;
  usuarios: string[];
  permisos: number;
}

interface RolesResponse {
  page: number;
  limit: number;
  roles: Role[];
}

interface Permiso {
  id_permiso: number;
  txt_nombre_permiso: string;
  txt_descripcion: string;
}

interface CategoriaPermisos {
  id_categoria: number;
  nombre_categoria: string;
  label_color: string;
  int_fk_area: number;
  permisos: { [accion: string]: Permiso[] };
}

interface RoleUser {
  id: number;
  nombreUsuario: string;
  nombre: string;
  correo: string;
}

/* ───────────── Componente Principal ───────────── */

export function RoleManagement() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rolesData, setRolesData] = useState<RolesResponse>();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const token = session?.user?.accessToken;

  const fetchRoles = () => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/get-roles?page=1&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject("Error"))
      .then((data: RolesResponse) => setRolesData(data))
      .catch((err) => console.error("Error al obtener roles:", err));
  };

  useEffect(() => { fetchRoles(); }, [token]);

  const filteredRoles = rolesData?.roles?.filter(
    (role) =>
      role.nombre_rol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleDeleteRole = (roleId: number) => {
    setSelectedRoleId(roleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRoleId || !token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/delete-role/${selectedRoleId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        fetchRoles();
      } else {
        const data = await res.json();
        alert(data.message || "Error al eliminar el rol");
      }
    } catch { alert("Error de red al eliminar el rol"); }
    setDeleteDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setIsRoleDialogOpen(false);
    setSelectedRole(null);
  };

  const areaColors = rolesData?.roles
    ? Array.from(
        new Map(
          rolesData.roles.map((r) => [
            r.area.nombre_area,
            r.area.label_color || "#6b7280",
          ])
        ).entries()
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Gestión de Roles</CardTitle>
            <CardDescription>Crea y gestiona roles con permisos específicos</CardDescription>
          </div>
          <Button onClick={() => setIsRoleDialogOpen(true)} className="md:self-end">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Rol
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar roles..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {areaColors.length > 0 && (
          <div className="mb-6 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Leyenda de Colores por Área</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {areaColors.map(([areaName, color]) => (
                <div key={areaName} className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm">{areaName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Rol</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles && filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <TableRow key={role.id_rol}>
                    <TableCell className="font-medium">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: role.area.label_color ? `${role.area.label_color}20` : undefined,
                          color: role.area.label_color || undefined,
                          borderColor: role.area.label_color || undefined,
                        }}
                      >
                        {role.nombre_rol}
                      </Badge>
                    </TableCell>
                    <TableCell>{role.descripcion}</TableCell>
                    <TableCell>{role.area.nombre_area}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.usuarios.length} usuarios</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No se encontraron roles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <RoleDialog
          open={isRoleDialogOpen}
          onOpenChange={handleCloseDialog}
          role={selectedRole}
          onSaved={fetchRoles}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Eliminará permanentemente el rol.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

/* ───────────── Diálogo de Rol (Permisos + Usuarios) ───────────── */

interface Platform {
  id_plataforma: number;
  txt_slug: string;
  txt_nombre: string;
}

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: any | null; // Cambiado temporalmente si es necesario para evitar conflictos de tipos con el nuevo campo
  onSaved: () => void;
}

function RoleDialog({ open, onOpenChange, role, onSaved }: RoleDialogProps) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const isEditing = !!role;

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    area: string;
    permissions: number[];
    platform_id: string;
  }>({ name: "", description: "", area: "", permissions: [], platform_id: "all" });

  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const [areas, setAreas] = useState<{ id: number; nombre: string }[]>([]);
  const [permissionModules, setPermissionModules] = useState<CategoriaPermisos[]>([]);
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
  const [allUsers, setAllUsers] = useState<RoleUser[]>([]);
  const [availableUserSearch, setAvailableUserSearch] = useState("");
  const [assignedUserSearch, setAssignedUserSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [activeTab, setActiveTab] = useState("permissions");
  
  const [assignedPage, setAssignedPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/get-permissions`, { headers: h })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        console.log("🔍 [DEBUG] get-permissions response:", JSON.stringify(data).substring(0, 2000));
        if (Array.isArray(data) && data.length > 0) {
          const firstCat = data[0];
          console.log("🔍 [DEBUG] Primera categoría:", firstCat.nombre_categoria);
          const permKeys = Object.keys(firstCat.permisos || {});
          console.log("🔍 [DEBUG] Acciones en cat[0]:", permKeys);
          if (permKeys.length > 0) {
            const firstPerms = firstCat.permisos[permKeys[0]];
            if (firstPerms?.length > 0) {
              console.log("🔍 [DEBUG] Primer permiso completo:", JSON.stringify(firstPerms[0]));
              console.log("🔍 [DEBUG] ¿Tiene txt_slug?:", "txt_slug" in firstPerms[0]);
            }
          }
        }
        setPermissionModules(data);
      })
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/areaAdministration/get-areas`, { headers: h })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/get-all-users`, { headers: h })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setAllUsers(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/get-platforms`, { headers: h })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPlatforms(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (role && token) {
      setFormData({
        name: role.nombre_rol,
        description: role.descripcion,
        area: String(role.area.int_id_area),
        permissions: [],
        platform_id: role.platform_id ? String(role.platform_id) : "all",
      });
      setActiveTab("permissions");

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/get-role-permissions/${role.id_rol}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : [])
        .then((ids: number[]) => setFormData((prev) => ({ ...prev, permissions: ids })))
        .catch(console.error);

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/get-role-users/${role.id_rol}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setRoleUsers(Array.isArray(data) ? data : []))
        .catch(console.error);
    } else {
      setFormData({ name: "", description: "", area: "", permissions: [], platform_id: "all" });
      setRoleUsers([]);
      setActiveTab("permissions");
    }
    setAvailableUserSearch("");
    setAssignedUserSearch("");
    setPermissionSearch("");
    setAvailablePage(1);
    setAssignedPage(1);
  }, [role, token]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (id: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, id]
        : prev.permissions.filter((p) => p !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/update-role/${role!.id_rol}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/create-role`;

    const payload = {
      ...formData,
      platform_id: formData.platform_id === "all" ? null : formData.platform_id
    };

    try {
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      alert(data.message || (isEditing ? "Rol actualizado" : "Rol creado"));
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message || "Error al guardar el rol");
    }
  };

  const assignUser = async (userId: number) => {
    if (!token || !role) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/assign-user-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_usuario: userId, id_rol: role.id_rol }),
      });
      if (res.ok) {
        const user = allUsers.find((u) => u.id === userId);
        if (user) setRoleUsers((prev) => [...prev, user]);
        onSaved();
      } else {
        const data = await res.json();
        alert(data.message || "Error al asignar usuario");
      }
    } catch { alert("Error de red"); }
  };

  const removeUser = async (userId: number) => {
    if (!token || !role) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/remove-user-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_usuario: userId, id_rol: role.id_rol }),
      });
      if (res.ok) {
        setRoleUsers((prev) => prev.filter((u) => u.id !== userId));
        onSaved();
      } else {
        const data = await res.json();
        alert(data.message || "Error al quitar usuario");
      }
    } catch { alert("Error de red"); }
  };

  const filteredAssignedUsers = roleUsers.filter((u) => {
    if (!assignedUserSearch) return true;
    const q = assignedUserSearch.toLowerCase();
    return (
      (u.nombreUsuario && u.nombreUsuario.toLowerCase().includes(q)) ||
      (u.nombre && u.nombre.toLowerCase().includes(q))
    );
  });

  const assignedTotalPages = Math.ceil(filteredAssignedUsers.length / itemsPerPage);
  const paginatedAssignedUsers = filteredAssignedUsers.slice(
    (assignedPage - 1) * itemsPerPage,
    assignedPage * itemsPerPage
  );

  const mappedPermissions = useMemo(() => {
    return SYSTEM_PERMISSIONS.map(module => {
      const backendModule = permissionModules.find(bm => {
        const bName = bm.nombre_categoria.toLowerCase();
        const fName = module.name.toLowerCase();
        return bName.includes(fName) || fName.includes(bName);
      });

      return {
        ...module,
        permissions: module.permissions.map(p => {
          let backendId: number | undefined;

          // Primero intentar buscar en el módulo que corresponde
          if (backendModule) {
            for (const perms of Object.values(backendModule.permisos)) {
              const found = (perms as any[]).find(bp => bp.txt_slug === p.id);
              if (found) { backendId = found.id_permiso; break; }
            }
          }

          // Si no se encontró en su módulo, buscar en TODO el set de permisos (Búsqueda Global por Slug)
          if (!backendId) {
            for (const bm of permissionModules) {
              for (const perms of Object.values(bm.permisos)) {
                const found = (perms as any[]).find(bp => bp.txt_slug === p.id);
                if (found) { backendId = found.id_permiso; break; }
              }
              if (backendId) break;
            }
          }

          return { ...p, backendId };
        })
      };
    });
  }, [permissionModules]);

  const roleUserIds = new Set(roleUsers.map((u) => u.id));
  const filteredAvailableUsers = allUsers
    .filter((u) => !roleUserIds.has(u.id))
    .filter((u) => {
      if (!availableUserSearch) return true;
      const q = availableUserSearch.toLowerCase();
      return (
        (u.nombreUsuario && u.nombreUsuario.toLowerCase().includes(q)) ||
        (u.nombre && u.nombre.toLowerCase().includes(q))
      );
    });

  const availableTotalPages = Math.ceil(filteredAvailableUsers.length / itemsPerPage);
  const paginatedAvailableUsers = filteredAvailableUsers.slice(
    (availablePage - 1) * itemsPerPage,
    availablePage * itemsPerPage
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                {isEditing ? `Editar Rol: ${role!.nombre_rol}` : "Crear Nuevo Rol"}
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-sm">
                {isEditing
                  ? "Actualice los detalles, permisos y usuarios del rol."
                  : "Defina un nuevo rol con permisos específicos."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Edit className="h-3.5 w-3.5" /> Información General
              </h3>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="role-name" className="text-right text-sm font-medium text-slate-700">Nombre</Label>
                <Input id="role-name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="col-span-3 bg-white" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="role-desc" className="text-right text-sm font-medium text-slate-700">Descripción</Label>
                <Input id="role-desc" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} className="col-span-3 bg-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right text-sm font-medium text-slate-700">Área</Label>
                <Select value={formData.area} onValueChange={(v) => handleChange("area", v)}>
                  <SelectTrigger className="col-span-3 bg-white"><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                  <SelectContent>
                    {areas.map((a: any) => (
                      <SelectItem key={a.id} value={`${a.id}`}>{a.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right text-sm font-medium text-slate-700">Plataforma</Label>
                <Select value={formData.platform_id} onValueChange={(v) => handleChange("platform_id", v)}>
                  <SelectTrigger className="col-span-3 bg-white">
                    <SelectValue placeholder="Global (Todas)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Global (Todas las plataformas)</SelectItem>
                    {platforms.map((p) => (
                      <SelectItem key={p.id_plataforma} value={`${p.id_plataforma}`}>
                        {p.txt_nombre} ({p.txt_slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg h-11">
                <TabsTrigger value="permissions" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  <Shield className="h-4 w-4" /> Permisos
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{formData.permissions.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md" disabled={!isEditing}>
                  <Users className="h-4 w-4" /> Usuarios
                  {isEditing && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{roleUsers.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="permissions" className="space-y-4 mt-4 max-h-[45vh] overflow-y-auto pr-1">
                <div className="relative mb-2">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Filtrar permisos..." 
                    className="pl-9 bg-slate-50 border-slate-200 h-9 text-sm" 
                    value={permissionSearch} 
                    onChange={(e) => setPermissionSearch(e.target.value)} 
                  />
                </div>

                {mappedPermissions.map((mod) => (
                  <div key={mod.name} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-slate-50 to-white px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                          {mod.name === "Gestión de Usuarios" && <Users className="h-4 w-4" />}
                          {mod.name === "Gestión de Roles" && <Shield className="h-4 w-4" />}
                          {mod.name === "Recursos Humanos (RRHH)" && <Heart className="h-4 w-4" />}
                          {mod.name === "Métricas y Dashboards" && <ChartIcon className="h-4 w-4" />}
                          {mod.name === "Soporte IT (Tickets)" && <Ticket className="h-4 w-4" />}
                          {mod.name === "Producción" && <Factory className="h-4 w-4" />}
                          {mod.name === "Auditoría" && <SearchIcon className="h-4 w-4" />}
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">{mod.name}</h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">
                        {mod.permissions.filter(p => p.backendId).length} Activos
                      </Badge>
                    </div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mod.permissions
                        .filter(p => !permissionSearch || p.label.toLowerCase().includes(permissionSearch.toLowerCase()) || mod.name.toLowerCase().includes(permissionSearch.toLowerCase()))
                        .map((p) => {
                          const isAvailable = !!p.backendId;
                          const isChecked = isAvailable && formData.permissions.includes(p.backendId!);

                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 group
                                ${!isAvailable ? "opacity-60 bg-slate-50 border-dashed border-slate-300 cursor-not-allowed" : 
                                  isChecked ? "bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-100" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer"}
                              `}
                            >
                              <div className="pt-0.5">
                                <Checkbox
                                  id={`perm-${p.id}`}
                                  disabled={!isAvailable}
                                  checked={isChecked}
                                  onCheckedChange={(c) => isAvailable && handlePermissionChange(p.backendId!, c as boolean)}
                                  className={!isAvailable ? "opacity-30" : ""}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`text-sm font-bold truncate ${isChecked ? "text-blue-700" : "text-slate-800"}`}>
                                    {p.label}
                                  </span>
                                  {!isAvailable && (
                                    <Badge variant="outline" className="h-4 px-1 text-[8px] border-slate-300 text-slate-400 font-normal">
                                      Próximamente
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  {p.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                ))}
                {permissionModules.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cargando permisos...</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-5 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Usuarios asignados ({roleUsers.length})
                    </h4>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Buscar en asignados..." 
                      className="pl-9 bg-slate-50 border-slate-200 h-9 text-sm" 
                      value={assignedUserSearch} 
                      onChange={(e) => {
                        setAssignedUserSearch(e.target.value);
                        setAssignedPage(1);
                      }} 
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden min-h-[150px]">
                    {paginatedAssignedUsers.length > 0 ? paginatedAssignedUsers.map((u, i) => (
                      <div key={u.id} className={`flex items-center justify-between px-4 py-2.5 hover:bg-red-50/40 transition-colors ${i < paginatedAssignedUsers.length - 1 ? "border-b border-slate-100" : ""}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(u.nombre || u.nombreUsuario || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{u.nombre || u.nombreUsuario}</p>
                            <p className="text-xs text-slate-400 truncate">{u.correo || "Sin correo"}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-100 text-xs gap-1 h-8 px-2 shrink-0" onClick={() => removeUser(u.id)}>
                          <UserMinus className="h-3.5 w-3.5" /> Quitar
                        </Button>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-slate-400">
                        <Users className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                        <p className="text-sm">{assignedUserSearch ? "Sin coincidencias" : "Sin usuarios asignados"}</p>
                      </div>
                    )}
                  </div>

                  {assignedTotalPages > 1 && (
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Página {assignedPage} de {assignedTotalPages}</p>
                      <div className="flex gap-1">
                        <Button 
                          type="button" variant="outline" size="sm" className="h-7 px-2" 
                          disabled={assignedPage === 1}
                          onClick={() => setAssignedPage(prev => prev - 1)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          type="button" variant="outline" size="sm" className="h-7 px-2" 
                          disabled={assignedPage === assignedTotalPages}
                          onClick={() => setAssignedPage(prev => prev + 1)}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-100 mx-2" />

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" /> Asignar usuario
                  </h4>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Buscar por nombre o usuario..." 
                      className="pl-9 bg-slate-50 border-slate-200 h-9 text-sm" 
                      value={availableUserSearch} 
                      onChange={(e) => {
                        setAvailableUserSearch(e.target.value);
                        setAvailablePage(1);
                      }} 
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden min-h-[150px]">
                    {paginatedAvailableUsers.length > 0 ? paginatedAvailableUsers.map((u, i) => (
                      <div key={u.id} className={`flex items-center justify-between px-4 py-2.5 hover:bg-green-50/40 transition-colors ${i < paginatedAvailableUsers.length - 1 ? "border-b border-slate-100" : ""}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(u.nombre || u.nombreUsuario || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{u.nombre || u.nombreUsuario}</p>
                            <p className="text-xs text-slate-400 truncate">{u.correo || "Sin correo"}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 text-xs gap-1 h-8 px-2 shrink-0" onClick={() => assignUser(u.id)}>
                          <UserPlus className="h-3.5 w-3.5" /> Asignar
                        </Button>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-slate-400">
                        <Search className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                        <p className="text-sm">{availableUserSearch ? "Sin resultados" : "Todos los usuarios ya tienen este rol"}</p>
                      </div>
                    )}
                  </div>

                  {availableTotalPages > 1 && (
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Página {availablePage} de {availableTotalPages}</p>
                      <div className="flex gap-1">
                        <Button 
                          type="button" variant="outline" size="sm" className="h-7 px-2" 
                          disabled={availablePage === 1}
                          onClick={() => setAvailablePage(prev => prev - 1)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          type="button" variant="outline" size="sm" className="h-7 px-2" 
                          disabled={availablePage === availableTotalPages}
                          onClick={() => setAvailablePage(prev => prev + 1)}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Footer fijo ── */}
          <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-6">
              {isEditing ? "Guardar Cambios" : "Crear Rol"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
