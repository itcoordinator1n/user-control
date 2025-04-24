"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { BarChart3, Calendar, Clock, FileText, Home, LogOut, Menu, Settings, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6" />
          <span className="text-lg font-semibold">AsistenciaLaboral</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Supervisor" />
            <AvatarFallback>SV</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <div className="text-sm font-medium">Carlos Rodríguez</div>
            <div className="text-xs text-muted-foreground">Supervisor de Recursos Humanos</div>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-muted/40 md:block">
          <DesktopSidebar />
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

function MobileSidebar() {
  return (
    <div className="flex h-full flex-col bg-muted/40">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Clock className="h-6 w-6" />
        <span className="text-lg font-semibold">AsistenciaLaboral</span>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          <SidebarItems />
        </nav>
      </div>
    </div>
  )
}

function DesktopSidebar() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="px-2 py-4">
        <nav className="grid items-start gap-1 text-sm font-medium">
          <SidebarItems />
        </nav>
      </div>
    </div>
  )
}

function SidebarItems() {
  return (
    <>
      <Link
        href="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <Home className="h-4 w-4" />
        Inicio
      </Link>
      <Link href="#" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-all">
        <FileText className="h-4 w-4" />
        Solicitudes
      </Link>
      <Link
        href="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <Calendar className="h-4 w-4" />
        Calendario
      </Link>
      <Link
        href="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <Users className="h-4 w-4" />
        Empleados
      </Link>
      <Link
        href="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <BarChart3 className="h-4 w-4" />
        Estadísticas
      </Link>
      <Link
        href="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <Settings className="h-4 w-4" />
        Configuración
      </Link>
      <Link
        href="#"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      >
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </Link>
    </>
  )
}

