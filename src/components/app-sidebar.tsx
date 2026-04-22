"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Users,
  HandCoins,
  Ticket,
  Factory,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";

// ---------------- Types ----------------
type SubItem = { title: string; url: string; id: string };
type NavItem = {
  title: string;
  icon: React.ElementType;
  url?: string;
  id: string;
  subItems?: SubItem[];
};

// ---------------- Data base (sin filtro) ----------------
const sidebarNavigation: NavItem[] = [
  {
    title: "Perfil",
    icon: User,
    id: "perfil",
    subItems: [
      {
        title: "Historial de marcaje",
        url: "/page/profile",
        id: "perfil-historial",
      },
    ],
  },
  {
    title: "Recursos Humanos",
    icon: Users,
    id: "recursos-humanos",
    subItems: [
      {
        title: "Solicitudes",
        url: "/page/applications",
        id: "rh-aplicaciones",
      },
      { title: "Permisos", url: "/page/vacations-permits", id: "rh-permits" },
    ],
  },
  {
    title: "Sistemas / TI",
    icon: Settings,
    id: "sistemas-ti",
    subItems: [{ title: "Usuarios", url: "/page/admin", id: "ti-usuarios" }],
  },
  {
    title: "Mercadeo",
    icon: HandCoins,
    id: "mercadeo",
    subItems: [
      {
        title: "Dashboard",
        url: "/page/marketingDashboard",
        id: "mercadeo-dashboard",
      },
      {
        title: "Comparacion Por fechas",
        url: "/page/comparisonByDates",
        id: "mercadeo-fechas",
      },
      {
        title: "Comparacion Por cadena",
        url: "/page/comparisonTable",
        id: "mercadeo-cadenas",
      },
      {
        title: "Comparaciones",
        url: "/page/comparison",
        id: "mercadeo-comparaciones",
      },
      {
        title: "Productos",
        url: "/page/products",
        id: "mercadeo-productos",
      },
    ],
  },
  {
    title: "Soporte IT",
    icon: Ticket,
    id: "soporte-it",
    subItems: [
      { title: "Mis tickets",       url: "/page/tickets",       id: "tickets-portal" },
      { title: "Tablero técnico",   url: "/page/tech",          id: "tickets-tech" },
      { title: "Administración IT", url: "/page/ticket-admin",  id: "tickets-admin" },
      { title: "Gerencia",          url: "/page/ticket-mgmt",   id: "tickets-mgmt" },
    ],
  },
  {
    title: "Producción",
    icon: Factory,
    id: "produccion",
    subItems: [
      { title: "Control de tiempos", url: "/page/produccion/control-tiempos", id: "produccion-tiempos" },
    ],
  },
  {
    title: "Metricas",
    icon: BarChart3,
    id: "metricas",
    subItems: [
      { title: "Dashboard", url: "/page/dashboard", id: "metricas-dashboard" },
    ],
  },
  {
    title: "Cerrar Sesión",
    icon: LogOut,
    url: "#/logout",
    id: "logout",
  },
];

// ---------------- Mapa de permisos por ruta ----------------
const routePermission: Record<string, string> = {
  "/page/profile":         "EMPLOYEE:PROFILE",
  "/page/vacations-permits": "EMPLOYEE:PERMITS",
  "/page/dashboard":       "RRHH:DASHBOARD",
  "/page/admin":           "ADMIN:VIEW",
  "/page/applications":    "BOSS:APPLICATIONS",
  "/page/tech":            "TICKET:TECH",
  "/page/ticket-admin":    "TICKET:ADMIN",
  "/page/ticket-mgmt":     "TICKET:MGMT",
  "/page/vacations-permits/application": "EMPLOYEE:PERMITS",

  // Rutas de Produccion
  "/page/produccion/control-tiempos": "PRODUCCION:TIEMPOS",
};

export function AppSidebar() {
  const { data: session, status } = useSession();
  const { setOpenMobile } = useSidebar();
  const userPerms = useMemo(() => (session?.user as any)?.permissions ?? [], [session]);

  const hasPerm = (required?: string) =>
    !required || userPerms.includes(required);

  const filteredNav: NavItem[] = useMemo(() => {
    return sidebarNavigation
      .map((item) => {
        if (!item.subItems) return item;
        const visibleSubs = item.subItems.filter((s) =>
          hasPerm(routePermission[s.url]),
        );
        if (visibleSubs.length === 0) return { ...item, subItems: [] };
        return { ...item, subItems: visibleSubs };
      })
      .filter((item) => {
        if (!item.subItems) return true;
        return item.subItems.length > 0;
      });
  }, [userPerms]);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [activeSubsection, setActiveSubsection] = useState<string>("");

  useEffect(() => {
    const firstSection = filteredNav.find(
      (i) => i.subItems && i.subItems.length > 0,
    );
    if (firstSection?.id) {
      setExpandedSections((prev) => ({ ...prev, [firstSection.id]: true }));
      if (!activeSubsection && firstSection.subItems) {
        setActiveSubsection(firstSection.subItems[0].id);
      }
    }
  }, [filteredNav]);

  const toggleSection = (sectionId: string) =>
    setExpandedSections((prev) => ({ [sectionId]: !prev[sectionId] }));

  const handleSubsectionClick = (subsectionId: string) => {
    setActiveSubsection(subsectionId);
    setOpenMobile(false);
  };

  const user = {
    name: session?.user?.name ?? "Usuario",
    title: "Tecnologías de la Información (TI)",
    avatar: undefined,
    initials: (
      session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "US"
    )
      .slice(0, 2)
      .toUpperCase(),
  };

  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border transition-colors duration-300">
      <SidebarHeader className="flex justify-center py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-background text-primary hover:bg-muted"
          asChild
        >
          <a href="/page/profile" onClick={() => setOpenMobile(false)}>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.avatar}
                alt={user.name}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Profile</span>
          </a>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {status === "loading" ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Cargando menú…
              </div>
            ) : (
              <SidebarMenu>
                {filteredNav.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    {item.subItems ? (
                      <div className="w-full">
                        <button
                          onClick={() => toggleSection(item.id)}
                          className="flex w-full items-center justify-between rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span className="font-medium">{item.title}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              expandedSections[item.id]
                                ? "rotate-0"
                                : "-rotate-90"
                            }`}
                          />
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedSections[item.id]
                              ? "max-h-96 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.id}>
                                <SidebarMenuSubButton
                                  asChild
                                  className={`text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 ${
                                    activeSubsection === subItem.id
                                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                      : ""
                                  }`}
                                >
                                  <Link
                                    href={subItem.url}
                                    onClick={() =>
                                      handleSubsectionClick(subItem.id)
                                    }
                                  >
                                    {subItem.title}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.url as string}
                        onClick={() => setOpenMobile(false)}
                        className="flex items-center gap-2 rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
