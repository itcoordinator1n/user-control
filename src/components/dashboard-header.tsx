import { Shield } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Administración de Usuarios</h1>
      </div>
      <p className="text-muted-foreground">Gestiona usuarios, roles y acceso al sistema</p>
    </div>
  )
}

