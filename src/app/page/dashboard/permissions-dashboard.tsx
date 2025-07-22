"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  ArrowLeft,
  Filter,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Download,
  Building2,
  Calendar,
  Search,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  FileText,
  CalendarDays,
  UserCheck,
  Timer,
  Shield,
} from "lucide-react"


const permissionsData2 = [
  {
    area: "Planta",
    totalPermissions: 145,
    totalHours: 580,
    averageHoursPerPermission: 4.0,
    averagePermissionsPerEmployee: 8.5,
    totalEmployees: 17,
    supervisor: "Carlos Mendoza",
    employees: [
      {
        name: "Juan Pérez",
        totalPermissions: 12,
        totalHours: 48,
        averageHours: 4.0,
        lastPermission: "2024-01-15",
        pendingPermissions: 1,
        weeklyPattern: {
          monday: 3,
          tuesday: 1,
          wednesday: 2,
          thursday: 1,
          friday: 5,
        },
        areaAverage: 8.5,
        comparisonWithArea: 3.5,
      },

    ],
  },
  {
    area: "Administración",
    totalPermissions: 89,
    totalHours: 267,
    averageHoursPerPermission: 3.0,
    averagePermissionsPerEmployee: 7.4,
    totalEmployees: 12,
    trend: -5,
    supervisor: "Ana Rodríguez",
    supervisorPermissions: 89,
    employees: [
      {
        name: "Pedro Martínez",
        totalPermissions: 8,
        totalHours: 24,
        averageHours: 3.0,
        lastPermission: "2024-01-18",
        riskLevel: "green",
        pendingPermissions: 0,
        monthlyData: [
          { month: "Ene", permissions: 1, hours: 3 },
          { month: "Feb", permissions: 2, hours: 6 },
          { month: "Mar", permissions: 2, hours: 6 },
          { month: "Abr", permissions: 1, hours: 3 },
          { month: "May", permissions: 1, hours: 3 },
          { month: "Jun", permissions: 1, hours: 3 },
        ],
        weeklyPattern: {
          monday: 2,
          tuesday: 1,
          wednesday: 1,
          thursday: 2,
          friday: 2,
        },
        areaAverage: 7.4,
        frequentDates: ["Martes", "Jueves"],
        comparisonWithArea: 0.6,
      },
    ],
  },
  {
    area: "Contabilidad",
    totalPermissions: 67,
    totalHours: 201,
    averageHoursPerPermission: 3.0,
    averagePermissionsPerEmployee: 6.7,
    totalEmployees: 10,
    trend: 8,
    supervisor: "Luis Torres",
    supervisorPermissions: 67,
    employees: [
      {
        name: "Carmen Silva",
        totalPermissions: 10,
        totalHours: 30,
        averageHours: 3.0,
        lastPermission: "2024-01-22",
        riskLevel: "yellow",
        pendingPermissions: 1,
        monthlyData: [
          { month: "Ene", permissions: 2, hours: 6 },
          { month: "Feb", permissions: 1, hours: 3 },
          { month: "Mar", permissions: 2, hours: 6 },
          { month: "Abr", permissions: 2, hours: 6 },
          { month: "May", permissions: 2, hours: 6 },
          { month: "Jun", permissions: 1, hours: 3 },
        ],
        weeklyPattern: {
          monday: 3,
          tuesday: 1,
          wednesday: 2,
          thursday: 1,
          friday: 3,
        },
        areaAverage: 6.7,
        frequentDates: ["Lunes", "Viernes"],
        comparisonWithArea: 3.3,
      },
    ],
  },
  {
    area: "Bodega",
    totalPermissions: 78,
    totalHours: 312,
    averageHoursPerPermission: 4.0,
    averagePermissionsPerEmployee: 9.8,
    totalEmployees: 8,
    trend: 15,
    supervisor: "Roberto Vega",
    supervisorPermissions: 78,
    employees: [
      {
        name: "Diego Morales",
        totalPermissions: 18,
        totalHours: 72,
        averageHours: 4.0,
        lastPermission: "2024-01-25",
        riskLevel: "red",
        pendingPermissions: 3,
        monthlyData: [
          { month: "Ene", permissions: 4, hours: 16 },
          { month: "Feb", permissions: 3, hours: 12 },
          { month: "Mar", permissions: 3, hours: 12 },
          { month: "Abr", permissions: 3, hours: 12 },
          { month: "May", permissions: 3, hours: 12 },
          { month: "Jun", permissions: 2, hours: 8 },
        ],
        weeklyPattern: {
          monday: 5,
          tuesday: 2,
          wednesday: 3,
          thursday: 2,
          friday: 6,
        },
        areaAverage: 9.8,
        frequentDates: ["Viernes", "Lunes"],
        comparisonWithArea: 8.2,
      },
    ],
  },
]




