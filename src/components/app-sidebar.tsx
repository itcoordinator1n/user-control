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
} from "@/components/ui/sidebar";
import Link from "next/link";

// ---------------- Types ----------------
type SubItem = { title: string; url: string; id: string };
type NavItem = { title: string; icon: React.ElementType; url?: string; id: string; subItems?: SubItem[] };

// ---------------- Data base (sin filtro) ----------------
const sidebarNavigation: NavItem[] = [
  {
    title: "Perfil",
    icon: User,
    id: "perfil",
    subItems: [{ title: "Historial de marcaje", url: "/page/profile", id: "perfil-historial" }],
  },
  {
    title: "Recursos Humanos",
    icon: Users,
    id: "recursos-humanos",
    subItems: [
      { title: "Solicitudes", url: "/page/applications", id: "rh-aplicaciones" },
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
    title: "Metricas",
    icon: BarChart3,
    id: "metricas",
    subItems: [{ title: "Dashboard", url: "/page/dashboard", id: "metricas-dashboard" }],
  },
  {
    title: "Cerrar Sesión",
    icon: LogOut,
    url: "#/logout",
    id: "logout",
  },
];

// ---------------- Mapa de permisos por ruta ----------------
// ajusta aquí si agregas nuevas rutas
const routePermission: Record<string, string> = {
  "/page/profile": "EMPLOYEE:PROFILE",
  "/page/vacations-permits": "EMPLOYEE:PERMITS",
  "/page/dashboard": "RRHH:DASHBOARD",
  "/page/admin": "ADMIN:VIEW",
  "/page/applications": "BOSS:APPLICATIONS",
};

export function AppSidebar() {
  const { data: session, status } = useSession();
  const userPerms = (session?.user as any)?.permissions ?? [];

  // helpers
  const hasPerm = (required?: string) => !required || userPerms.includes(required);

  // 1) Filtra subItems por permisos; conserva "Cerrar Sesión" siempre
  const filteredNav: NavItem[] = useMemo(() => {
    return sidebarNavigation
      .map((item) => {
        if (!item.subItems) return item; // items simples (logout)
        const visibleSubs = item.subItems.filter((s) => hasPerm(routePermission[s.url]));
        if (visibleSubs.length === 0) return { ...item, subItems: [] };
        return { ...item, subItems: visibleSubs };
      })
      .filter((item) => {
        if (!item.subItems) return true; // deja logout
        return item.subItems.length > 0; // oculta secciones vacías
      });
  }, [userPerms]);

  // 2) Estado UI (expand/activo) con defaults basados en lo visible
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeSubsection, setActiveSubsection] = useState<string>("");

  useEffect(() => {
    // expandir la primera sección visible y seleccionar su primer subitem
    const firstSection = filteredNav.find((i) => i.subItems && i.subItems.length > 0);
    if (firstSection?.id) {
      setExpandedSections((prev) => ({ ...prev, [firstSection.id]: true }));
      if (!activeSubsection && firstSection.subItems) {
        setActiveSubsection(firstSection.subItems[0].id);
      }
    }
  }, [filteredNav]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = (sectionId: string) =>
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const handleSubsectionClick = (subsectionId: string) => setActiveSubsection(subsectionId);

  const user = {
    name: session?.user?.name ?? "Usuario",
    title: "Tecnologías de la Información (TI)",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: (session?.user?.name?.split(" ").map((n) => n[0]).join("") || "US").slice(0, 2).toUpperCase(),
  };

  return (
    <Sidebar className="bg-infarma-light-blue border-r border-gray-200">
      <SidebarHeader className="flex justify-center py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full bg-white text-infarma-blue hover:bg-white/90"
          asChild
        >
          <a href="/page/profile">
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
            {/* Estado de carga opcional */}
            {status === "loading" ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Cargando menú…</div>
            ) : (
              <SidebarMenu>
                {filteredNav.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    {item.subItems ? (
                      <div className="w-full">
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
                                  <Link
                                    href={subItem.url}
                                    onClick={() => handleSubsectionClick(subItem.id)}
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
                      // Item simple (e.g., Cerrar Sesión)
                      <Link
                        href={item.url as string}
                        className="flex items-center gap-2 rounded-md p-2 text-infarma-blue hover:bg-white/50 transition-all duration-200"
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
