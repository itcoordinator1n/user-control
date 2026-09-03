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
          `${process.env.NEXT_PUBLIC_API_URL}/api/rolAdministration/get-roles`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user?.accessToken}`,
            },
          }
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
  }, [session?.user?.accessToken]);
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/areaAdministration/get-areas`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user?.accessToken}`,
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
    // Obligatorios: sin fecha de contrato y tipo no se calculan vacaciones, y sin
    // jefe las solicitudes de esta persona no le llegan a nadie.
    fechaContrato: string;
    tipoUsuario: string;
    jefe: string;
    puesto: string;
  }>({
    id: 0,
    name: "",
    user: "",
    email: "",
    roles: [],
    area: 1,
    status: true,
    sendWelcomeEmail: true,
    fechaContrato: "",
    tipoUsuario: "",
    jefe: "",
    puesto: "",
  });

  // Catálogos de los selectores nuevos.
  const [tiposUsuario, setTiposUsuario] = useState<{ id: number; nombre: string }[]>([]);
  const [posiblesJefes, setPosiblesJefes] = useState<{ id: number; nombre: string; nombreArea?: string }[]>([]);

  useEffect(() => {
    const token = session?.user?.accessToken;
    if (!token) return;
    const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/get-user-types`, { headers: h })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTiposUsuario(Array.isArray(d) ? d : []))
      .catch(() => setTiposUsuario([]));
    // La lista de jefes son los propios usuarios; se reutiliza el listado general.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/get-all-users`, { headers: h })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPosiblesJefes(Array.isArray(d)
        ? d.filter((u: any) => u.estado).map((u: any) => ({ id: u.id, nombre: u.nombre, nombreArea: u.nombreArea }))
        : []))
      .catch(() => setPosiblesJefes([]));
  }, [session]);

  useEffect(() => {
    if (user) {
      const userRoles = (user as any).roles || [];
      console.log("[DEBUG] user.roles raw:", JSON.stringify(userRoles));
      // Extraer IDs numéricos de los objetos de rol para marcar los checkboxes
      const roleIds = userRoles.map((r: any) => r.id_rol ?? r.idRol ?? r.id ?? r).filter((id: any) => typeof id === 'number');
      console.log("[DEBUG] roleIds extracted:", roleIds);
      setFormData({
        id: user.id,
        name: (user as any).nombre,
        user: (user as any).nombreUsuario,
        email: (user as any).correo || "",
        roles: roleIds,
        area: Number((user as any).area) || 1,
        status: (user as any).estado === 1,
        sendWelcomeEmail: false,
        fechaContrato: (user as any).fechaContrato || "",
        tipoUsuario: (user as any).tipoUsuario ? String((user as any).tipoUsuario) : "",
        jefe: (user as any).jefe ? String((user as any).jefe) : "",
        puesto: (user as any).puesto || "",
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
        fechaContrato: "",
        tipoUsuario: "",
        jefe: "",
        puesto: "",
      });
    }
  }, [user]);

  /**
   * Campos que el backend exige. Se valida también aquí para no mandar una petición
   * que se sabe que va a fallar y para poder señalar el campo concreto.
   */
  const faltantes = (() => {
    const f: string[] = [];
    if (!formData.name.trim())     f.push("nombre");
    if (!formData.user.trim())     f.push("usuario");
    if (!formData.roles.length)    f.push("al menos un rol");
    if (!formData.fechaContrato)   f.push("fecha de contrato");
    if (!formData.tipoUsuario)     f.push("tipo de usuario");
    if (!formData.jefe)            f.push("jefe inmediato");
    if (!formData.puesto.trim())   f.push("puesto");
    if (isEditing && String(formData.jefe) === String(formData.id))
      f.push("un jefe distinto de sí mismo");
    return f;
  })();

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
        const payload = {
          ...formData,
          email: formData.email || undefined,
          area: Number(formData.area),
        };
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/update-user/${
            (user as any).id
          }`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user?.accessToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || data.message || "Error al actualizar el usuario");
        }

        alert(data.message);
      } catch (error: any) {
        console.error(error);
        alert(error.message || "Hubo un problema al enviar los datos");
      }
    } else {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/create-user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user?.accessToken}`,
            },
            body: JSON.stringify(formData),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          // El backend explica qué falta o por qué choca; repetirlo es más útil que
          // un "Error al crear el usuario" genérico.
          throw new Error(data.error || "Error al crear el usuario");
        }

        // Sin correo no hay forma de hacerle llegar la clave, así que el backend la
        // devuelve para que quien lo dio de alta se la entregue en mano.
        if (data.temporaryPassword) {
          alert(
            `${data.message}

Contraseña temporal: ${data.temporaryPassword}

` +
            "Anotala ahora: no se vuelve a mostrar. La persona deberá cambiarla al entrar."
          );
        } else {
          alert(`${data.message}${data.emailSent ? " Se le envió la contraseña por correo." : ""}`);
        }
      } catch (error: any) {
        console.error(error);
        alert(error.message || "Hubo un problema al enviar los datos");
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
            {/* ── Campos obligatorios para que la persona funcione en el sistema ──
                Sin fecha de contrato y tipo no se le devenga ni un día de vacaciones,
                y sin jefe sus permisos no le llegan a nadie. Antes no se pedían y por
                eso hay empleados que ven 0 días sin explicación. */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="puesto" className="text-right">
                Puesto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="puesto"
                className="col-span-3"
                value={formData.puesto}
                onChange={(e) => handleChange("puesto", e.target.value)}
                placeholder="Analista de sistemas"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fechaContrato" className="text-right">
                Fecha de contrato <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="fechaContrato"
                  type="date"
                  max={new Date().toISOString().substring(0, 10)}
                  value={formData.fechaContrato}
                  onChange={(e) => handleChange("fechaContrato", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Desde esta fecha se devengan sus vacaciones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipoUsuario" className="text-right">
                Tipo de usuario <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.tipoUsuario}
                  onValueChange={(value) => handleChange("tipoUsuario", value)}
                >
                  <SelectTrigger id="tipoUsuario">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposUsuario.map((t) => (
                      <SelectItem key={t.id} value={`${t.id}`}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Define la escala de días de vacaciones por año de servicio.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jefe" className="text-right">
                Jefe inmediato <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.jefe}
                  onValueChange={(value) => handleChange("jefe", value)}
                >
                  <SelectTrigger id="jefe">
                    <SelectValue placeholder="Seleccionar jefe" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {posiblesJefes
                      .filter((j) => !isEditing || j.id !== formData.id)
                      .map((j) => (
                        <SelectItem key={j.id} value={`${j.id}`}>
                          {j.nombre}{j.nombreArea ? ` — ${j.nombreArea}` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  A quién le llegan sus solicitudes de permiso y vacaciones.
                </p>
              </div>
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
            <Button type="submit" disabled={faltantes.length > 0}>
              {isEditing ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
          {faltantes.length > 0 && (
            <p className="text-xs text-red-600 text-right">
              Falta completar: {faltantes.join(", ")}.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