// Mock data for permissions
const permissionsData = [
  {
    area: "Planta",
    totalPermissions: 145,
    totalHours: 580,
    averageHoursPerPermission: 4.0,
    averagePermissionsPerEmployee: 8.5,
    totalEmployees: 17,
    //trend: 12,
    supervisor: "Carlos Mendoza",
    supervisorPermissions: 145,
    employees: [
      {
        name: "Juan Pérez",
        totalPermissions: 12,
        totalHours: 48,
        averageHours: 4.0,
        lastPermission: "2024-01-15",
        riskLevel: "green",
        pendingPermissions: 1,
        monthlyData: [
          { month: "Ene", permissions: 2, hours: 8 },
          { month: "Feb", permissions: 1, hours: 4 },
          { month: "Mar", permissions: 3, hours: 12 },
          { month: "Abr", permissions: 2, hours: 8 },
          { month: "May", permissions: 1, hours: 4 },
          { month: "Jun", permissions: 3, hours: 12 },
        ],
        weeklyPattern: {
          monday: 3,
          tuesday: 1,
          wednesday: 2,
          thursday: 1,
          friday: 5,
        },
        areaAverage: 8.5,
        frequentDates: ["Viernes", "Lunes después de feriado"],
        comparisonWithArea: 3.5,
      },
      {
        name: "María González",
        totalPermissions: 15,
        totalHours: 75,
        averageHours: 5.0,
        lastPermission: "2024-01-20",
        riskLevel: "yellow",
        pendingPermissions: 2,
        monthlyData: [
          { month: "Ene", permissions: 3, hours: 15 },
          { month: "Feb", permissions: 2, hours: 10 },
          { month: "Mar", permissions: 4, hours: 20 },
          { month: "Abr", permissions: 2, hours: 10 },
          { month: "May", permissions: 2, hours: 10 },
          { month: "Jun", permissions: 2, hours: 10 },
        ],
        weeklyPattern: {
          monday: 4,
          tuesday: 2,
          wednesday: 3,
          thursday: 2,
          friday: 4,
        },
        areaAverage: 8.5,
        frequentDates: ["Viernes", "Lunes"],
        comparisonWithArea: 6.5,
      },
    ],
  },
  {
    area: "Administración",
    totalPermissions: 89,
    totalHours: 267,
    averageHoursPerPermission: 3.0,
    averagePermissionsPerEmployee: 7.4,
    totalEmployees: 12,
    trend: -5,
    supervisor: "Ana Rodríguez",
    supervisorPermissions: 89,
    employees: [
      {
        name: "Pedro Martínez",
        totalPermissions: 8,
        totalHours: 24,
        averageHours: 3.0,
        lastPermission: "2024-01-18",
        riskLevel: "green",
        pendingPermissions: 0,
        monthlyData: [
          { month: "Ene", permissions: 1, hours: 3 },
          { month: "Feb", permissions: 2, hours: 6 },
          { month: "Mar", permissions: 2, hours: 6 },
          { month: "Abr", permissions: 1, hours: 3 },
          { month: "May", permissions: 1, hours: 3 },
          { month: "Jun", permissions: 1, hours: 3 },
        ],
        weeklyPattern: {
          monday: 2,
          tuesday: 1,
          wednesday: 1,
          thursday: 2,
          friday: 2,
        },
        areaAverage: 7.4,
        frequentDates: ["Martes", "Jueves"],
        comparisonWithArea: 0.6,
      },
    ],
  },
  {
    area: "Contabilidad",
    totalPermissions: 67,
    totalHours: 201,
    averageHoursPerPermission: 3.0,
    averagePermissionsPerEmployee: 6.7,
    totalEmployees: 10,
    trend: 8,
    supervisor: "Luis Torres",
    supervisorPermissions: 67,
    employees: [
      {
        name: "Carmen Silva",
        totalPermissions: 10,
        totalHours: 30,
        averageHours: 3.0,
        lastPermission: "2024-01-22",
        riskLevel: "yellow",
        pendingPermissions: 1,
        monthlyData: [
          { month: "Ene", permissions: 2, hours: 6 },
          { month: "Feb", permissions: 1, hours: 3 },
          { month: "Mar", permissions: 2, hours: 6 },
          { month: "Abr", permissions: 2, hours: 6 },
          { month: "May", permissions: 2, hours: 6 },
          { month: "Jun", permissions: 1, hours: 3 },
        ],
        weeklyPattern: {
          monday: 3,
          tuesday: 1,
          wednesday: 2,
          thursday: 1,
          friday: 3,
        },
        areaAverage: 6.7,
        frequentDates: ["Lunes", "Viernes"],
        comparisonWithArea: 3.3,
      },
    ],
  },
  {
    area: "Bodega",
    totalPermissions: 78,
    totalHours: 312,
    averageHoursPerPermission: 4.0,
    averagePermissionsPerEmployee: 9.8,
    totalEmployees: 8,
    trend: 15,
    supervisor: "Roberto Vega",
    supervisorPermissions: 78,
    employees: [
      {
        name: "Diego Morales",
        totalPermissions: 18,
        totalHours: 72,
        averageHours: 4.0,
        lastPermission: "2024-01-25",
        riskLevel: "red",
        pendingPermissions: 3,
        monthlyData: [
          { month: "Ene", permissions: 4, hours: 16 },
          { month: "Feb", permissions: 3, hours: 12 },
          { month: "Mar", permissions: 3, hours: 12 },
          { month: "Abr", permissions: 3, hours: 12 },
          { month: "May", permissions: 3, hours: 12 },
          { month: "Jun", permissions: 2, hours: 8 },
        ],
        weeklyPattern: {
          monday: 5,
          tuesday: 2,
          wednesday: 3,
          thursday: 2,
          friday: 6,
        },
        areaAverage: 9.8,
        frequentDates: ["Viernes", "Lunes"],
        comparisonWithArea: 8.2,
      },
    ],
  },
]
type MonthlyData = {
  month: string
  permissions: number
  hours: number
}

