"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Datos de ejemplo para los gráficos
const datosAsistencia = [
  { mes: "Ene", asistencia: 95, tardanzas: 3, ausencias: 2 },
  { mes: "Feb", asistencia: 93, tardanzas: 5, ausencias: 2 },
  { mes: "Mar", asistencia: 96, tardanzas: 2, ausencias: 2 },
  { mes: "Abr", asistencia: 94, tardanzas: 4, ausencias: 2 },
  { mes: "May", asistencia: 92, tardanzas: 6, ausencias: 2 },
  { mes: "Jun", asistencia: 90, tardanzas: 7, ausencias: 3 },
]

const datosSolicitudes = [
  { mes: "Ene", vacaciones: 10, permisos: 15, licencias: 2 },
  { mes: "Feb", vacaciones: 8, permisos: 12, licencias: 1 },
  { mes: "Mar", vacaciones: 12, permisos: 10, licencias: 0 },
  { mes: "Abr", vacaciones: 15, permisos: 8, licencias: 3 },
  { mes: "May", vacaciones: 20, permisos: 12, licencias: 1 },
  { mes: "Jun", vacaciones: 25, permisos: 15, licencias: 2 },
]

const datosAreas = [
  { name: "Recursos Humanos", value: 15 },
  { name: "Ventas", value: 30 },
  { name: "Administración", value: 20 },
  { name: "Tecnología", value: 25 },
  { name: "Producción", value: 10 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function GraphicsAnalysis() {
  const [periodoAsistencia, setPeriodoAsistencia] = useState("semestre")
  const [periodoSolicitudes, setPeriodoSolicitudes] = useState("semestre")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Tendencias de Asistencia</CardTitle>
              <CardDescription>Análisis de asistencia, tardanzas y ausencias</CardDescription>
            </div>
            <Select value={periodoAsistencia} onValueChange={setPeriodoAsistencia}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Último mes</SelectItem>
                <SelectItem value="trimestre">Último trimestre</SelectItem>
                <SelectItem value="semestre">Último semestre</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={datosAsistencia}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="asistencia" stroke="#4ade80" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="tardanzas" stroke="#fb923c" strokeWidth={2} />
              <Line type="monotone" dataKey="ausencias" stroke="#f87171" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Solicitudes por Tipo</CardTitle>
              <CardDescription>Distribución de solicitudes por categoría</CardDescription>
            </div>
            <Select value={periodoSolicitudes} onValueChange={setPeriodoSolicitudes}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Último mes</SelectItem>
                <SelectItem value="trimestre">Último trimestre</SelectItem>
                <SelectItem value="semestre">Último semestre</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={datosSolicitudes}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="vacaciones" fill="#3b82f6" />
              <Bar dataKey="permisos" fill="#8b5cf6" />
              <Bar dataKey="licencias" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por Área</CardTitle>
          <CardDescription>Porcentaje de personal por departamento</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosAreas}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {datosAreas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

