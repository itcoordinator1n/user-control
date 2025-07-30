"use client"

import { ChevronDown, Menu, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react";

interface NavbarProps {
  isLoggedIn: boolean
}

export function Navbar({ isLoggedIn }: NavbarProps) {

   interface UserProfile {
    id: number;
    name: string;
    position: string;
    creationDate: string;
    area: string;
    country: string;
    supervisorName: string;
    supervisorArea:string;
    supervisorPosition:string;
  }
  
  const { theme, setTheme } = useTheme()
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    useEffect(() => {
      // Asegúrate de que el token esté disponible
      if (session?.user?.accessToken) {
        fetch("http://137.184.62.130:3000/api/profile/profile_info", {
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
            console.log("Informacion del perfil", data)
            setProfile(data);
          })
          .catch((err: Error) => console.log(err.message));
      }
    }, [session]);
  const palabras = profile?.name.trim().split(/\s+/);
  // Toma la primera letra de las dos primeras palabras
  const iniciales = palabras?.slice(0, 2).map(p => p[0]).join('');
  const userName = iniciales?.toUpperCase();

  const user = {
    name: "ANIBAL ALEJANDRO REYES",
    title: "Tecnologías de la Información (TI)",
    email: "anibal@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "AA",
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-950 dark:border-gray-800 transition-colors duration-300">
      <div className="container flex h-16 items-center">
        {/* Mobile menu trigger for non-logged-in users */}
        {!isLoggedIn && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 md:hidden text-infarma-blue dark:text-white">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white dark:bg-gray-950">
              <nav className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                  <span className="font-bold text-infarma-blue dark:text-white text-2xl">infarma</span>
                </div>
                {/*
                <div className="flex flex-col gap-2">
                  <Link
                    href="#"
                    className="block px-2 py-1 text-lg font-medium hover:text-infarma-blue dark:hover:text-blue-400"
                  >
                    Products
                  </Link>
                  <Link
                    href="#"
                    className="block px-2 py-1 text-lg font-medium hover:text-infarma-blue dark:hover:text-blue-400"
                  >
                    About Us
                  </Link>
                  <Link
                    href="#"
                    className="block px-2 py-1 text-lg font-medium hover:text-infarma-blue dark:hover:text-blue-400"
                  >
                    Contact
                  </Link>
                </div>
                
                */}
                <div className="mt-4 px-2">
                  <Link href={"/page/login"} className="w-full bg-infarma-button-blue hover:bg-infarma-button-blue/90">
                    Iniciar sesion 
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {/* Sidebar trigger for logged-in users */}
        {isLoggedIn && <SidebarTrigger className="mr-2 text-infarma-blue dark:text-white" />}

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-infarma-blue dark:text-white text-2xl transition-colors duration-300">
            infarma
          </span>
        </div>

        {/* Desktop Navigation for non-logged-in users */}
        {!isLoggedIn && (
          <NavigationMenu className="mx-6 hidden md:flex">
            {/* 
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="#"
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:text-infarma-blue dark:hover:text-blue-400 focus:text-infarma-blue focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-infarma-blue data-[state=open]:text-infarma-blue dark:text-white"
                  >
                    Products
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="#"
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:text-infarma-blue dark:hover:text-blue-400 focus:text-infarma-blue focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-infarma-blue data-[state=open]:text-infarma-blue dark:text-white"
                  >
                    About Us
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="#"
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:text-infarma-blue dark:hover:text-blue-400 focus:text-infarma-blue focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:text-infarma-blue data-[state=open]:text-infarma-blue dark:text-white"
                  >
                    Contact
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
            
            */}
          </NavigationMenu>
        )}

        {/* Right side content */}
        <div className="ml-auto flex items-center gap-2">
          {!isLoggedIn ? (
           
            <Link href="/page/login" className="w-full bg-infarma-button-blue hover:bg-infarma-button-blue/90">
                    Iniciar sesion
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-auto px-2 text-infarma-blue dark:text-white transition-all duration-200"
                >
                  <Avatar className="h-10 w-10 bg-[#7BA7C7] text-white">
                    <AvatarImage src={userName || "/placeholder.svg"} alt={userName} />
                    <AvatarFallback>{userName}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2 hidden flex-col items-start text-left sm:flex">
                    <span className="text-sm font-medium">{profile?.name}</span>
                    <span className="text-xs text-infarma-text-gray dark:text-gray-400">{profile?.area}</span>
                  </div>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{profile?.country}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="#/profile" className="flex w-full">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex justify-between items-center">
                  <span>Change Theme</span>
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="ml-auto flex h-5 w-5 items-center justify-center"
                  >
                    {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={()=>signOut()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
