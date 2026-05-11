export interface PermissionDefinition {
  id: string;          // El identificador único (ej: "USER:CREATE")
  label: string;       // Nombre legible
  description: string; // Qué permite hacer
  backendId?: number;  // ID numérico opcional para mapeo con DB actual
}

export interface PermissionModule {
  name: string;
  icon: string;
  permissions: PermissionDefinition[];
}

export const SYSTEM_PERMISSIONS: PermissionModule[] = [
  {
    name: "Gestión de Usuarios",
    icon: "Users",
    permissions: [
      { id: "USER:READ", label: "Ver Usuarios", description: "Ver el listado y detalles de empleados" },
      { id: "USER:CREATE", label: "Crear Usuarios", description: "Registrar nuevos empleados en el sistema" },
      { id: "USER:UPDATE", label: "Editar Usuarios", description: "Modificar información de empleados" },
      { id: "USER:DELETE", label: "Eliminar Usuarios", description: "Dar de baja usuarios del sistema" },
      { id: "USER:PASSWORD", label: "Cambiar Contraseña", description: "Permitir al usuario cambiar su propia clave" },
      { id: "USER:CREDENTIALS", label: "Gestionar Credenciales", description: "Administrar accesos y métodos de autenticación" },
      { id: "USER:ROLES", label: "Asignar Roles", description: "Modificar los roles asignados a los usuarios" },
    ],
  },
  {
    name: "Gestión de Roles",
    icon: "Shield",
    permissions: [
      { id: "ROLE:VIEW", label: "Ver Roles", description: "Visualizar la lista de roles" },
      { id: "ROLE:CREATE", label: "Crear Roles", description: "Definir nuevos roles de acceso" },
      { id: "ROLE:UPDATE", label: "Editar Roles", description: "Modificar permisos de roles existentes" },
      { id: "ROLE:DELETE", label: "Eliminar Roles", description: "Remover roles (solo si no tienen usuarios)" },
      { id: "ROLE:ASSIGN", label: "Asignar Roles", description: "Asignar roles a usuarios desde la gestión de roles" },
    ],
  },
  {
    name: "Recursos Humanos (RRHH)",
    icon: "Heart",
    permissions: [
      { id: "RRHH:PERMITS_VIEW", label: "Ver Mis Permisos", description: "Ver historial personal de permisos y vacaciones" },
      { id: "RRHH:PERMITS_REQUEST", label: "Solicitar Permisos", description: "Enviar solicitudes de vacaciones o permisos laborales" },
      { id: "RRHH:APPLICATIONS_MANAGE", label: "Gestionar Solicitudes", description: "Aprobar o rechazar solicitudes de subordinados" },
      { id: "RRHH:ADMIN", label: "Configuración RRHH", description: "Configurar tipos de permisos, días de vacaciones y feriados" },
    ],
  },
  {
    name: "Soporte IT (Tickets)",
    icon: "Ticket",
    permissions: [
      { id: "TICKET:READ", label: "Ver Tickets", description: "Acceso al listado general de tickets de soporte" },
      { id: "TICKET:CREATE", label: "Crear Ticket", description: "Abrir nuevas solicitudes de soporte o mejora" },
      { id: "TICKET:RESPOND", label: "Responder Tickets", description: "Añadir comentarios y respuestas técnicas a casos" },
      { id: "TICKET:ASSIGN", label: "Asignar Técnicos", description: "Delegar tickets a miembros del equipo técnico" },
      { id: "TICKET:RESOLVE", label: "Resolver/Cerrar", description: "Marcar tickets como resueltos o cerrados" },
      { id: "TICKET:KNOWLEDGE", label: "Base de Conocimiento", description: "Gestionar artículos de ayuda y soluciones frecuentes" },
      { id: "TICKET:ADMIN", label: "Configuración IT", description: "Configurar categorías, prioridades y SLAs de soporte" },
    ],
  },
  {
    name: "Métricas y Dashboards",
    icon: "BarChart3",
    permissions: [
      { id: "METRICS:GENERAL", label: "Dashboard Principal", description: "Acceso al tablero de control general de la empresa" },
      { id: "METRICS:TICKETS", label: "Métricas de Soporte", description: "Ver KPIs de resolución y tiempos de respuesta IT" },
      { id: "METRICS:PRODUCTION", label: "Métricas de Producción", description: "Ver eficiencia y cumplimiento de metas de planta" },
      { id: "METRICS:SALES", label: "Métricas de Precios", description: "Ver tendencias de precios y comparación competitiva" },
    ],
  },
  {
    name: "Comparación de Precios",
    icon: "ArrowLeftRight",
    permissions: [
      { id: "COMPARISON:VIEW", label: "Ver Comparaciones", description: "Visualizar tablas comparativas de precios por cadena" },
      { id: "COMPARISON:MANAGE", label: "Gestionar Listas", description: "Crear, editar y organizar listas de comparación" },
      { id: "COMPARISON:EXPORT", label: "Exportar Datos", description: "Descargar reportes en Excel o PDF" },
    ],
  },
  {
    name: "Catálogo de Productos",
    icon: "Package",
    permissions: [
      { id: "PRODUCT:READ", label: "Ver Catálogo", description: "Listado de productos y categorías del sistema" },
      { id: "PRODUCT:CREATE", label: "Añadir Productos", description: "Registrar nuevos productos en el catálogo" },
      { id: "PRODUCT:UPDATE", label: "Editar Productos", description: "Modificar información de productos existentes" },
      { id: "PRODUCT:DELETE", label: "Eliminar Productos", description: "Remover productos del sistema" },
    ],
  },
  {
    name: "Producción",
    icon: "Factory",
    permissions: [
      { id: "PROD:VIEW", label: "Ver Registros", description: "Visualizar el historial de tiempos de producción" },
      { id: "PROD:REGISTER", label: "Registrar Tiempos", description: "Iniciar y detener cronómetros de actividades" },
      { id: "PROD:ADMIN", label: "Configurar Planta", description: "Gestionar grupos, estaciones y metas de producción" },
    ],
  },
  {
    name: "Marketing",
    icon: "Megaphone",
    permissions: [
      { id: "MARKETING:DASHBOARD", label: "Tablero Marketing", description: "Acceso a indicadores clave de marketing" },
    ],
  },
  {
    name: "Auditoría",
    icon: "Search",
    permissions: [
      { id: "AUDIT:ALL", label: "Ver Todo", description: "Ver todos los registros de auditoría del sistema" },
      { id: "AUDIT:AREA", label: "Ver por Área", description: "Ver auditoría solo de su área asignada" },
    ],
  },
];

/**
 * Utilidad para obtener un permiso por su ID (slug)
 */
export const getPermissionById = (id: string) => {
  for (const module of SYSTEM_PERMISSIONS) {
    const found = module.permissions.find(p => p.id === id);
    if (found) return found;
  }
  return null;
};

/**
 * Mapea los permisos que vienen del backend (con IDs numéricos y nombres crudos)
 * a nuestra estructura granular.
 */
export const mapBackendPermissions = (backendModules: any[]) => {
  // Esta función servirá para vincular lo que devuelve el API con nuestro SYSTEM_PERMISSIONS
  // Por ahora devolvemos SYSTEM_PERMISSIONS enriquecido si hay coincidencia
  return SYSTEM_PERMISSIONS.map(module => ({
    ...module,
    permissions: module.permissions.map(p => {
      // Buscar en el backend si existe este permiso por nombre o similar
      // (Lógica de mapeo real aquí)
      return p;
    })
  }));
};

