"use client"

import type React from "react"

import { useState } from "react"
import {
  BarChart3,
  Box,
  Building2,
  ChevronDown,
  LineChart,
  LogOut,
  Receipt,
  Settings,
  Users,
  Warehouse,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// Define the sidebar navigation structure
type SubItem = {
  title: string
  url: string
  id: string
}

type NavItem = {
  title: string
  icon: React.ElementType
  url?: string
  id: string
  subItems?: SubItem[]
}

const sidebarNavigation: NavItem[] = [
  {
    title: "Recursos Humanos",
    icon: Users,
    id: "recursos-humanos",
    subItems: [
      { title: "Empleados", url: "#/rh/empleados", id: "rh-empleados" },
      { title: "Asistencias", url: "#/rh/asistencias", id: "rh-asistencias" },
      { title: "Vacaciones", url: "#/rh/vacaciones", id: "rh-vacaciones" },
      { title: "Permisos", url: "#/rh/permisos", id: "rh-permisos" },
    ],
  },
  {
    title: "Área Administrativa",
    icon: Building2,
    id: "area-administrativa",
    subItems: [
      { title: "Documentos", url: "#/admin/documentos", id: "admin-documentos" },
      { title: "Solicitudes", url: "#/admin/solicitudes", id: "admin-solicitudes" },
    ],
  },
  {
    title: "Sistemas / TI",
    icon: Settings,
    id: "sistemas-ti",
    subItems: [
      { title: "Infraestructura", url: "#/ti/infraestructura", id: "ti-infraestructura" },
      { title: "Soporte Técnico", url: "#/ti/soporte", id: "ti-soporte" },
      { title: "Inventario TI", url: "#/ti/inventario", id: "ti-inventario" },
    ],
  },
  {
    title: "Planta (Producción)",
    icon: Box,
    id: "planta-produccion",
    subItems: [
      { title: "Órdenes de Producción", url: "#/produccion/ordenes", id: "produccion-ordenes" },
      { title: "Control de Calidad", url: "#/produccion/calidad", id: "produccion-calidad" },
    ],
  },
  {
    title: "Contabilidad",
    icon: Receipt,
    id: "contabilidad",
    subItems: [
      { title: "Facturas", url: "#/contabilidad/facturas", id: "contabilidad-facturas" },
      { title: "Estados Financieros", url: "#/contabilidad/estados", id: "contabilidad-estados" },
      { title: "Cuentas por Pagar", url: "#/contabilidad/cuentas", id: "contabilidad-cuentas" },
    ],
  },
  {
    title: "Mercadeo y Marketing",
    icon: LineChart,
    id: "mercadeo-marketing",
    subItems: [
      { title: "Campañas", url: "#/marketing/campanas", id: "marketing-campanas" },
      { title: "Redes Sociales", url: "#/marketing/redes", id: "marketing-redes" },
      { title: "Reportes", url: "#/marketing/reportes", id: "marketing-reportes" },
    ],
  },
  {
    title: "Bodega",
    icon: Warehouse,
    id: "bodega",
    subItems: [
      { title: "Inventario", url: "#/bodega/inventario", id: "bodega-inventario" },
      { title: "Entradas/Salidas", url: "#/bodega/movimientos", id: "bodega-movimientos" },
    ],
  },
  {
    title: "Gerencia",
    icon: BarChart3,
    id: "gerencia",
    subItems: [
      { title: "Dashboard", url: "#/gerencia/dashboard", id: "gerencia-dashboard" },
      { title: "Reportes Ejecutivos", url: "#/gerencia/reportes", id: "gerencia-reportes" },
    ],
  },
  {
    title: "Cerrar Sesión",
    icon: LogOut,
    url: "#/logout",
    id: "logout",
  },
]

export function AppSidebar() {
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "recursos-humanos": true, // Default first section open
  })

  // Track the active subsection
  const [activeSubsection, setActiveSubsection] = useState<string>("rh-empleados")

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const handleSubsectionClick = (subsectionId: string) => {
    setActiveSubsection(subsectionId)
  }

  const user = {
    name: "ANIBAL ALEJANDRO REYES",
    title: "Tecnologías de la Información (TI)",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "AA",
  }

  return (
    <Sidebar className="bg-infarma-light-blue border-r border-gray-200">
      <SidebarHeader className="flex justify-center py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white text-infarma-blue hover:bg-white/90"
          asChild
        >
          <a href="#/profile">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-[#7BA7C7] text-white">{user.initials}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Profile</span>
          </a>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarNavigation.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {item.subItems ? (
                    <div className="w-full">
                      {/* Clickable section header */}
                      <button
                        onClick={() => toggleSection(item.id)}
                        className="flex w-full items-center justify-between rounded-md p-2 text-infarma-blue hover:bg-white/50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            expandedSections[item.id] ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </button>

                      {/* Subsection items with animation */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedSections[item.id] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.id}>
                              <SidebarMenuSubButton
                                asChild
                                className={`text-infarma-blue hover:bg-white/50 transition-all duration-200 ${
                                  activeSubsection === subItem.id ? "bg-white font-medium text-infarma-blue" : ""
                                }`}
                              >
                                <a
                                  href={subItem.url}
                                  onClick={(e) => {
                                    e.preventDefault() // Prevent actual navigation for demo
                                    handleSubsectionClick(subItem.id)
                                  }}
                                >
                                  {subItem.title}
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={item.url}
                      className="flex items-center gap-2 rounded-md p-2 text-infarma-blue hover:bg-white/50 transition-all duration-200"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
