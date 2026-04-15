"use client";

import { LogOut, Settings, User, Moon, Sun, Shield, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
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
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  position: string;
  creationDate: string;
  area: string;
  country: string;
  supervisorName: string;
  supervisorArea: string;
  supervisorPosition: string;
}

export function UserAvatarMenu() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.accessToken) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/profile_info`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al obtener el perfil");
          return res.json();
        })
        .then((data: UserProfile) => {
          setProfile(data);
        })
        .catch((err: Error) => console.error(err.message))
        .finally(() => setLoading(false));
    }
  }, [session]);

  const initials = profile?.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "US";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/page/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-auto px-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-muted transition-all duration-200 rounded-xl"
        >
          <Avatar className="h-9 w-9 border-2 border-infarma-blue/10">
            <AvatarImage src={undefined} alt={profile?.name || "Usuario"} />
            <AvatarFallback className="bg-infarma-blue text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-semibold text-foreground line-clamp-1 max-w-[150px]">
              {profile?.name || "Cargando..."}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {profile?.area || "..."}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 mt-2 p-2 shadow-xl border-border bg-popover rounded-xl" align="end" forceMount>
        <DropdownMenuLabel className="p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold text-foreground">{profile?.name}</p>
            <p className="text-xs text-muted-foreground font-medium">{profile?.position}</p>
            <p className="text-[10px] text-muted-foreground/70">{profile?.country}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2 bg-border" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground">
            <Link href="/page/profile" className="flex items-center py-2">
              <User className="mr-3 h-4 w-4" />
              <span className="font-medium">Mi Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground">
            <Link href="/page/admin" className="flex items-center py-2">
              <Shield className="mr-3 h-4 w-4" />
              <span className="font-medium">Administración</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground">
            <Link href="#" className="flex items-center py-2">
              <Settings className="mr-3 h-4 w-4" />
              <span className="font-medium">Configuración</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2 bg-border" />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer rounded-lg flex justify-between items-center py-2 focus:bg-accent focus:text-accent-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <div className="flex items-center">
              {theme === "dark" ? <Sun className="mr-3 h-4 w-4 text-accent" /> : <Moon className="mr-3 h-4 w-4 text-primary" />}
              <span className="font-medium">Cambiar Tema</span>
            </div>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground capitalize">
              {theme === "dark" ? "Oscuro" : "Claro"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground">
            <Link href="#" className="flex items-center py-2">
              <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Soporte</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2 bg-border" />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive py-2 font-semibold"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
