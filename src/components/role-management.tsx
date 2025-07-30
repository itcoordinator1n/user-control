"use client";

import { useEffect } from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleColors, type AreaColor } from "@/lib/role-colors";
import { useSession } from "next-auth/react";

// Mock data for demonstration
const mockRoles = [
  {
    id: 1,
    name: "Administrador de Sistemas",
    description: "Gestiona la infraestructura y sistemas de TI",
    userCount: 2,
    area: "TI",
    permissions: [1, 4],
  },
  {
    id: 2,
    name: "Gerente de RRHH",
    description: "Supervisa las operaciones de recursos humanos",
    userCount: 1,
    area: "RRHH",
    permissions: [56, 4],
  },
  {
    id: 3,
    name: "Analista Financiero",
    description: "Realiza análisis financieros y reportes",
    userCount: 3,
    area: "Finanzas",
    permissions: [45, 67],
  },
];

// Permission modules for the role editor
/*
  const permissionModules = [
  {
    name: "users",
    label: "Gestión de Usuarios",
    permissions: ["view", "create", "edit", "delete"],
  },
  {
    name: "roles",
    label: "Gestión de Roles",
    permissions: ["view", "create", "edit", "delete"],
  },
  {
    name: "settings",
    label: "Configuración del Sistema",
    permissions: ["view", "edit"],
  },
  {
    name: "reports",
    label: "Informes",
    permissions: ["view", "export"],
  },
  {
    name: "audit",
    label: "Registro de Auditoría",
    permissions: ["view"],
  },
]

*/

// Traducción de permisos
const permissionTranslations = {
  view: "ver",
  create: "crear",
  edit: "editar",
  delete: "eliminar",
  export: "exportar",
};

/*
  interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  area: string;
  permissions: number[];
}
*/
interface Role {
  id_rol: number;
  nombre_rol: string;
  descripcion: string;
  area: Area;
  usuarios: string[];
  permisos:number;
}

interface FormData {
  name: string;
  description: string;
  area: AreaColor;
  permissions: number[];
}