type WeeklyPattern = {
  monday: number
  tuesday: number
  wednesday: number
  thursday: number
  friday: number
}

type Employee = {
  name: string
  area: string
  totalPermissions: number
  totalHours: number
  averageHours: number
  lastPermission: string
  riskLevel: string
  pendingPermissions: number
  monthlyData: MonthlyData[]
  weeklyPattern: WeeklyPattern
  areaAverage: number
  frequentDates: string[]
  comparisonWithArea: number
}
// Mock permission requests data
const permissionRequests = [
  {
    id: 1,
    employeeName: "Juan Pérez",
    requestDate: "2024-01-15",
    startDate: "2024-01-16",
    endDate: "2024-01-16",
    hours: 4,
    reason: "Cita médica",
    status: "approved",
    approvedBy: "Carlos Mendoza",
    area: "Planta",
  },
  {
    id: 2,
    employeeName: "María González",
    requestDate: "2024-01-20",
    startDate: "2024-01-21",
    endDate: "2024-01-21",
    hours: 8,
    reason: "Asuntos personales",
    status: "pending",
    approvedBy: null,
    area: "Planta",
  },
  {
    id: 3,
    employeeName: "Pedro Martínez",
    requestDate: "2024-01-18",
    startDate: "2024-01-19",
    endDate: "2024-01-19",
    hours: 3,
    reason: "Trámite bancario",
    status: "approved",
    approvedBy: "Ana Rodríguez",
    area: "Administración",
  },
  {
    id: 4,
    employeeName: "Diego Morales",
    requestDate: "2024-01-25",
    startDate: "2024-01-26",
    endDate: "2024-01-26",
    hours: 4,
    reason: "Emergencia familiar",
    status: "rejected",
    approvedBy: "Roberto Vega",
    area: "Bodega",
  },
]

type PermissionsDashboardProps = {
  showPermissionDetail: boolean
  setShowPermissionDetail: (boolean: boolean) => void
}

type  permissionRequestsType={
  approvedBy:string
  area: string
  employeeName: string
  endDate: string
  hours: number
  id: number
  reason: string
  requestDate: string
  startDate: string
  status: string

}

