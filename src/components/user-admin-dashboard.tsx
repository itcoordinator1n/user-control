"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/user-management"
import { RoleManagement } from "@/components/role-management"
import { AuditLog } from "@/components/audit-log"
import { DashboardHeader } from "@/components/dashboard-header"

import { useSession } from "next-auth/react"
import { hasPerm } from "@/lib/auth"

export function UserAdminDashboard() {
  const { data: session } = useSession()
  const user = session?.user as any
  
  const [activeTab, setActiveTab] = useState(() => {
    if (hasPerm(user, 'admin', 'USER:READ')) return "users"
    if (hasPerm(user, 'admin', 'ROLE:VIEW')) return "roles"
    if (hasPerm(user, 'admin', 'AUDIT:AREA')) return "audit"
    return "users"
  })

  const canViewUsers = hasPerm(user, 'admin', 'USER:READ')
  const canViewRoles = hasPerm(user, 'admin', 'ROLE:VIEW')
  const canViewAudit = hasPerm(user, 'admin', 'AUDIT:AREA') || hasPerm(user, 'admin', 'AUDIT:ALL')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <DashboardHeader />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {canViewUsers && <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>}
          {canViewRoles && <TabsTrigger value="roles">Gestión de Roles</TabsTrigger>}
          {canViewAudit && <TabsTrigger value="audit">Registro de Auditoría</TabsTrigger>}
        </TabsList>
        
        {canViewUsers && (
          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>
        )}
        
        {canViewRoles && (
          <TabsContent value="roles" className="space-y-4">
            <RoleManagement />
          </TabsContent>
        )}
        
        {canViewAudit && (
          <TabsContent value="audit" className="space-y-4">
            <AuditLog />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

