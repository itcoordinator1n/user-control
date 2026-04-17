/**
 * Fase 2 — Extracción de sub-componentes del dashboard.
 * Ejecutar con: node scripts/extract-dashboard-components.js
 */
const fs = require("fs");
const path = require("path");

const DASH = path.join(__dirname, "../src/app/page/dashboard");
const src = path.join(DASH, "attendance-dashboard.tsx");
const lines = fs.readFileSync(src, "utf8").split("\n");

function clean(str) {
  return str.replace(/\r/g, "");
}
function dedent(str, spaces) {
  return str.replace(new RegExp("^" + " ".repeat(spaces), "gm"), "");
}
function extractLines(from, to) {
  // from/to are 1-indexed line numbers (inclusive)
  return clean(lines.slice(from - 1, to).join("\n"));
}

// ─── Attendance JSX (lines 816–1554) ─────────────────────────────────────────
// Line 815 is `      return (` — we want the <div> content inside it
const attendanceJSX = dedent(
  extractLines(816, 1554).replace(/setShowAttendanceDetail\(false\)/g, "onBack()"),
  6 // remove 6 leading spaces (nested inside if(!isClient) else { if(show) { return () } })
);

// ─── Vacation JSX (lines 1565–2742) ──────────────────────────────────────────
// Line 1564 is `    return (` inside `if (showVacationDetail) {`
const vacationJSX = dedent(
  extractLines(1565, 2742).replace(/setShowVacationDetail\(false\)/g, "onBack()"),
  4 // remove 4 leading spaces (nested inside if(showVacationDetail) { return () })
);

