"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleColor, getAreaFromRole } from "@/lib/role-colors";
import { useSession } from "next-auth/react";

interface UserTableProps {
  searchQuery: string;
  filters: {
    role?: string | null;
    area?: string | null;
    status?: boolean | null;
  } | null;
  onEditUser: (user: any) => void;
}

export function UserTable({
  searchQuery,
  filters,
  onEditUser,
}: UserTableProps) {
  interface User {
    area: number;
    nombreArea: string;
    id: number;
    correo: string;
    estado: boolean;
    nombreUsuario: string;
    nombre:string;
    roles: Array<{
      nombreRol: string;
      area: string;
      colorEtiqueta: string;
    }>;

    ultimoAcceso: string;
  }
  const { data: session } = useSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Asignar la contraseña a mano: para cuando quien administra está con la persona y
  // le conviene dictársela, sin depender de que llegue el WhatsApp.
  const [tempDialogOpen, setTempDialogOpen] = useState(false);
  const [tempUser, setTempUser] = useState<{ id: number; nombre: string } | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [tempEnviando, setTempEnviando] = useState(false);

  /** Sugerencia fácil de dictar: sin caracteres que se confundan al leerlos en voz alta. */
  const sugerirPassword = () => {
    const letras = "abcdefghjkmnpqrstuvwxyz";   // sin i, l, o
    const numeros = "23456789";                  // sin 0 ni 1
    const al = (s: string) => s[Math.floor(Math.random() * s.length)];
    const base = Array.from({ length: 6 }, () => al(letras)).join("");
    setTempPassword(
      base[0].toUpperCase() + base.slice(1) + al(numeros) + al(numeros) + al(numeros),
    );
  };

  const confirmTempPassword = async () => {
    if (!tempUser) return;
    setTempEnviando(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/set-temp-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
          body: JSON.stringify({ id_usuario: tempUser.id, password: tempPassword.trim() }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo asignar la contraseña");
      alert(
        `${data.message}

Entregale estos datos:

` +
        `Usuario: ${data.usuario}
Contraseña: ${tempPassword.trim()}` +
        (data.enlacesAnulados ? `

Se anularon ${data.enlacesAnulados} enlace(s) de restablecimiento pendientes.` : ""),
      );
      setTempDialogOpen(false);
      setTempPassword("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo asignar la contraseña");
    } finally {
      setTempEnviando(false);
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Filter users based on search query and active filters
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (user.nombreUsuario && user.nombreUsuario.toLowerCase().includes(q)) ||
      (user.nombre && user.nombre.toLowerCase().includes(q)) ||
      (user.correo && user.correo.toLowerCase().includes(q));

    const matchesRoleFilter =
      !filters || !filters.role ||
      user.roles.some((r) => r.nombreRol === filters.role);

    const matchesAreaFilter =
      !filters || !filters.area ||
      user.nombreArea === filters.area;

    const matchesStatusFilter =
      filters?.status == null || user.estado === filters.status;

    return (
      matchesSearch &&
      matchesRoleFilter &&
      matchesAreaFilter &&
      matchesStatusFilter
    );
  });

  // Unique roles and areas for parent component
  const uniqueRoles = Array.from(
    new Set(users.flatMap((u) => u.roles.map((r) => r.nombreRol)))
  ).sort();
  const uniqueAreas = Array.from(
    new Set(users.map((u) => u.nombreArea).filter(Boolean))
  ).sort();

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    const token = session?.user?.accessToken;
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/get-all-users`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error("Error al obtener usuarios");
        }
      } catch (error) {
        console.error("Error de red:", error);
      }
    };

    fetchUsers();
  }, [session?.user?.accessToken]);

  const handleDeleteUser = (userId: User["id"]) => {
    setSelectedUserId(userId);
    setDeleteDialogOpen(true);
  };

  interface HandleResetPassword {
    (userId: User["id"]): void;
  }

  const handleResetPassword: HandleResetPassword = (userId) => {
    setSelectedUserId(userId);
    setResetPasswordDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/delete-user/${selectedUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el usuario");
      }

      const data = await response.json();
      alert(data.message);
      // Refrescar la lista de usuarios
      setUsers((prev) => prev.filter((u) => u.id !== selectedUserId));
    } catch (error) {
      alert("Hubo un problema al eliminar el usuario");
    }
    setDeleteDialogOpen(false);
  };

  const confirmResetPassword = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/userAdministration/reset-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
          body: JSON.stringify({ id_usuario: selectedUserId }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al restablecer la contraseña");
      }

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error(error);
      alert("Hubo un problema al restablecer la contraseña");
    }
    setResetPasswordDialogOpen(false);
  };

  interface FormatDate {
    (dateString: string): string;
  }

  const formatDate: FormatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último Acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.nombreUsuario}
                  </TableCell>
                  <TableCell>{user.correo}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role,index) => (
                        <Badge
                          key={`${index} - ${role.nombreRol} `}
                          variant="outline"
                          style={{
                            backgroundColor: `var(--${getRoleColor(
                              role.colorEtiqueta
                            )}-100)`,
                            color: `var(--${getRoleColor(
                              role.colorEtiqueta
                            )}-800)`,
                            borderColor: `var(--${getRoleColor(
                              role.colorEtiqueta
                            )}-300)`,
                          }}
                        >
                          {role.nombreRol}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{user.nombreArea}</TableCell>
                  <TableCell>
                    <Badge variant={user.estado ? "outline" : "secondary"}>
                      {user.estado ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.ultimoAcceso)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(user.id)}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Enviar enlace de restablecimiento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setTempUser({ id: user.id, nombre: user.nombre });
                            setTempPassword("");
                            setTempDialogOpen(true);
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Asignar contraseña temporal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
          </div>
          <div className="flex items-center space-x-2">
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Eliminará permanentemente la
              cuenta de usuario y sus datos de nuestros servidores.
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

      {/* Asignar contraseña temporal a mano */}
      <Dialog open={tempDialogOpen} onOpenChange={setTempDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar contraseña temporal</DialogTitle>
            <DialogDescription>
              La escribís vos y se la entregás directamente a {tempUser?.nombre ?? "la persona"}.
              Al entrar, el sistema le va a pedir que elija una nueva.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="tempPass">Contraseña temporal</Label>
              <div className="flex gap-2">
                <Input
                  id="tempPass"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="off"
                />
                <Button type="button" variant="outline" onClick={sugerirPassword}>
                  Sugerir
                </Button>
              </div>
              <p className={`text-xs ${tempPassword.trim().length >= 8 || !tempPassword ? "text-muted-foreground" : "text-red-600"}`}>
                Al menos 8 caracteres. La sugerencia evita letras y números que se
                confunden al dictarlos (i, l, o, 0, 1).
              </p>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Si esta persona tiene un enlace de restablecimiento pendiente, se anula:
              de lo contrario, abrirlo después pisaría esta contraseña.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTempDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmTempPassword}
              disabled={tempPassword.trim().length < 8 || tempEnviando}
            >
              {tempEnviando ? "Guardando…" : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <AlertDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              Se le enviará por WhatsApp —y por correo si tiene— un enlace para que
              elija su propia contraseña. Sirve una sola vez y vence a los 30 minutos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>
              Enviar Enlace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
