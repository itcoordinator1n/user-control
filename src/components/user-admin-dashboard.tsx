"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/user-management"
import { RoleManagement } from "@/components/role-management"
import { AuditLog } from "@/components/audit-log"
import { DashboardHeader } from "@/components/dashboard-header"

export function UserAdminDashboard() {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <DashboardHeader />
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Gestión de Roles</TabsTrigger>
          <TabsTrigger value="audit">Registro de Auditoría</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
        <TabsContent value="roles" className="space-y-4">
          <RoleManagement />
        </TabsContent>
        <TabsContent value="audit" className="space-y-4">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  )
}