// ─── WRITE: attendance-view.tsx ───────────────────────────────────────────────
const attendanceFile = `"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  UserCheck,
  CalendarDays,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Filter,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ExcelJS from "exceljs";
import type {
  AttendanceDataInterface,
  EmployeeProfile,
} from "../../_types/dashboard.types";

interface AttendanceViewProps {
  onBack: () => void;
  attendanceData: AttendanceDataInterface[];
  employeeProfiles: { [key: string]: EmployeeProfile };
  monthlyData: any;
  allowedArea: string | null;
}

export function AttendanceView({
  onBack,
  attendanceData,
  employeeProfiles,
  monthlyData,
  allowedArea,
}: AttendanceViewProps) {
  const [selectedArea, setSelectedArea] = useState(allowedArea ?? "Todas");
  const [selectedPeriod, setSelectedPeriod] = useState("Este Mes");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showAreaCards, setShowAreaCards] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [recordsFilter, setRecordsFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(10);
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);

  const setHours = (hour: string) => {
    if (!hour) return "";
    const [hours, minutes, seconds] = hour.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    date.setHours(date.getHours() - 6);
    return date.toTimeString().split(" ")[0];
  };

  const exportToExcel = async (fileName = "asistencias.xlsx") => {
    if (!Array.isArray(monthlyData) || monthlyData.length === 0) return;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Mi App";
    const summary = workbook.addWorksheet("Resumen Asistencia");
    const totalRegs = monthlyData.length;
    const uniqueEmps = new Set(monthlyData.map((r: any) => r.int_id_empleado)).size;
    const countByArea: Record<string, number> = {};
    monthlyData.forEach((r: any) => {
      countByArea[r.area] = (countByArea[r.area] || 0) + 1;
    });
    const areaRows = Object.entries(countByArea).map(([area, cnt]) => [area, cnt]);
    const sortedByDate = [...monthlyData].sort(
      (a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    const firstReg = sortedByDate[0]?.fecha?.toString() || "";
    const lastReg = sortedByDate[sortedByDate.length - 1]?.fecha?.toString() || "";
    const countByEmp: Record<string, number> = {};
    monthlyData.forEach((r: any) => {
      countByEmp[r.nombre_empleado] = (countByEmp[r.nombre_empleado] || 0) + 1;
    });
    const topEmps = Object.entries(countByEmp)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, cnt]) => [name, cnt]);
    summary.addRows([
      ["Total de registros", totalRegs],
      ["Empleados únicos", uniqueEmps],
      ["Primer registro (fecha)", firstReg],
      ["Último registro (fecha)", lastReg],
      [],
      ["Registros por Área", "Cantidad"],
      ...areaRows,
      [],
      ["Top 5 Empleados", "Registros"],
      ...topEmps,
    ]);
    summary.columns = [{ width: 30 }, { width: 15 }];
    const detailSheet = workbook.addWorksheet("Detalle Registros");
    detailSheet.columns = [
      { header: "Fecha completa", width: 25 },
      { header: "ID Empleado", width: 15 },
      { header: "Nombre Empleado", width: 25 },
      { header: "Área", width: 20 },
      { header: "Hora Entrada", width: 12 },
      { header: "Hora Salida", width: 12 },
    ];
    detailSheet.addTable({
      name: "DetalleTable",
      ref: "A1",
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleMedium4", showRowStripes: true },
      columns: [
        { name: "Fecha completa", filterButton: true },
        { name: "ID Empleado", filterButton: true },
        { name: "Nombre Empleado", filterButton: true },
        { name: "Área", filterButton: true },
        { name: "Hora Entrada", filterButton: true },
        { name: "Hora Salida", filterButton: true },
      ],
      rows: monthlyData.map((row: any) => [
        row.fecha?.toString() ?? "",
        row.int_id_empleado,
        row.nombre_empleado,
        row.area,
        setHours(row.entrada),
        setHours(row.salida),
      ]),
    });
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, fileName);
    } catch (err) {
      console.error("Error al exportar:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good":      return "bg-blue-100 text-blue-800";
      case "regular":   return "bg-yellow-100 text-yellow-800";
      case "poor":      return "bg-red-100 text-red-800";
      default:          return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "excellent": return "Excelente";
      case "good":      return "Bueno";
      case "regular":   return "Regular";
      case "poor":      return "Deficiente";
      default:          return "N/A";
    }
  };

  const getRecordStatusColor = (status: string) => {
    switch (status) {
      case "on_time":         return "text-green-600";
      case "late":            return "text-red-600";
      case "early_departure": return "text-orange-600";
      case "absent":          return "text-red-800";
      case "incomplete":      return "text-yellow-600";
      case "early_arrival":   return "text-blue-600";
      default:                return "text-gray-600";
    }
  };

  const getRecordStatusText = (status: string) => {
    switch (status) {
      case "on_time":         return "A Tiempo";
      case "late":            return "Llegada Tardía";
      case "early_departure": return "Salida Temprana";
      case "absent":          return "Inasistencia";
      case "incomplete":      return "Marcaje Incompleto";
      case "early_arrival":   return "Llegada Temprana";
      default:                return "N/A";
    }
  };

  const getRecordStatusIcon = (status: string) => {
    switch (status) {
      case "on_time":         return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "late":            return <Clock className="h-4 w-4 text-red-600" />;
      case "early_departure": return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "absent":          return <XCircle className="h-4 w-4 text-red-800" />;
      case "incomplete":      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "early_arrival":   return <Clock className="h-4 w-4 text-blue-600" />;
      default:                return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleEmployeeClick = (employeeName: string) => {
    const key = employeeName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .replace(/\\s+/g, "-");
    const profile = employeeProfiles[key];
    if (profile) {
      setSelectedEmployee(profile);
      setShowEmployeeModal(true);
      setCurrentPage(1);
      setRecordsFilter("all");
      setDateFrom("");
      setDateTo("");
    }
  };

  const getFilteredRecords = () => {
    if (!selectedEmployee) return [];
    let filtered = selectedEmployee.records;
    if (recordsFilter !== "all") filtered = filtered.filter((r) => r.status === recordsFilter);
    if (dateFrom) filtered = filtered.filter((r) => r.date >= dateFrom);
    if (dateTo)   filtered = filtered.filter((r) => r.date <= dateTo);
    return filtered;
  };

  const getPaginatedRecords = () => {
    const filtered = getFilteredRecords();
    return filtered.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
  };

  const getTotalPages = () => Math.ceil(getFilteredRecords().length / recordsPerPage);

  const getFilterCount = (filterType: string) => {
    if (!selectedEmployee) return 0;
    if (filterType === "all") return selectedEmployee.records.length;
    return selectedEmployee.records.filter((r) => r.status === filterType).length;
  };

  const getFilteredEmployees = () =>
    attendanceData
      .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
      .flatMap((area) =>
        area.employees
          .filter(
            (emp) =>
              searchTerm === "" ||
              emp.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((emp) => ({ ...emp, area: area.area }))
      );

  const getPaginatedEmployees = () => {
    const filtered = getFilteredEmployees();
    return filtered.slice(
      (currentEmployeePage - 1) * employeesPerPage,
      currentEmployeePage * employeesPerPage
    );
  };

  const getTotalEmployeePages = () =>
    Math.ceil(getFilteredEmployees().length / employeesPerPage);

  return (
${attendanceJSX}
  );
}
`;

