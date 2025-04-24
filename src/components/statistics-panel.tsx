"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample data for charts
const monthlyData = [
  { name: "Ene", vacaciones: 12, permisos: 8 },
  { name: "Feb", vacaciones: 8, permisos: 10 },
  { name: "Mar", vacaciones: 5, permisos: 12 },
  { name: "Abr", vacaciones: 7, permisos: 9 },
  { name: "May", vacaciones: 10, permisos: 7 },
  { name: "Jun", vacaciones: 15, permisos: 5 },
  { name: "Jul", vacaciones: 20, permisos: 8 },
  { name: "Ago", vacaciones: 18, permisos: 6 },
  { name: "Sep", vacaciones: 12, permisos: 9 },
  { name: "Oct", vacaciones: 8, permisos: 11 },
  { name: "Nov", vacaciones: 6, permisos: 10 },
  { name: "Dic", vacaciones: 22, permisos: 4 },
]

const statusData = [
  { name: "Aprobadas", value: 68, color: "#4ade80" },
  { name: "Rechazadas", value: 12, color: "#f87171" },
  { name: "Pendientes", value: 20, color: "#fbbf24" },
]

const departmentData = [
  { name: "Marketing", vacaciones: 25, permisos: 15 },
  { name: "Tecnología", vacaciones: 30, permisos: 22 },
  { name: "Ventas", vacaciones: 20, permisos: 18 },
  { name: "Finanzas", vacaciones: 15, permisos: 10 },
  { name: "RRHH", vacaciones: 10, permisos: 8 },
]

export default function StatisticsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Estadísticas de Solicitudes</h2>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar a Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total de Solicitudes</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">↑ 12%</span> vs. período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Tasa de Aprobación</CardTitle>
            <CardDescription>Solicitudes aprobadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">↑ 5%</span> vs. período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Tiempo Promedio</CardTitle>
            <CardDescription>De respuesta a solicitudes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.2 días</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">↑ 0.3 días</span> vs. período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="department">Por Departamento</TabsTrigger>
          <TabsTrigger value="status">Estado</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes por Mes</CardTitle>
              <CardDescription>Distribución de solicitudes de vacaciones y permisos durante el año</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="vacaciones" name="Vacaciones" fill="#8884d8" />
                    <Bar dataKey="permisos" name="Permisos" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes por Departamento</CardTitle>
              <CardDescription>Distribución de solicitudes por departamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="vacaciones" name="Vacaciones" fill="#8884d8" />
                    <Bar dataKey="permisos" name="Permisos" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Solicitudes</CardTitle>
              <CardDescription>Distribución de solicitudes por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

