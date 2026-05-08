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
                          Restablecer Contraseña
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

      {/* Reset Password Dialog */}
      <AlertDialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              Esto enviará un enlace para restablecer la contraseña al correo
              electrónico del usuario. Podrán establecer una nueva contraseña.
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
