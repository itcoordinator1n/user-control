"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";

interface User {
  id: number;
  name: string;
  user: string;
  email: string;
  roles: number[];
  area: number;
  status: string;
}
interface Rol {
  id_rol: number;
  id_usuario_creador: number;
  nombre_rol: string;
  area: number;
  dte_fecha_creacion: string; // o Date si prefieres trabajar con objetos Date
}
interface Area {
  colorEtiqueta: string;
  descripcion: string;
  id: number;
  nombre: string; // o Date si prefieres trabajar con objetos Date
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(
          "http://137.184.62.130:3000/api/rolAdministration/get-roles"
        );
        console.log("Respuesta",response)
        if (response.ok) {
          const data = await response.json();
          setRoles(data.roles);
        } else {
          console.error("Error al obtener los roles");
        }
      } catch (error) {
        console.error("Error de red:", error);
      }
    };

    fetchRoles();
  }, []);
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch(
          "http://137.184.62.130:3000/api/areaAdministration/get-areas", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user.accessToken}`,
            },
          }
        );
        console.log("Respuesta de error",response)
        if (response.ok) {
          const data = await response.json();
          setAreas(data);
        } else {
          console.log("Error al obtener los roles");
        }
      } catch (error) {
        console.log("Error de red:", error);
      }
    };

    fetchAreas();
  }, [session]);

  const isEditing = !!user;

  const [formData, setFormData] = useState<{
    id: number;
    name: string;
    user: string;
    email: string;
    roles: number[];
    area: number;
    status: boolean;
    sendWelcomeEmail: boolean;
  }>({
    id: 0,
    name: "",
    user: "",
    email: "",
    roles: [],
    area: 1,
    status: true,
    sendWelcomeEmail: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: (user as any).nombre,
        user: (user as any).nombreUsuario,
        email: (user as any).correo,
        roles: (user as any).roles || [],
        area: (user as any).area,
        status: (user as any).estado === 1,
        sendWelcomeEmail: false,
      });
    } else {
      setFormData({
        id: 0,
        name: "",
        user: "",
        email: "",
        roles: [],
        area: 1,
        status: true,
        sendWelcomeEmail: true,
      });
    }
  }, [user]);

  interface HandleChange {
    (field: string, value: string | boolean | number): void;
  }
  const handleChange: HandleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  interface HandleRoleChange {
    (role: number, checked: boolean): void;
  }

  const handleRoleChange: HandleRoleChange = (role, checked) => {
    setFormData((prev) => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter((r) => r !== role),
    }));
  };

  interface HandleSubmit {
    (e: React.FormEvent<HTMLFormElement>): void;
  }

  const handleSubmit: HandleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      try {
        const response = await fetch(
          `http://137.184.62.130:3000/api/userAdministration/update-user/${
            (user as any).id
          }`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          throw new Error("Error al crear el usuario");
        }

        const data = await response.json();
        alert(data.message);
      } catch (error) {
        console.error(error);
        alert("Hubo un problema al enviar los datos");
      }
    } else {
      try {
        const response = await fetch(
          "http://137.184.62.130:3000/api/userAdministration/create-user",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          throw new Error("Error al crear el usuario");
        }

        const data = await response.json();
        alert(data.message);
      } catch (error) {
        console.error(error);
        alert("Hubo un problema al enviar los datos");
      }
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Usuario" : "Añadir Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualice la información y permisos del usuario."
                : "Complete la información para crear una nueva cuenta de usuario."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={ formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                Usuario
              </Label>
              <Input
                id="user"
                value={formData.user}
                onChange={(e) => handleChange("user", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="col-span-3"
              
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Roles</Label>
              <div className="col-span-3 space-y-2">
                {roles.map((role,index) => (
                  <div
                    key={`${role.id_rol} - ${index}`}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`role-${role.id_rol}`}
                      checked={formData.roles.includes(role.id_rol)}
                      onCheckedChange={(checked: boolean) =>
                        handleRoleChange(role.id_rol, checked)
                      }
                    />
                    <Label htmlFor={`role-${role.id_rol}`}>
                      {role.nombre_rol}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="area" className="text-right">
                Área
              </Label>
              <Select
                value={`${formData.area}`}
                onValueChange={(value) => handleChange("area", value)}
              >
                <SelectTrigger id="area" className="col-span-3">
                  <SelectValue placeholder="Seleccionar área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area,index) => (
                    <SelectItem key={index} value={`${area.id}`}>{area.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Activo
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => handleChange("status", checked)}
                />
                <Label
                  htmlFor="status"
                  className="text-sm text-muted-foreground"
                >
                  {formData.status ? "Usuario activo" : "Usuario inactivo"}
                </Label>
              </div>
            </div>
            {!isEditing && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="welcome-email" className="text-right">
                  Email de Bienvenida
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="welcome-email"
                    checked={formData.sendWelcomeEmail}
                    onCheckedChange={(checked) =>
                      handleChange("sendWelcomeEmail", checked)
                    }
                  />
                  <Label
                    htmlFor="welcome-email"
                    className="text-sm text-muted-foreground"
                  >
                    Enviar email de bienvenida con instrucciones de acceso
                  </Label>
                </div>
              </div>
            )}
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
              {isEditing ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