type permissionsDataType = {
  area: string,
  averageHoursPerPermission: number
  averagePermissionsPerEmployee: number
  employees: [{
    areaAverage: number
    averageHours: number
    comparisonWithArea: number
    lastPermission: string
    name: string
    pendingPermissions: number
    totalHours: number
    totalPermissions: number
    weeklyPattern: {
      friday: string
      monday: string
      thursday: string
      tuesday: string
      wednesday: string
    }
  }]
  supervisor: string
  totalEmployees: number
  totalHours: number
  totalPermissions: number
}

export default function PermissionsDashboard({ showPermissionDetail, setShowPermissionDetail }: PermissionsDashboardProps) {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissionRequests, setPermissionRequests] = useState<permissionRequestsType[]>()
  const [permissionsData, setPermissionsData] = useState<permissionsDataType[]>()

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const res = await fetch('https://infarmaserver-production.up.railway.app/api/statistics/get-permissions-personal-statistics');
        if (!res.ok) {
          throw new Error(`Error en la respuesta: ${res.status}`);
        }
        const data = await res.json();
        setStatistics(data);
        setPermissionRequests(data.permissionRequests)
        setPermissionsData(data.permissionsData)
        console.log("Data de solicitudes", data)
      } catch (err) {
        console.error(err);
        setError('Hubo un problema al obtener las estadísticas.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);
  const [showFilters, setShowFilters] = useState(false)
  const [showAreaCards, setShowAreaCards] = useState(true)
  const [selectedArea, setSelectedArea] = useState("Todas")
  const [selectedPeriod, setSelectedPeriod] = useState("Este Mes")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1)
  const [employeesPerPage, setEmployeesPerPage] = useState(10)

  // Employee detail modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [permissionRecordsFilter, setPermissionRecordsFilter] = useState("all")
  const [permissionRecordsPerPage, setPermissionRecordsPerPage] = useState(10)
  const [currentPermissionPage, setCurrentPermissionPage] = useState(1)

  const handleEmployeeClick = (employeeName: any) => {
    const employee = permissionsData?.flatMap((area : any) => area.employees.map((emp :any) => ({ ...emp, area: area.area })))
      .find((emp : any) => emp.name === employeeName)

    if (employee) {
      setSelectedEmployee(employee as any)
      setShowEmployeeModal(true)
      setCurrentPermissionPage(1)
    }
  }

  const getRiskLevelColor = (level: any) => {
    switch (level) {
      case "green":
        return "text-green-600 bg-green-50"
      case "yellow":
        return "text-yellow-600 bg-yellow-50"
      case "red":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getRiskLevelText = (level: any) => {
    switch (level) {
      case "green":
        return "Bajo"
      case "yellow":
        return "Medio"
      case "red":
        return "Alto"
      default:
        return "Normal"
    }
  }

  const getStatusIcon = (status: any) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: any) => {
    switch (status) {
      case "approved":
        return "text-green-600"
      case "pending":
        return "text-yellow-600"
      case "rejected":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusText = (status: any) => {
    switch (status) {
      case "approved":
        return "Aprobado"
      case "pending":
        return "Pendiente"
      case "rejected":
        return "Rechazado"
      default:
        return "Desconocido"
    }
  }

  const getFilteredPermissionRequests = () => {
    if (!selectedEmployee) return []

    let filtered = permissionRequests!.filter((req) => req.employeeName === (selectedEmployee as Employee).name)

    if (permissionRecordsFilter !== "all") {
      filtered = filtered.filter((req) => req.status === permissionRecordsFilter)
    }

    return filtered
  }

  const getPaginatedPermissionRequests = () => {
    const filtered = getFilteredPermissionRequests()
    const startIndex = (currentPermissionPage - 1) * permissionRecordsPerPage
    return filtered.slice(startIndex, startIndex + permissionRecordsPerPage)
  }

  const getTotalPermissionPages = () => {
    return Math.ceil(getFilteredPermissionRequests().length / permissionRecordsPerPage)
  }

  const getPermissionFilterCount = (filter: any) => {
    if (!selectedEmployee) return 0
    const requests = permissionRequests!.filter((req) => req.employeeName === (selectedEmployee as Employee).name)
    if (filter === "all") return requests.length
    return requests.filter((req) => req.status === filter).length
  }

  if (showPermissionDetail) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPermissionDetail(false)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Resumen
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Análisis de Permisos de Empleados</h1>
                <p className="text-gray-600">Análisis detallado de permisos por área y empleado</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAreaCards(!showAreaCards)}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {showAreaCards ? "Ocultar Métricas" : "Mostrar Métricas"}
                {showAreaCards ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Análisis
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-lg border shadow-sm transition-all duration-300 ease-in-out">
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-48">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas las Áreas</SelectItem>
                  <SelectItem value="Planta">Planta</SelectItem>
                  <SelectItem value="Administración">Administración</SelectItem>
                  <SelectItem value="Contabilidad">Contabilidad</SelectItem>
                  <SelectItem value="Bodega">Bodega</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Este Mes">Este Mes</SelectItem>
                  <SelectItem value="Último Trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="Este Año">Este Año</SelectItem>
                  <SelectItem value="Año Anterior">Año Anterior</SelectItem>
                  <SelectItem value="Comparación Interanual">Comparación Interanual</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Current Filter Summary */}
          {!showFilters && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-blue-800">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <strong>Área:</strong> {selectedArea}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <strong>Período:</strong> {selectedPeriod}
                  </span>
                  {searchTerm && (
                    <span className="flex items-center gap-1">
                      <Search className="h-4 w-4" />
                      <strong>Búsqueda:</strong> "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Permission Metrics Cards */}
          {showAreaCards && permissionsData && (
            <div className="space-y-6 mb-8 transition-all duration-300 ease-in-out">
              {/* Top Level Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Total de Permisos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      {permissionsData && permissionsData.reduce((acc, area) => acc + area.totalPermissions, 0)}
                    </div>
                    <p className="text-sm text-blue-700">Permisos solicitados</p>
                    <div className="text-xs text-blue-600 mt-1">
                      {Math.round(
                        permissionsData.reduce((acc, area) => acc + area.totalPermissions, 0) /
                        permissionsData.reduce((acc, area) => acc + area.totalEmployees, 0),
                      )}{" "}
                      promedio por empleado
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Horas Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {permissionsData.reduce((acc, area) => acc + area.totalHours, 0)}
                    </div>
                    <p className="text-sm text-green-700">Horas de permisos</p>
                    <div className="text-xs text-green-600 mt-1">
                      {(
                        permissionsData.reduce((acc, area) => acc + area.totalHours, 0) /
                        permissionsData.reduce((acc, area) => acc + area.totalPermissions, 0)
                      ).toFixed(1)}{" "}
                      horas promedio
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Por Supervisor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">{permissionsData.length}</div>
                    <p className="text-sm text-orange-700">Supervisores activos</p>
                    <div className="text-xs text-orange-600 mt-1">
                      {Math.round(
                        permissionsData.reduce((acc, area) => acc + area.totalPermissions, 0) / permissionsData.length,
                      )}{" "}
                      promedio por supervisor
                    </div>
                  </CardContent>
                </Card>
                

                {/*
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Casos de Riesgo
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {permissionsData.reduce(
                        (acc, area) =>
                          acc +
                          area.employees.filter((emp) => emp.riskLevel === "red" || emp.riskLevel === "yellow").length,
                        0,
                      )}
                    </div>
                    
                    <p className="text-sm text-purple-700">Requieren atención</p>
                    <div className="text-xs text-purple-600 mt-1">
                      {permissionsData.reduce(
                        (acc, area) => acc + area.employees.filter((emp) => emp.riskLevel === "red").length,
                        0,
                      )}{" "}
                      casos críticos
                    </div>
                  </CardContent>
                  
                </Card>
                
                */}
              </div>

              {/* Area Analysis Cards */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análisis por Área
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {permissionsData.map((area) => (
                    <Card
                      key={area.area}
                      className={`hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${selectedArea === area.area ? "ring-2 ring-blue-500 bg-blue-50 shadow-md" : "hover:bg-gray-50"
                        }`}
                      onClick={() => {
                        setSelectedArea(area.area)
                        setCurrentEmployeePage(1)
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-gray-600">{area.area}</CardTitle>
                          <Building2 className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold text-blue-800">{area.totalPermissions}</div>
                            <div className="text-blue-600">Permisos</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-semibold text-green-800">{area.totalHours}h</div>
                            <div className="text-green-600">Horas</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Promedio</span>
                            <span className="font-medium">{area.averagePermissionsPerEmployee}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Supervisor</span>
                            <span className="font-medium text-xs">{area.supervisor.split(" ")[0]}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          {/* 
                          <Badge variant={area.trend >= 0 ? "default" : "destructive"} className="text-xs">
                            {area.trend >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(area.trend)}%
                          </Badge>
                          
                          */}
                          <span className="text-xs text-gray-500">{area.totalEmployees} empleados</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Top Areas Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-red-600" />
                      Áreas con Más Permisos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {permissionsData
                        .sort((a, b) => b.totalPermissions - a.totalPermissions)
                        .slice(0, 3)
                        .map((area, index) => (
                          <div key={area.area} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-800">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{area.area}</p>
                                <p className="text-sm text-gray-600">{area.averageHoursPerPermission}h promedio</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-800">{area.totalPermissions}</p>
                              <p className="text-xs text-red-600">permisos</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Supervisores con Más Carga
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {permissionsData
                        .sort((a, b) => b.totalPermissions - a.totalPermissions)
                        .slice(0, 3)
                        .map((area, index) => (
                          <div
                            key={area.supervisor}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-800">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{area.supervisor}</p>
                                <p className="text-sm text-gray-600">{area.area}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-800">{area.totalPermissions}</p>
                              <p className="text-xs text-green-600">permisos gestionados</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Employee Permission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Detalle de Permisos por Empleado - {selectedArea === "Todas" ? "Todas las Áreas" : selectedArea}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pagination Controls */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Select
                      value={employeesPerPage.toString()}
                      onValueChange={(value) => {
                        setEmployeesPerPage(Number.parseInt(value))
                        setCurrentEmployeePage(1)
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 por página</SelectItem>
                        <SelectItem value="10">10 por página</SelectItem>
                        <SelectItem value="15">15 por página</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-gray-500">
                      Total:{" "}
                      {permissionsData?.filter((area) => selectedArea === "Todas" || area.area === selectedArea)
                        .reduce((acc, area) => acc + area.employees.length, 0)}{" "}
                      empleados
                    </div>
                  </div>
                </div>

                {/* Employee Permission List */}
                <div className="space-y-3">
                  {permissionsData?.filter((area) => selectedArea === "Todas" || area.area === selectedArea)
                    .flatMap((area) =>
                      area.employees
                        .filter(
                          (employee) =>
                            searchTerm === "" || employee.name.toLowerCase().includes(searchTerm.toLowerCase()),
                        )
                        .map((employee) => ({ ...employee, area: area.area })),
                    )
                    .slice((currentEmployeePage - 1) * employeesPerPage, currentEmployeePage * employeesPerPage)
                    .map((employee, index) => (
                      <div
                        key={`${employee.area}-${employee.name}-${index}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 cursor-pointer"
                        onClick={() => handleEmployeeClick(employee.name)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{employee.name}</p>
                            <p className="text-sm text-gray-500">{employee.area}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="font-semibold text-lg text-blue-600">{employee.totalPermissions}</p>
                            <p className="text-xs text-gray-500">permisos</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-lg text-green-600">{employee.totalHours}h</p>
                            <p className="text-xs text-gray-500">horas</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-lg text-orange-600">{employee.averageHours}h</p>
                            <p className="text-xs text-gray-500">promedio</p>
                          </div>
                          {/*
                          <div className="text-center">
                            <Badge className={`${getRiskLevelColor(employee.riskLevel)} border-0`}>
                              {getRiskLevelText(employee.riskLevel)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">riesgo</p>
                          </div>
                           */}
                          <div className="text-center">
                            <p className="font-semibold text-lg text-purple-600">{employee.pendingPermissions}</p>
                            <p className="text-xs text-gray-500">pendientes</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Pagination */}
                {permissionsData &&  Math.ceil(
                  (permissionsData.filter((area) => selectedArea === "Todas" || area.area === selectedArea)
                    .reduce((acc, area) => acc + area.employees.length, 0) / employeesPerPage) 
                ) > 1 && (
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Mostrando {(currentEmployeePage - 1) * employeesPerPage + 1} a{" "}
                        {Math.min(
                          currentEmployeePage * employeesPerPage,
                          permissionsData!
                            .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
                            .reduce((acc, area) => acc + area.employees.length, 0),
                        )}{" "}
                        de{" "}
                        {permissionsData!
                          .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
                          .reduce((acc, area) => acc + area.employees.length, 0)}{" "}
                        empleados
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentEmployeePage(Math.max(1, currentEmployeePage - 1))}
                              className={currentEmployeePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from(
                            {
                              length: Math.ceil(
                                permissionsData!
                                  .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
                                  .reduce((acc, area) => acc + area.employees.length, 0) / employeesPerPage,
                              ),
                            },
                            (_, i) => i + 1,
                          ).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentEmployeePage(page)}
                                isActive={currentEmployeePage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setCurrentEmployeePage(
                                  Math.min(
                                    Math.ceil(
                                      permissionsData!
                                        .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
                                        .reduce((acc, area) => acc + area.employees.length, 0) / employeesPerPage,
                                    ),
                                    currentEmployeePage + 1,
                                  ),
                                )
                              }
                              className={
                                currentEmployeePage ===
                                  Math.ceil(
                                    permissionsData!
                                      .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
                                      .reduce((acc, area) => acc + area.employees.length, 0) / employeesPerPage,
                                  )
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Detail Modal */}
        <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                Perfil de Permisos - {selectedEmployee?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedEmployee && (
              <div className="space-y-6">
                {/* Permission Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/*
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Total Permisos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-900">{selectedEmployee.totalPermissions}</div>
                      <p className="text-sm text-blue-700">En el año</p>
                    </CardContent>
                  </Card>
                  
                  */}

                  <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Horas Acumuladas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900">{selectedEmployee.totalHours}h</div>
                      <p className="text-sm text-green-700">Total de horas</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Último Permiso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-yellow-900">{selectedEmployee.lastPermission}</div>
                      <p className="text-sm text-yellow-700">Fecha</p>
                    </CardContent>
                  </Card>
                  {/*
                  <Card
                    className={`bg-gradient-to-r border-2 ${selectedEmployee.riskLevel === "red"
                      ? "from-red-50 to-red-100 border-red-200"
                      : selectedEmployee.riskLevel === "yellow"
                        ? "from-yellow-50 to-yellow-100 border-yellow-200"
                        : "from-green-50 to-green-100 border-green-200"
                      }`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-sm font-medium flex items-center gap-2 ${selectedEmployee.riskLevel === "red"
                          ? "text-red-800"
                          : selectedEmployee.riskLevel === "yellow"
                            ? "text-yellow-800"
                            : "text-green-800"
                          }`}
                      >
                        <AlertCircle className="h-4 w-4" />
                        Nivel de Riesgo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${selectedEmployee.riskLevel === "red"
                          ? "text-red-900"
                          : selectedEmployee.riskLevel === "yellow"
                            ? "text-yellow-900"
                            : "text-green-900"
                          }`}
                      >
                        {getRiskLevelText(selectedEmployee.riskLevel)}
                      </div>
                      <p
                        className={`text-sm ${selectedEmployee.riskLevel === "red"
                          ? "text-red-700"
                          : selectedEmployee.riskLevel === "yellow"
                            ? "text-yellow-700"
                            : "text-green-700"
                          }`}
                      >
                        {selectedEmployee.pendingPermissions} pendientes
                      </p>
                    </CardContent>
                  </Card>
                  
                  */}
                </div>

                {/* Risk Level Warning */}
                {selectedEmployee.riskLevel === "red" && (
                  <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                        <div>
                          <h3 className="font-semibold text-red-900">⚠️ Empleado de Alto Riesgo</h3>
                          <p className="text-red-700">
                            Este empleado tiene <strong>{selectedEmployee.totalPermissions} permisos</strong> en el
                            período actual, superando significativamente el promedio del área (
                            {selectedEmployee.areaAverage}).
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            Se recomienda una revisión individual para evaluar la situación.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparison with Area Average */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Comparativa Personal vs. Promedio del Área
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-800">{selectedEmployee.totalPermissions}</div>
                        <div className="text-sm text-blue-600">Tus permisos</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">{selectedEmployee.areaAverage}</div>
                        <div className="text-sm text-gray-600">Promedio en {selectedEmployee.area}</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-800">
                          {selectedEmployee.comparisonWithArea > 0 ? "+" : ""}
                          {selectedEmployee.comparisonWithArea}
                        </div>
                        <div className="text-sm text-purple-600">Diferencia</div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {selectedEmployee.comparisonWithArea > 0
                          ? "📊 Este empleado está por encima del promedio de su área. Considerar revisión individual."
                          : selectedEmployee.comparisonWithArea < 0
                            ? "✅ Este empleado está por debajo del promedio de su área."
                            : "✅ Este empleado está en línea con el promedio de su área."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Usage Chart */}
                <Card>
                  {
                    /*
                    
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Evolución Mensual de Permisos (2024)
                    </CardTitle>
                  </CardHeader>
                    */
                  }
                  {/*
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEmployee.monthlyData.map((month) => (
                        <div key={month.month} className="flex items-center gap-4">
                          <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                <div
                                  className="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                  style={{
                                    width: `${Math.max((month.permissions / 5) * 100, month.permissions > 0 ? 20 : 0)}%`,
                                  }}
                                >
                                  {month.permissions > 0 && month.permissions}
                                </div>
                              </div>
                              <div className="w-20 text-sm text-gray-600">
                                {month.permissions} ({month.hours}h)
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  
                  */}
                </Card>

                {/* Weekly Pattern */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Patrón Semanal de Permisos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      {Object.entries(selectedEmployee.weeklyPattern).map(([day, count]) => (
                        <div key={day} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-800">{count}</div>
                          <div className="text-xs text-gray-600 capitalize">
                            {day === "monday"
                              ? "Lun"
                              : day === "tuesday"
                                ? "Mar"
                                : day === "wednesday"
                                  ? "Mié"
                                  : day === "thursday"
                                    ? "Jue"
                                    : "Vie"}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      {
                        /* 
                      <p className="text-sm text-yellow-800">
                        <strong>Días con más permisos:</strong> {selectedEmployee.frequentDates.join(", ")}
                      </p>
                        */
                      }
                    </div>
                  </CardContent>
                </Card>

                {/* Permission History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Historial de Solicitudes de Permisos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Filter Controls */}
                      <div className="flex flex-wrap gap-4 items-center">
                        <Select value={permissionRecordsFilter} onValueChange={setPermissionRecordsFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrar por estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas ({getPermissionFilterCount("all")})</SelectItem>
                            <SelectItem value="approved">Aprobadas ({getPermissionFilterCount("approved")})</SelectItem>
                            <SelectItem value="pending">Pendientes ({getPermissionFilterCount("pending")})</SelectItem>
                            <SelectItem value="rejected">
                              Rechazadas ({getPermissionFilterCount("rejected")})
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={permissionRecordsPerPage.toString()}
                          onValueChange={(value) => setPermissionRecordsPerPage(Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 por página</SelectItem>
                            <SelectItem value="10">10 por página</SelectItem>
                            <SelectItem value="15">15 por página</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPermissionRecordsFilter("all")
                            setCurrentPermissionPage(1)
                          }}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Limpiar Filtros
                        </Button>
                      </div>

                      {/* Records Table */}
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha Solicitud</TableHead>
                              <TableHead>Período</TableHead>
                              <TableHead>Horas</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead>Aprobado Por</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getPaginatedPermissionRequests().map((request) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.requestDate}</TableCell>
                                <TableCell>
                                  {request.startDate === request.endDate
                                    ? request.startDate
                                    : `${request.startDate} - ${request.endDate}`}
                                </TableCell>
                                <TableCell className="text-center">{request.hours}h</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(request.status)}
                                    <span className={getStatusColor(request.status)}>
                                      {getStatusText(request.status)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">{request.reason}</TableCell>
                                <TableCell className="text-sm">{request.approvedBy || "-"}</TableCell>
                              </TableRow>
                            ))}
                            {getPaginatedPermissionRequests().length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                  No se encontraron solicitudes con los filtros aplicados
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {getTotalPermissionPages() > 1 && (
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Mostrando {(currentPermissionPage - 1) * permissionRecordsPerPage + 1} a{" "}
                            {Math.min(
                              currentPermissionPage * permissionRecordsPerPage,
                              getFilteredPermissionRequests().length,
                            )}{" "}
                            de {getFilteredPermissionRequests().length} solicitudes
                          </div>
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => setCurrentPermissionPage(Math.max(1, currentPermissionPage - 1))}
                                  className={
                                    currentPermissionPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                                  }
                                />
                              </PaginationItem>
                              {Array.from({ length: getTotalPermissionPages() }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => setCurrentPermissionPage(page)}
                                    isActive={currentPermissionPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationItem>
                                <PaginationNext
                                  onClick={() =>
                                    setCurrentPermissionPage(
                                      Math.min(getTotalPermissionPages(), currentPermissionPage + 1),
                                    )
                                  }
                                  className={
                                    currentPermissionPage === getTotalPermissionPages()
                                      ? "pointer-events-none opacity-50"
                                      : "cursor-pointer"
                                  }
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return null
}
