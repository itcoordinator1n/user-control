"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useDashboardPermissions } from "./_hooks/use-dashboard-permissions";
import { useSummaryData } from "./_hooks/use-summary";
import { DashboardSkeleton } from "./_components/shared/dashboard-skeleton";
import { AreaFilter } from "./_components/shared/area-filter";
import { PeriodFilter } from "./_components/shared/period-filter";
import type { DashboardView } from "./_types/dashboard.types";

import {
  Download,
  Search,
  TrendingDown,
  TrendingUp,
  Plane,
  FileText,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ─── Lazy-loaded sub-views ───────────────────────────────────────────────────
const AttendanceView = dynamic(
  () => import("./_components/attendance/attendance-view").then((m) => m.AttendanceView),
  { loading: () => <DashboardSkeleton />, ssr: false }
);
const VacationView = dynamic(
  () => import("./_components/vacations/vacation-view").then((m) => m.VacationView),
  { loading: () => <DashboardSkeleton />, ssr: false }
);
const PermissionsDashboard = dynamic(
  () => import("./_components/permissions/permissions-view"),
  { loading: () => <DashboardSkeleton />, ssr: false }
);

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export default function AttendanceDashboard() {
  const { canView, isAreaRestricted, userArea } = useDashboardPermissions();
  const [activeView, setActiveView] = useState<DashboardView | null>(null);

  // ─── Sub-view routing ────────────────────────────────────────────────────────
  if (activeView === "attendance") {
    return (
      <AttendanceView
        onBack={() => setActiveView(null)}
        allowedArea={isAreaRestricted ? userArea : null}
      />
    );
  }

  if (activeView === "vacations") {
    return (
      <VacationView
        onBack={() => setActiveView(null)}
        allowedArea={isAreaRestricted ? userArea : null}
      />
    );
  }

  if (activeView === "permissions") {
    return (
      <PermissionsDashboard
        showPermissionDetail={true}
        setShowPermissionDetail={() => setActiveView(null)}
      />
    );
  }

  // ─── Summary (default view) ──────────────────────────────────────────────────
  return <DashboardSummary
    canView={canView}
    isAreaRestricted={isAreaRestricted}
    userArea={userArea}
    onNavigate={setActiveView}
  />;
}

// ─── Summary component ────────────────────────────────────────────────────────
interface SummaryProps {
  canView: (view: DashboardView) => boolean;
  isAreaRestricted: boolean;
  userArea: string | null;
  onNavigate: (view: DashboardView) => void;
}

function DashboardSummary({ canView, isAreaRestricted, userArea, onNavigate }: SummaryProps) {
  const { data: summary, loading } = useSummaryData();
  const [selectedArea, setSelectedArea] = useState(userArea ?? "Planta");
  const [selectedPeriod, setSelectedPeriod] = useState("Este Mes");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Estadísticas y Asistencia
            </h1>
            <p className="text-gray-600 mt-1">
              {loading
                ? "Cargando datos..."
                : summary
                  ? `${summary.activeEmployees} empleados activos`
                  : "Monitorea la asistencia y métricas de rendimiento de empleados"}
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <AreaFilter
            value={isAreaRestricted ? (userArea ?? selectedArea) : selectedArea}
            onChange={isAreaRestricted ? () => {} : setSelectedArea}
            disabled={isAreaRestricted}
            includeAll={false}
          />
          <PeriodFilter value={selectedPeriod} onChange={setSelectedPeriod} variant="attendance" />

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards — visible only for allowed views */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {canView("attendance") && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-300"
              onClick={() => onNavigate("attendance")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Asistencia Hoy</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary
                    ? `${summary.todayAttendance.present}/${summary.todayAttendance.total}`
                    : "—"}
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 mr-2">
                    {summary ? `${summary.todayAttendance.percentage}%` : "—"}
                  </span>
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Ver detalle
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {canView("vacations") && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-300"
              onClick={() => onNavigate("vacations")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Vacaciones Pendientes</CardTitle>
                <Plane className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary ? summary.pendingRequests.vacations : "—"}
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 mr-2">solicitudes</span>
                  <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Ver detalle
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {canView("permissions") && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-300"
              onClick={() => onNavigate("permissions")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Permisos Pendientes</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary ? summary.pendingRequests.permissions : "—"}
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 mr-2">solicitudes</span>
                  <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Ver detalle
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
