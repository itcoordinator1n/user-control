import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
interface UserAvatarMenuProps {
  name: string;
  role: string;
  avatarSrc?: string;
  initials?: string;
}

export function UserAvatarMenu({
  name,
  role,
  avatarSrc,
  initials = "SV",
}: UserAvatarMenuProps) {
  interface UserProfile {
    id: number;
    name: string;
    position: string;
    creationDate: string;
    area: string;
    country: string;
  }
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Asegúrate de que el token esté disponible
    if (session?.user?.accessToken) {
      fetch("http://10.103.1.88:3000/api/profile/profile_info", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Error al obtener el perfil");
          }
          return res.json();
        })
        .then((data: UserProfile) => {
          setProfile(data);
        })
        .catch((err: Error) => setError(err.message));
    }
  }, [session]);

  const palabras = profile?.name.trim().split(/\s+/);
  // Toma la primera letra de las dos primeras palabras
  const iniciales = palabras?.slice(0, 2).map(p => p[0]).join('');
  const userName = iniciales?.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="ml-auto flex cursor-pointer items-center gap-4">
          <Avatar>
            <AvatarImage
              src={avatarSrc || "/placeholder.svg?height=32&width=32"}
              alt={name}
            />
            <AvatarFallback>{userName}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <div className="text-sm font-medium">{profile?.name}</div>
            <div className="text-xs text-muted-foreground">{profile?.area}</div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile?.area}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/perfil">
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/configuracion">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