// ─── WRITE: vacation-view.tsx ─────────────────────────────────────────────────
const vacationFile = `"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  Plane,
  FileText,
  UserCheck,
  CalendarDays,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Filter,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ExcelJS from "exceljs";
import type {
  VacationDataInterface,
  EmployeeVacationProfile,
} from "../../_types/dashboard.types";

interface VacationViewProps {
  onBack: () => void;
  vacationData: VacationDataInterface[];
  employeeVacationProfiles: { [key: string]: EmployeeVacationProfile };
  allowedArea: string | null;
}

export function VacationView({
  onBack,
  vacationData,
  employeeVacationProfiles,
  allowedArea,
}: VacationViewProps) {
  const [selectedArea, setSelectedArea] = useState(allowedArea ?? "Todas");
  const [selectedPeriod, setSelectedPeriod] = useState("Este Mes");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showAreaCards, setShowAreaCards] = useState(true);
  const [selectedVacationEmployee, setSelectedVacationEmployee] = useState<EmployeeVacationProfile | null>(null);
  const [showVacationEmployeeModal, setShowVacationEmployeeModal] = useState(false);
  const [vacationRecordsFilter, setVacationRecordsFilter] = useState("all");
  const [vacationRecordsPerPage, setVacationRecordsPerPage] = useState(10);
  const [currentVacationPage, setCurrentVacationPage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(10);
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);

  const handleVacationExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Mi App";
    const filteredData = vacationData.filter(
      (area) => selectedArea === "Todas" || area.area === selectedArea
    );
    const summarySheet = workbook.addWorksheet("Resumen General");
    summarySheet.columns = [
      { header: "Área", key: "area", width: 20 },
      { header: "Empleados Totales", key: "totalEmployees", width: 18 },
      { header: "Días Usados", key: "daysUsed", width: 14 },
      { header: "Días Promedio / Emp.", key: "avgPerEmp", width: 18 },
      { header: "Días Acumulados", key: "accumulatedDays", width: 16 },
      { header: "Tendencia (%)", key: "trend", width: 14 },
      { header: "Tasa de Utilización", key: "utilRate", width: 16 },
    ];
    filteredData.forEach((d) => {
      summarySheet.addRow({
        area: d.area, totalEmployees: d.totalEmployees, daysUsed: d.daysUsed,
        avgPerEmp: d.averageDaysPerEmployee, accumulatedDays: d.accumulatedDays, trend: d.trend,
        utilRate: { formula: \`\${d.daysUsed}/(\${d.totalEmployees}*\${d.accumulatedDays})\` },
      });
    });
    summarySheet.addTable({
      name: "ResumenTable", ref: "A1", headerRow: true, totalsRow: true,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: [
        { name: "Área", filterButton: true },
        { name: "Empleados Totales", totalsRowFunction: "sum" },
        { name: "Días Usados", totalsRowFunction: "sum" },
        { name: "Días Promedio / Emp.", totalsRowFunction: "average" },
        { name: "Días Acumulados", totalsRowFunction: "sum" },
        { name: "Tendencia (%)", totalsRowLabel: "—" },
        { name: "Tasa de Utilización", totalsRowFunction: "average" },
      ],
      rows: filteredData.map((d) => [
        d.area, d.totalEmployees, d.daysUsed, d.averageDaysPerEmployee, d.accumulatedDays, d.trend,
        { formula: \`\${d.daysUsed}/(\${d.totalEmployees}*\${d.accumulatedDays})\` },
      ]),
    });
    const detailSheet = workbook.addWorksheet("Detalle Empleados");
    detailSheet.columns = [
      { header: "Área", key: "area", width: 20 },
      { header: "Nombre", key: "name", width: 25 },
      { header: "Días Acumulados", key: "daysAccumulated", width: 16 },
      { header: "Días Usados", key: "daysUsed", width: 14 },
    ];
    filteredData.forEach((d) => {
      d.employees.forEach((emp) => {
        detailSheet.addRow({ area: d.area, name: emp.name, daysAccumulated: emp.daysAccumulated, daysUsed: emp.daysUsed });
      });
    });
    detailSheet.addTable({
      name: "DetalleTable", ref: "A1", headerRow: true, totalsRow: false,
      style: { theme: "TableStyleLight9", showRowStripes: true },
      columns: [
        { name: "Área", filterButton: true }, { name: "Nombre", filterButton: true },
        { name: "Días Acumulados", filterButton: true, totalsRowFunction: "sum" },
        { name: "Días Usados", filterButton: true, totalsRowFunction: "sum" },
      ],
      rows: filteredData.flatMap((d) => d.employees.map((emp) => [d.area, emp.name, emp.daysAccumulated, emp.daysUsed])),
    });
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "vacation_reports_table.xlsx");
  };

  const handleVacationEmployeeClick = (employeeName: string) => {
    const key = employeeName.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, "-");
    const profile = employeeVacationProfiles[key];
    if (profile) {
      setSelectedVacationEmployee(profile);
      setShowVacationEmployeeModal(true);
      setCurrentVacationPage(1);
      setVacationRecordsFilter("all");
    }
  };

  const getFilteredVacationRecords = () => {
    if (!selectedVacationEmployee) return [];
    let filtered = selectedVacationEmployee.requests;
    if (vacationRecordsFilter !== "all") filtered = filtered.filter((r) => r.status === vacationRecordsFilter);
    return filtered.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  };

  const getPaginatedVacationRecords = () => {
    const filtered = getFilteredVacationRecords();
    return filtered.slice((currentVacationPage - 1) * vacationRecordsPerPage, currentVacationPage * vacationRecordsPerPage);
  };

  const getTotalVacationPages = () => Math.ceil(getFilteredVacationRecords().length / vacationRecordsPerPage);

  const getVacationFilterCount = (filterType: string) => {
    if (!selectedVacationEmployee) return 0;
    if (filterType === "all") return selectedVacationEmployee.requests.length;
    return selectedVacationEmployee.requests.filter((r) => r.status === filterType).length;
  };

  const getVacationStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600";
      case "rejected": return "text-red-600";
      case "pending":  return "text-yellow-600";
      default:         return "text-gray-600";
    }
  };

  const getVacationStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Aprobada";
      case "rejected": return "Rechazada";
      case "pending":  return "Pendiente";
      default:         return "N/A";
    }
  };

  const getVacationStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":  return <Clock className="h-4 w-4 text-yellow-600" />;
      default:         return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFilteredEmployees = () =>
    vacationData
      .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
      .flatMap((area) =>
        area.employees
          .filter((emp) => searchTerm === "" || emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((emp) => ({ ...emp, area: area.area }))
      );

  const getPaginatedEmployees = () => {
    const filtered = getFilteredEmployees();
    return filtered.slice((currentEmployeePage - 1) * employeesPerPage, currentEmployeePage * employeesPerPage);
  };

  const getTotalEmployeePages = () => Math.ceil(getFilteredEmployees().length / employeesPerPage);

  return (
${vacationJSX}
  );
}
`;

// Write files
const attDest = path.join(DASH, "_components/attendance/attendance-view.tsx");
const vacDest = path.join(DASH, "_components/vacations/vacation-view.tsx");

fs.writeFileSync(attDest, attendanceFile, "utf8");
fs.writeFileSync(vacDest, vacationFile, "utf8");

console.log("✓ attendance-view.tsx written:", attendanceFile.split("\n").length, "lines");
console.log("✓ vacation-view.tsx written:", vacationFile.split("\n").length, "lines");
