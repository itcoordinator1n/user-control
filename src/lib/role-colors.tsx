export const roleColors = {
    TI: {
      color: "blue",
      roles: ["Administrador de Sistemas", "Desarrollador", "Analista de Datos"],
    },
    RRHH: {
      color: "green",
      roles: ["Gerente de RRHH", "Reclutador", "Especialista en Compensaciones"],
    },
    Finanzas: {
      color: "yellow",
      roles: ["Contador", "Analista Financiero", "Auditor"],
    },
    Marketing: {
      color: "purple",
      roles: ["Gerente de Marketing", "Especialista en Redes Sociales", "Diseñador Gráfico"],
    },
    Operaciones: {
      color: "orange",
      roles: ["Gerente de Operaciones", "Supervisor de Logística", "Analista de Procesos"],
    },
  }
  
  export type AreaColor = keyof typeof roleColors
  
  export function getRoleColor(role: string): string {
    for (const [area, data] of Object.entries(roleColors)) {
      if (data.roles.includes(role)) {
        return data.color
      }
    }
    return "gray" // Color por defecto si no se encuentra el rol
  }
  
  export function getAreaFromRole(role: string): string {
    for (const [area, data] of Object.entries(roleColors)) {
      if (data.roles.includes(role)) {
        return area
      }
    }
    return "Sin área asignada"
  }
  
  