interface Area {
  int_id_area: number;
  nombre_area: string;
  descripcion: string;
  label_color: string;
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
  // La clave es una cadena (la acción) y el valor es un arreglo de permisos.
  permisos: {
    [accion: string]: Permiso[];
  };
}
export function RoleManagement() {
  

  const [searchQuery, setSearchQuery] = useState("");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rolesData, setRolesData] = useState<RolesResponse>();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Filter roles based on search query
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

  const confirmDelete = () => {
    // In a real application, you would delete the role here
    setDeleteDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setIsRoleDialogOpen(false);
    setSelectedRole(null);
  };



  useEffect(() => {
    // Define la página y el límite deseados
    const page = 1;
    const limit = 10;
    const url = `http://137.184.62.130:3000/api/rolAdministration/get-roles?page=${page}&limit=${limit}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        return res.json();
      })
      .then((data: RolesResponse) => {
        setRolesData(data);
      })
      .catch((err: Error) => {
        console.error("Error al obtener roles:", err);
        //setError(err.message);
      });
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Gestión de Roles</CardTitle>
            <CardDescription>
              Crea y gestiona roles con permisos específicos
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsRoleDialogOpen(true)}
            className="md:self-end"
          >
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

        {/* Color Legend */}
        <div className="mb-6 p-4 bg-gray-100 rounded-md">
          <h3 className="text-lg font-semibold mb-2">
            Leyenda de Colores por Área
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(roleColors).map(([area, data]) => (
              <div key={area} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: `var(--${data.color}-500)` }}
                ></div>
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>

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
                        
                      >
                        {role.nombre_rol}
                      </Badge>
                    </TableCell>
                    <TableCell>{role.descripcion}</TableCell>
                    <TableCell>{role.area.nombre_area}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {role.usuarios.length} usuarios
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Rol
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteRole(role.id_rol)}
                            className="text-destructive focus:text-destructive"
                            disabled={role.usuarios.length > 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Rol
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

        {/* Role Editor Dialog */}
        <RoleDialog
          open={isRoleDialogOpen}
          onOpenChange={handleCloseDialog}
          role={selectedRole}
        />

        {/* Delete Role Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Eliminará permanentemente el
                rol.
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

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}

function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
  const { data: session, status } = useSession();
  const isEditing = !!role;

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    area: AreaColor;
    permissions: number[];
  }>({
    name: "",
    description: "",
    area: "TI" as AreaColor,
    permissions: [],
  });

  /*
    useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        area: role.area as AreaColor,
        permissions: { ...role.permissions },
      });
    } else {
      setFormData({
        name: "",
        description: "",
        area: "TI" as AreaColor,
        permissions: [],
      });
    }
  }, [role]);


  */

  const handleChange = (
    field: keyof typeof formData,
    value: string | AreaColor
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };



  const handlePermissionChange = (id_permiso: number, checked: boolean) => {
    setFormData((prev: FormData) => {
      let updatedPermissions = [...prev.permissions];

      if (checked) {
        if (!updatedPermissions.includes(id_permiso)) {
          updatedPermissions.push(id_permiso);
        }
      } else {
        updatedPermissions = updatedPermissions.filter(
          (id) => id !== id_permiso
        );
      }

      return {
        ...prev,
        permissions: updatedPermissions,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://137.184.62.130:3000/api/rolAdministration/create-role",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el rol");
      }

      const data = await response.json();
      //setMessage(data.message);
    } catch (err: any) {
      //setError(err.message);
      console.error("Error al crear el rol:", err);
    }
    onOpenChange(false);
  };

  interface Area {
    id: number;
    nombre: string;
    descripcion: string;
    colorEtiqueta: string;
  }

  type AreasResponse = Area[];
  const [areas, setAreas] = useState<Area[]>([]);
  const [permissionModules, setPermissionModules] = useState<
    CategoriaPermisos[]
  >([]);
  useEffect(() => {
    fetch("http://137.184.62.130:3000/api/rolAdministration/get-permissions")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        return response.json();
      })
      .then((result: CategoriaPermisos[]) => {
        setPermissionModules(result);
      })
      .catch((err) => {
        console.error("Error al obtener permisos:", err);
        //setError(err.message);
      });
  }, []);

  useEffect(() => {
    // Reemplaza la URL con la ruta correcta de tu endpoint Express
    fetch("http://137.184.62.130:3000/api/areaAdministration/get-areas", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        return response.json();
      })
      .then((data: Area[]) => {
        setAreas(data);
        //setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener las áreas:", err);
        //setError(err.message);
        //setLoading(false);
      });
  }, [session]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Rol" : "Crear Nuevo Rol"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualice los detalles y permisos del rol."
                : "Defina un nuevo rol con permisos específicos."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-name" className="text-right">
                Nombre del Rol
              </Label>
              <Input
                id="role-name"
                value={isEditing? role.nombre_rol :formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-description" className="text-right">
                Descripción
              </Label>
              <Input
                id="role-description"
                value={isEditing?role.descripcion :formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-area" className="text-right">
                Área
              </Label>
              <Select
                value={formData.area}
                onValueChange={(value) => handleChange("area", value)}
              >
                <SelectTrigger id="role-area" className="col-span-3">
                  <SelectValue placeholder="Seleccionar área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area: Area) => (
                    <SelectItem key={area.id} value={`${area.id}`}>
                      {area.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <h3 className="text-sm font-medium">Permisos</h3>

              {permissionModules.map((module) => (
                <div
                  key={module.nombre_categoria}
                  className="border rounded-md p-4"
                >
                  <h4 className="text-sm font-medium mb-2">
                    {module.nombre_categoria}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(module.permisos).map(([accion, permisos]) =>
                      permisos.map((permiso: Permiso) => (
                        <div
                          key={`${module.nombre_categoria}-${permiso.id_permiso}`}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${module.nombre_categoria}-${permiso.id_permiso}`}
                            checked={formData.permissions.includes(
                              permiso.id_permiso
                            )}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                permiso.id_permiso,
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor={`${module.nombre_categoria}-${permiso.id_permiso}`}
                            className="text-sm capitalize"
                          >
                            {
                              (
                                permissionTranslations[
                                  permiso.txt_nombre_permiso as keyof typeof permissionTranslations
                                ] || permiso.txt_nombre_permiso
                              ).split(":")[1]
                            }
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? "Guardar Cambios" : "Crear Rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
