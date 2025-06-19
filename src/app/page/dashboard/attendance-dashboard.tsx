"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
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
  UserX,
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
import React from "react";
import PermissionsDashboard from "./permissions-dashboard";
import { useSession } from "next-auth/react";

interface AttendanceDetail {
  area: string;
  total: number;
  present: number;
  percentage: number;
  trend: number;
  employees: {
    name: string;
    attendance: number;
    status: "excellent" | "good" | "regular" | "poor";
  }[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  status:
    | "on_time"
    | "late"
    | "early_departure"
    | "absent"
    | "incomplete"
    | "early_arrival";
  notes?: string;
}

interface EmployeeProfile {
  id: string;
  name: string;
  area: string;
  supervisor: string;
  position: string;
  attendanceRate: number;
  lateArrivals: number;
  absences: number;
  records: AttendanceRecord[];
}

interface VacationRequest {
  id: string;
  requestDate: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: "approved" | "rejected" | "pending";
  reason: string;
  approvedBy?: string;
  notes?: string;
}

interface EmployeeVacationProfile {
  id: string;
  name: string;
  area: string;
  position: string;
  daysAvailable: number;
  daysUsed: number;
  daysPending: number;
  daysAccumulated: number;
  daysExpiring: number;
  expirationDate: string;
  productivity: number;
  plannedPercentage: number;
  monthlyUsage: { month: string; days: number }[];
  requests: VacationRequest[];
  areaAverage: number;
}

const employeeProfiles: { [key: string]: EmployeeProfile } = {
  "juan-perez": {
    id: "EMP001",
    name: "Juan Pérez",
    area: "Planta",
    supervisor: "Carlos Mendoza",
    position: "Operario de Producción",
    attendanceRate: 98,
    lateArrivals: 2,
    absences: 1,
    records: [
      {
        id: "1",
        date: "2024-01-15",
        entryTime: "08:00",
        exitTime: "17:00",
        status: "on_time",
      },
      {
        id: "2",
        date: "2024-01-16",
        entryTime: "08:15",
        exitTime: "17:00",
        status: "late",
        notes: "Tráfico pesado",
      },
      {
        id: "3",
        date: "2024-01-17",
        entryTime: "07:45",
        exitTime: "17:00",
        status: "early_arrival",
      },
      {
        id: "4",
        date: "2024-01-18",
        entryTime: null,
        exitTime: null,
        status: "absent",
        notes: "Cita médica",
      },
      {
        id: "5",
        date: "2024-01-19",
        entryTime: "08:00",
        exitTime: "16:30",
        status: "early_departure",
        notes: "Emergencia familiar",
      },
      {
        id: "6",
        date: "2024-01-20",
        entryTime: "08:00",
        exitTime: null,
        status: "incomplete",
        notes: "Olvidó marcar salida",
      },
      {
        id: "7",
        date: "2024-01-21",
        entryTime: "08:00",
        exitTime: "17:00",
        status: "on_time",
      },
      {
        id: "8",
        date: "2024-01-22",
        entryTime: "08:10",
        exitTime: "17:00",
        status: "late",
      },
      {
        id: "9",
        date: "2024-01-23",
        entryTime: "07:55",
        exitTime: "17:00",
        status: "on_time",
      },
      {
        id: "10",
        date: "2024-01-24",
        entryTime: "08:00",
        exitTime: "17:00",
        status: "on_time",
      },
      {
        id: "11",
        date: "2024-01-25",
        entryTime: "08:20",
        exitTime: "17:00",
        status: "late",
        notes: "Problema transporte",
      },
      {
        id: "12",
        date: "2024-01-26",
        entryTime: "08:00",
        exitTime: "16:45",
        status: "early_departure",
      },
    ],
  },
  "maria-garcia": {
    id: "EMP002",
    name: "María García",
    area: "Planta",
    supervisor: "Carlos Mendoza",
    position: "Supervisora de Calidad",
    attendanceRate: 95,
    lateArrivals: 3,
    absences: 2,
    records: [
      {
        id: "1",
        date: "2024-01-15",
        entryTime: "08:00",
        exitTime: "17:00",
        status: "on_time",
      },
      {
        id: "2",
        date: "2024-01-16",
        entryTime: "08:20",
        exitTime: "17:00",
        status: "late",
        notes: "Reunión previa",
      },
      {
        id: "3",
        date: "2024-01-17",
        entryTime: "08:00",
        exitTime: "17:00",
        status: "on_time",
      },
      {
        id: "4",
        date: "2024-01-18",
        entryTime: null,
        exitTime: null,
        status: "absent",
        notes: "Vacaciones",
      },
      {
        id: "5",
        date: "2024-01-19",
        entryTime: "08:00",
        exitTime: "17:00",
        status: "on_time",
      },
      {
        id: "6",
        date: "2024-01-20",
        entryTime: "08:15",
        exitTime: "17:00",
        status: "late",
      },
      {
        id: "7",
        date: "2024-01-21",
        entryTime: null,
        exitTime: null,
        status: "absent",
        notes: "Enfermedad",
      },
      {
        id: "8",
        date: "2024-01-22",
        entryTime: "07:50",
        exitTime: "17:00",
        status: "early_arrival",
      },
    ],
  },
  "carlos-lopez": {
    id: "EMP003",
    name: "Carlos López",
    area: "Planta",
    supervisor: "Carlos Mendoza",
    position: "Técnico de Mantenimiento",
    attendanceRate: 89,
    lateArrivals: 5,
    absences: 3,
    records: [
      {
        id: "1",
        date: "2024-01-15",
        entryTime: "08:25",
        exitTime: "17:00",
        status: "late",
        notes: "Problema mecánico",
      },
      {
        id: "2",
        date: "2024-01-16",
        entryTime: "08:00",
        exitTime: "17:00",
        status: "on_time",
      },
      {
        id: "3",
        date: "2024-01-17",
        entryTime: null,
        exitTime: null,
        status: "absent",
        notes: "Día personal",
      },
      {
        id: "4",
        date: "2024-01-18",
        entryTime: "08:30",
        exitTime: "17:00",
        status: "late",
      },
      {
        id: "5",
        date: "2024-01-19",
        entryTime: "08:00",
        exitTime: "16:00",
        status: "early_departure",
        notes: "Cita médica",
      },
      {
        id: "6",
        date: "2024-01-20",
        entryTime: "08:45",
        exitTime: "17:00",
        status: "late",
        notes: "Transporte público",
      },
      {
        id: "7",
        date: "2024-01-21",
        entryTime: null,
        exitTime: null,
        status: "absent",
        notes: "Enfermedad",
      },
      {
        id: "8",
        date: "2024-01-22",
        entryTime: "08:35",
        exitTime: "17:00",
        status: "late",
      },
      {
        id: "9",
        date: "2024-01-23",
        entryTime: null,
        exitTime: null,
        status: "absent",
        notes: "Asunto familiar",
      },
      {
        id: "10",
        date: "2024-01-24",
        entryTime: "08:15",
        exitTime: "16:30",
        status: "late",
      },
    ],
  },
};

const attendanceData = [
  {
    area: "Planta",
    total: 100,
    present: 98,
    percentage: 98,
    trend: 2,
    employees: [
      { name: "Juan Pérez", attendance: 98, status: "excellent" },
      { name: "María García", attendance: 95, status: "excellent" },
      { name: "Carlos López", attendance: 89, status: "good" },
      { name: "Ana Martínez", attendance: 92, status: "excellent" },
      { name: "Luis Rodríguez", attendance: 87, status: "good" },
      { name: "Carmen Silva", attendance: 94, status: "excellent" },
      { name: "Roberto Díaz", attendance: 91, status: "good" },
      { name: "Patricia Moreno", attendance: 88, status: "good" },
      { name: "Fernando Castro", attendance: 96, status: "excellent" },
      { name: "Isabel Herrera", attendance: 85, status: "regular" },
      { name: "Diego Torres", attendance: 93, status: "excellent" },
      { name: "Rosa Jiménez", attendance: 90, status: "good" },
    ],
  },
  {
    area: "Administración",
    total: 50,
    present: 45,
    percentage: 90,
    trend: -5,
    employees: [
      { name: "Carlos Mendoza", attendance: 90, status: "regular" },
      { name: "Sofía Vargas", attendance: 97, status: "excellent" },
      { name: "Miguel Ruiz", attendance: 89, status: "good" },
      { name: "Elena Campos", attendance: 94, status: "excellent" },
      { name: "Andrés Vega", attendance: 86, status: "regular" },
      { name: "Lucía Ramírez", attendance: 92, status: "excellent" },
    ],
  },
  {
    area: "Contabilidad",
    total: 30,
    present: 28,
    percentage: 93,
    trend: 1,
    employees: [
      { name: "Gloria Mendez", attendance: 96, status: "excellent" },
      { name: "Raúl Ortega", attendance: 91, status: "good" },
      { name: "Mónica Delgado", attendance: 88, status: "good" },
      { name: "Javier Peña", attendance: 94, status: "excellent" },
    ],
  },
  {
    area: "Bodega",
    total: 25,
    present: 23,
    percentage: 92,
    trend: 0.5,
    employees: [
      { name: "Pedro Vargas", attendance: 89, status: "good" },
      { name: "Teresa López", attendance: 95, status: "excellent" },
      { name: "Marcos Guerrero", attendance: 87, status: "good" },
      { name: "Beatriz Soto", attendance: 93, status: "excellent" },
      { name: "Héctor Navarro", attendance: 91, status: "good" },
    ],
  },
];

const vacationData = [
  {
    area: "Planta",
    totalEmployees: 12,
    totalDaysAvailable: 300,
    daysUsed: 234,
    usagePercentage: 78,
    averageDaysPerEmployee: 19.5,
    accumulatedDays: 66,
    accumulationPercentage: 22,
    trend: 5.2,
    plannedVsLastMinute: { planned: 85, lastMinute: 15 },
    monthlyUsage: [
      { month: "Ene", days: 18 },
      { month: "Feb", days: 12 },
      { month: "Mar", days: 25 },
      { month: "Abr", days: 22 },
      { month: "May", days: 28 },
      { month: "Jun", days: 15 },
      { month: "Jul", days: 35 },
      { month: "Ago", days: 32 },
      { month: "Sep", days: 20 },
      { month: "Oct", days: 18 },
      { month: "Nov", days: 16 },
      { month: "Dic", days: 33 },
    ],
    yearComparison: { current: 234, previous: 198, change: 18.2 },
    employees: [
      {
        name: "Juan Pérez",
        daysAvailable: 25,
        daysUsed: 22,
        daysAccumulated: 3,
        plannedPercentage: 90,
        productivity: 95,
      },
      {
        name: "María García",
        daysAvailable: 25,
        daysUsed: 18,
        daysAccumulated: 7,
        plannedPercentage: 85,
        productivity: 92,
      },
      {
        name: "Carlos López",
        daysAvailable: 25,
        daysUsed: 15,
        daysAccumulated: 10,
        plannedPercentage: 70,
        productivity: 88,
      },
      {
        name: "Ana Martínez",
        daysAvailable: 25,
        daysUsed: 20,
        daysAccumulated: 5,
        plannedPercentage: 95,
        productivity: 96,
      },
      {
        name: "Luis Rodríguez",
        daysAvailable: 25,
        daysUsed: 23,
        daysAccumulated: 2,
        plannedPercentage: 80,
        productivity: 94,
      },
      {
        name: "Carmen Silva",
        daysAvailable: 25,
        daysUsed: 19,
        daysAccumulated: 6,
        plannedPercentage: 88,
        productivity: 93,
      },
      {
        name: "Roberto Díaz",
        daysAvailable: 25,
        daysUsed: 21,
        daysAccumulated: 4,
        plannedPercentage: 92,
        productivity: 97,
      },
      {
        name: "Patricia Moreno",
        daysAvailable: 25,
        daysUsed: 17,
        daysAccumulated: 8,
        plannedPercentage: 75,
        productivity: 89,
      },
      {
        name: "Fernando Castro",
        daysAvailable: 25,
        daysUsed: 24,
        daysAccumulated: 1,
        plannedPercentage: 95,
        productivity: 98,
      },
      {
        name: "Isabel Herrera",
        daysAvailable: 25,
        daysUsed: 16,
        daysAccumulated: 9,
        plannedPercentage: 65,
        productivity: 85,
      },
      {
        name: "Diego Torres",
        daysAvailable: 25,
        daysUsed: 20,
        daysAccumulated: 5,
        plannedPercentage: 90,
        productivity: 94,
      },
      {
        name: "Rosa Jiménez",
        daysAvailable: 25,
        daysUsed: 19,
        daysAccumulated: 6,
        plannedPercentage: 82,
        productivity: 91,
      },
    ],
  },
  {
    area: "Administración",
    totalEmployees: 6,
    totalDaysAvailable: 150,
    daysUsed: 98,
    usagePercentage: 65,
    averageDaysPerEmployee: 16.3,
    accumulatedDays: 52,
    accumulationPercentage: 35,
    trend: -2.1,
    plannedVsLastMinute: { planned: 75, lastMinute: 25 },
    monthlyUsage: [
      { month: "Ene", days: 8 },
      { month: "Feb", days: 6 },
      { month: "Mar", days: 12 },
      { month: "Abr", days: 10 },
      { month: "May", days: 14 },
      { month: "Jun", days: 7 },
      { month: "Jul", days: 18 },
      { month: "Ago", days: 15 },
      { month: "Sep", days: 8 },
      { month: "Oct", days: 6 },
      { month: "Nov", days: 5 },
      { month: "Dic", days: 9 },
    ],
    yearComparison: { current: 98, previous: 112, change: -12.5 },
    employees: [
      {
        name: "Carlos Mendoza",
        daysAvailable: 25,
        daysUsed: 12,
        daysAccumulated: 13,
        plannedPercentage: 60,
        productivity: 82,
      },
      {
        name: "Sofía Vargas",
        daysAvailable: 25,
        daysUsed: 20,
        daysAccumulated: 5,
        plannedPercentage: 85,
        productivity: 95,
      },
      {
        name: "Miguel Ruiz",
        daysAvailable: 25,
        daysUsed: 16,
        daysAccumulated: 9,
        plannedPercentage: 70,
        productivity: 88,
      },
      {
        name: "Elena Campos",
        daysAvailable: 25,
        daysUsed: 18,
        daysAccumulated: 7,
        plannedPercentage: 80,
        productivity: 92,
      },
      {
        name: "Andrés Vega",
        daysAvailable: 25,
        daysUsed: 14,
        daysAccumulated: 11,
        plannedPercentage: 65,
        productivity: 85,
      },
      {
        name: "Lucía Ramírez",
        daysAvailable: 25,
        daysUsed: 18,
        daysAccumulated: 7,
        plannedPercentage: 88,
        productivity: 93,
      },
    ],
  },
  {
    area: "Contabilidad",
    totalEmployees: 4,
    totalDaysAvailable: 100,
    daysUsed: 85,
    usagePercentage: 85,
    averageDaysPerEmployee: 21.3,
    accumulatedDays: 15,
    accumulationPercentage: 15,
    trend: 8.7,
    plannedVsLastMinute: { planned: 92, lastMinute: 8 },
    monthlyUsage: [
      { month: "Ene", days: 6 },
      { month: "Feb", days: 4 },
      { month: "Mar", days: 8 },
      { month: "Abr", days: 7 },
      { month: "May", days: 9 },
      { month: "Jun", days: 5 },
      { month: "Jul", days: 12 },
      { month: "Ago", days: 11 },
      { month: "Sep", days: 7 },
      { month: "Oct", days: 6 },
      { month: "Nov", days: 4 },
      { month: "Dic", days: 6 },
    ],
    yearComparison: { current: 85, previous: 72, change: 18.1 },
    employees: [
      {
        name: "Gloria Mendez",
        daysAvailable: 25,
        daysUsed: 23,
        daysAccumulated: 2,
        plannedPercentage: 95,
        productivity: 97,
      },
      {
        name: "Raúl Ortega",
        daysAvailable: 25,
        daysUsed: 21,
        daysAccumulated: 4,
        plannedPercentage: 90,
        productivity: 94,
      },
      {
        name: "Mónica Delgado",
        daysAvailable: 25,
        daysUsed: 20,
        daysAccumulated: 5,
        plannedPercentage: 88,
        productivity: 92,
      },
      {
        name: "Javier Peña",
        daysAvailable: 25,
        daysUsed: 21,
        daysAccumulated: 4,
        plannedPercentage: 92,
        productivity: 95,
      },
    ],
  },
  {
    area: "Bodega",
    totalEmployees: 5,
    totalDaysAvailable: 125,
    daysUsed: 102,
    usagePercentage: 82,
    averageDaysPerEmployee: 20.4,
    accumulatedDays: 23,
    accumulationPercentage: 18,
    trend: 3.8,
    plannedVsLastMinute: { planned: 78, lastMinute: 22 },
    monthlyUsage: [
      { month: "Ene", days: 7 },
      { month: "Feb", days: 5 },
      { month: "Mar", days: 9 },
      { month: "Abr", days: 8 },
      { month: "May", days: 11 },
      { month: "Jun", days: 6 },
      { month: "Jul", days: 14 },
      { month: "Ago", days: 13 },
      { month: "Sep", days: 9 },
      { month: "Oct", days: 7 },
      { month: "Nov", days: 6 },
      { month: "Dic", days: 7 },
    ],
    yearComparison: { current: 102, previous: 95, change: 7.4 },
    employees: [
      {
        name: "Pedro Vargas",
        daysAvailable: 25,
        daysUsed: 19,
        daysAccumulated: 6,
        plannedPercentage: 75,
        productivity: 89,
      },
      {
        name: "Teresa López",
        daysAvailable: 25,
        daysUsed: 22,
        daysAccumulated: 3,
        plannedPercentage: 85,
        productivity: 95,
      },
      {
        name: "Marcos Guerrero",
        daysAvailable: 25,
        daysUsed: 18,
        daysAccumulated: 7,
        plannedPercentage: 70,
        productivity: 87,
      },
      {
        name: "Beatriz Soto",
        daysAvailable: 25,
        daysUsed: 21,
        daysAccumulated: 4,
        plannedPercentage: 88,
        productivity: 93,
      },
      {
        name: "Héctor Navarro",
        daysAvailable: 25,
        daysUsed: 22,
        daysAccumulated: 3,
        plannedPercentage: 82,
        productivity: 91,
      },
    ],
  },
];

const employeeVacationProfiles: { [key: string]: EmployeeVacationProfile } = {
  "juan-perez": {
    id: "EMP001",
    name: "Juan Pérez",
    area: "Planta",
    position: "Operario de Producción",
    daysAvailable: 25,
    daysUsed: 22,
    daysPending: 0,
    daysAccumulated: 3,
    daysExpiring: 3,
    expirationDate: "2024-12-31",
    productivity: 95,
    plannedPercentage: 90,
    areaAverage: 19.5,
    monthlyUsage: [
      { month: "Ene", days: 2 },
      { month: "Feb", days: 0 },
      { month: "Mar", days: 3 },
      { month: "Abr", days: 2 },
      { month: "May", days: 4 },
      { month: "Jun", days: 0 },
      { month: "Jul", days: 5 },
      { month: "Ago", days: 3 },
      { month: "Sep", days: 2 },
      { month: "Oct", days: 1 },
      { month: "Nov", days: 0 },
      { month: "Dic", days: 0 },
    ],
    requests: [
      {
        id: "VAC001",
        requestDate: "2024-01-10",
        startDate: "2024-01-15",
        endDate: "2024-01-16",
        daysRequested: 2,
        status: "approved",
        reason: "Asuntos personales",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC002",
        requestDate: "2024-02-20",
        startDate: "2024-03-01",
        endDate: "2024-03-03",
        daysRequested: 3,
        status: "approved",
        reason: "Vacaciones familiares",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC003",
        requestDate: "2024-04-01",
        startDate: "2024-04-15",
        endDate: "2024-04-16",
        daysRequested: 2,
        status: "approved",
        reason: "Descanso personal",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC004",
        requestDate: "2024-04-25",
        startDate: "2024-05-06",
        endDate: "2024-05-09",
        daysRequested: 4,
        status: "approved",
        reason: "Viaje familiar",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC005",
        requestDate: "2024-06-15",
        startDate: "2024-07-01",
        endDate: "2024-07-05",
        daysRequested: 5,
        status: "approved",
        reason: "Vacaciones de verano",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC006",
        requestDate: "2024-07-20",
        startDate: "2024-08-12",
        endDate: "2024-08-14",
        daysRequested: 3,
        status: "approved",
        reason: "Descanso",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC007",
        requestDate: "2024-08-25",
        startDate: "2024-09-16",
        endDate: "2024-09-17",
        daysRequested: 2,
        status: "approved",
        reason: "Asuntos familiares",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC008",
        requestDate: "2024-09-30",
        startDate: "2024-10-21",
        endDate: "2024-10-21",
        daysRequested: 1,
        status: "approved",
        reason: "Cita médica",
        approvedBy: "Carlos Mendoza",
      },
    ],
  },
  "maria-garcia": {
    id: "EMP002",
    name: "María García",
    area: "Planta",
    position: "Supervisora de Calidad",
    daysAvailable: 25,
    daysUsed: 18,
    daysPending: 2,
    daysAccumulated: 7,
    daysExpiring: 5,
    expirationDate: "2024-12-31",
    productivity: 92,
    plannedPercentage: 85,
    areaAverage: 19.5,
    monthlyUsage: [
      { month: "Ene", days: 1 },
      { month: "Feb", days: 2 },
      { month: "Mar", days: 3 },
      { month: "Abr", days: 0 },
      { month: "May", days: 2 },
      { month: "Jun", days: 1 },
      { month: "Jul", days: 4 },
      { month: "Ago", days: 3 },
      { month: "Sep", days: 2 },
      { month: "Oct", days: 0 },
      { month: "Nov", days: 0 },
      { month: "Dic", days: 0 },
    ],
    requests: [
      {
        id: "VAC009",
        requestDate: "2024-01-05",
        startDate: "2024-01-22",
        endDate: "2024-01-22",
        daysRequested: 1,
        status: "approved",
        reason: "Trámites personales",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC010",
        requestDate: "2024-02-01",
        startDate: "2024-02-14",
        endDate: "2024-02-15",
        daysRequested: 2,
        status: "approved",
        reason: "Fin de semana largo",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC011",
        requestDate: "2024-02-20",
        startDate: "2024-03-11",
        endDate: "2024-03-13",
        daysRequested: 3,
        status: "approved",
        reason: "Vacaciones cortas",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC012",
        requestDate: "2024-04-15",
        startDate: "2024-05-20",
        endDate: "2024-05-21",
        daysRequested: 2,
        status: "approved",
        reason: "Asuntos familiares",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC013",
        requestDate: "2024-05-25",
        startDate: "2024-06-17",
        endDate: "2024-06-17",
        daysRequested: 1,
        status: "approved",
        reason: "Día personal",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC014",
        requestDate: "2024-06-20",
        startDate: "2024-07-08",
        endDate: "2024-07-11",
        daysRequested: 4,
        status: "approved",
        reason: "Vacaciones de verano",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC015",
        requestDate: "2024-07-25",
        startDate: "2024-08-19",
        endDate: "2024-08-21",
        daysRequested: 3,
        status: "approved",
        reason: "Viaje familiar",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC016",
        requestDate: "2024-08-30",
        startDate: "2024-09-23",
        endDate: "2024-09-24",
        daysRequested: 2,
        status: "approved",
        reason: "Descanso",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC017",
        requestDate: "2024-11-15",
        startDate: "2024-12-16",
        endDate: "2024-12-17",
        daysRequested: 2,
        status: "pending",
        reason: "Vacaciones de fin de año",
        notes: "Pendiente de aprobación por alta demanda en diciembre",
      },
    ],
  },
  "carlos-lopez": {
    id: "EMP003",
    name: "Carlos López",
    area: "Planta",
    position: "Técnico de Mantenimiento",
    daysAvailable: 25,
    daysUsed: 15,
    daysPending: 0,
    daysAccumulated: 10,
    daysExpiring: 8,
    expirationDate: "2024-12-31",
    productivity: 88,
    plannedPercentage: 70,
    areaAverage: 19.5,
    monthlyUsage: [
      { month: "Ene", days: 0 },
      { month: "Feb", days: 1 },
      { month: "Mar", days: 2 },
      { month: "Abr", days: 1 },
      { month: "May", days: 3 },
      { month: "Jun", days: 2 },
      { month: "Jul", days: 3 },
      { month: "Ago", days: 2 },
      { month: "Sep", days: 1 },
      { month: "Oct", days: 0 },
      { month: "Nov", days: 0 },
      { month: "Dic", days: 0 },
    ],
    requests: [
      {
        id: "VAC018",
        requestDate: "2024-02-10",
        startDate: "2024-02-26",
        endDate: "2024-02-26",
        daysRequested: 1,
        status: "approved",
        reason: "Cita médica",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC019",
        requestDate: "2024-03-01",
        startDate: "2024-03-18",
        endDate: "2024-03-19",
        daysRequested: 2,
        status: "approved",
        reason: "Asuntos personales",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC020",
        requestDate: "2024-04-05",
        startDate: "2024-04-22",
        endDate: "2024-04-22",
        daysRequested: 1,
        status: "approved",
        reason: "Día personal",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC021",
        requestDate: "2024-05-01",
        startDate: "2024-05-13",
        endDate: "2024-05-15",
        daysRequested: 3,
        status: "approved",
        reason: "Fin de semana largo",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC022",
        requestDate: "2024-06-10",
        startDate: "2024-06-24",
        endDate: "2024-06-25",
        daysRequested: 2,
        status: "approved",
        reason: "Vacaciones cortas",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC023",
        requestDate: "2024-07-01",
        startDate: "2024-07-15",
        endDate: "2024-07-17",
        daysRequested: 3,
        status: "approved",
        reason: "Vacaciones de verano",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC024",
        requestDate: "2024-08-05",
        startDate: "2024-08-26",
        endDate: "2024-08-27",
        daysRequested: 2,
        status: "approved",
        reason: "Descanso",
        approvedBy: "Carlos Mendoza",
      },
      {
        id: "VAC025",
        requestDate: "2024-09-10",
        startDate: "2024-09-30",
        endDate: "2024-09-30",
        daysRequested: 1,
        status: "approved",
        reason: "Asuntos familiares",
        approvedBy: "Carlos Mendoza",
      },
    ],
  },
};

export default function AttendanceDashboard() {




    const [showPermissionDetail, setShowPermissionDetail] = useState(true)
    const [cardsData, setcardsData] = useState<any>()
  const [selectedArea, setSelectedArea] = useState("Planta");
  const [selectedPeriod, setSelectedPeriod] = useState("Este Mes");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Resumen");
  const [showAttendanceDetail, setShowAttendanceDetail] = useState(false);
  const [showVacationDetail, setShowVacationDetail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeProfile | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [recordsFilter, setRecordsFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(10);
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [selectedVacationEmployee, setSelectedVacationEmployee] =
    useState<EmployeeVacationProfile | null>(null);
  const [showVacationEmployeeModal, setShowVacationEmployeeModal] =
    useState(false);
  const [vacationRecordsFilter, setVacationRecordsFilter] = useState("all");
  const [vacationRecordsPerPage, setVacationRecordsPerPage] = useState(10);
  const [currentVacationPage, setCurrentVacationPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [showAreaCards, setShowAreaCards] = useState(true);
  const [monthlyData, setmonthlyData] = useState<any>();
    const { data: session, status } = useSession();
  // Reset employee page when filters change
  useEffect(() => {
    setCurrentEmployeePage(1);
  }, [selectedArea, searchTerm]);


useEffect(() => {

  if (session?.user.accessToken) {
    const fetchEntryDate = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/requests/assistance-detail-resume", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        console.log(data)
        setcardsData(data as any)

      } catch (err) {
        console.error("Error al obtener la fecha de entrada:", err);
      } finally {
      }
    };

    fetchEntryDate();
  }

  
}, []);


useEffect(() => {

  if (session?.user.accessToken) {
    const fetchEntryDate = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/requests/get-monthly-attendance", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        const newData = await res.json();
        console.log(newData)
        setmonthlyData(newData)
      } catch (err) {
        console.error("Error al obtener la fecha de entrada:", err);
      } finally {
      }
    };

    fetchEntryDate();
  }

  
}, []);

const exportToExcel = ( fileName = "asistencias.xlsx") => {
  // Crea la hoja
  const worksheet = XLSX.utils.json_to_sheet(monthlyData);

  // Crea el libro
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");

  // Genera el archivo
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Guarda el archivo
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, fileName);
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "regular":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "excellent":
        return "Excelente";
      case "good":
        return "Bueno";
      case "regular":
        return "Regular";
      case "poor":
        return "Deficiente";
      default:
        return "N/A";
    }
  };

  const getRecordStatusColor = (status: string) => {
    switch (status) {
      case "on_time":
        return "text-green-600";
      case "late":
        return "text-red-600";
      case "early_departure":
        return "text-orange-600";
      case "absent":
        return "text-red-800";
      case "incomplete":
        return "text-yellow-600";
      case "early_arrival":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getRecordStatusText = (status: string) => {
    switch (status) {
      case "on_time":
        return "A Tiempo";
      case "late":
        return "Llegada Tardía";
      case "early_departure":
        return "Salida Temprana";
      case "absent":
        return "Inasistencia";
      case "incomplete":
        return "Marcaje Incompleto";
      case "early_arrival":
        return "Llegada Temprana";
      default:
        return "N/A";
    }
  };

  const getRecordStatusIcon = (status: string) => {
    switch (status) {
      case "on_time":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "late":
        return <Clock className="h-4 w-4 text-red-600" />;
      case "early_departure":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-800" />;
      case "incomplete":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "early_arrival":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleEmployeeClick = (employeeName: string) => {
    const employeeKey = employeeName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    const profile = employeeProfiles[employeeKey];
    if (profile) {
      setSelectedEmployee(profile);
      setShowEmployeeModal(true);
      setCurrentPage(1);
      setRecordsFilter("all");
      setDateFrom("");
      setDateTo("");
    } else {
      console.log("Perfil no encontrado para:", employeeKey);
    }
  };

  const handleVacationEmployeeClick = (employeeName: string) => {
    const employeeKey = employeeName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    const profile = employeeVacationProfiles[employeeKey];
    if (profile) {
      setSelectedVacationEmployee(profile);
      setShowVacationEmployeeModal(true);
      setCurrentVacationPage(1);
      setVacationRecordsFilter("all");
    } else {
      console.log("Perfil de vacaciones no encontrado para:", employeeKey);
    }
  };

  const getFilteredRecords = () => {
    if (!selectedEmployee) return [];

    let filtered = selectedEmployee.records;

    if (recordsFilter !== "all") {
      filtered = filtered.filter((record) => record.status === recordsFilter);
    }

    if (dateFrom) {
      filtered = filtered.filter((record) => record.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((record) => record.date <= dateTo);
    }

    return filtered;
  };

  const getPaginatedRecords = () => {
    const filtered = getFilteredRecords();
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredRecords();
    return Math.ceil(filtered.length / recordsPerPage);
  };

  const getFilterCount = (filterType: string) => {
    if (!selectedEmployee) return 0;
    if (filterType === "all") return selectedEmployee.records.length;
    return selectedEmployee.records.filter(
      (record) => record.status === filterType
    ).length;
  };

  const getFilteredEmployees = () => {
    const allEmployees = attendanceData
      .filter((area) => selectedArea === "Todas" || area.area === selectedArea)
      .flatMap((area) =>
        area.employees
          .filter(
            (employee) =>
              searchTerm === "" ||
              employee.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((employee) => ({ ...employee, area: area.area }))
      );
    return allEmployees;
  };

  const getPaginatedEmployees = () => {
    const filtered = getFilteredEmployees();
    const startIndex = (currentEmployeePage - 1) * employeesPerPage;
    const endIndex = startIndex + employeesPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalEmployeePages = () => {
    const filtered = getFilteredEmployees();
    return Math.ceil(filtered.length / employeesPerPage);
  };

  const getFilteredVacationRecords = () => {
    if (!selectedVacationEmployee) return [];

    let filtered = selectedVacationEmployee.requests;

    if (vacationRecordsFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.status === vacationRecordsFilter
      );
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  };

  const getPaginatedVacationRecords = () => {
    const filtered = getFilteredVacationRecords();
    const startIndex = (currentVacationPage - 1) * vacationRecordsPerPage;
    const endIndex = startIndex + vacationRecordsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalVacationPages = () => {
    const filtered = getFilteredVacationRecords();
    return Math.ceil(filtered.length / vacationRecordsPerPage);
  };

  const getVacationFilterCount = (filterType: string) => {
    if (!selectedVacationEmployee) return 0;
    if (filterType === "all") return selectedVacationEmployee.requests.length;
    return selectedVacationEmployee.requests.filter(
      (request) => request.status === filterType
    ).length;
  };

  const getVacationStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getVacationStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobada";
      case "rejected":
        return "Rechazada";
      case "pending":
        return "Pendiente";
      default:
        return "N/A";
    }
  };

  const getVacationStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  
  const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

  if (!isClient) {return null}else{
    if (showAttendanceDetail) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAttendanceDetail(false)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Resumen
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Detalle de Asistencias
                  </h1>
                  <p className="text-gray-600">
                    Análisis detallado por área y empleado
                  </p>
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
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAreaCards(!showAreaCards)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  {showAreaCards ? "Ocultar Tarjetas" : "Mostrar Tarjetas"}
                  {showAreaCards ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button onClick={()=>exportToExcel()} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Detalle
                </Button>
              </div>
            </div>
  
            {/* Filters - Collapsible */}
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
                    <SelectItem value="Hoy">Hoy</SelectItem>
                    <SelectItem value="Esta Semana">Esta Semana</SelectItem>
                    <SelectItem value="Este Mes">Este Mes</SelectItem>
                    <SelectItem value="Último Trimestre">
                      Último Trimestre
                    </SelectItem>
                    <SelectItem value="Este Año">Este Año</SelectItem>
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
  
            {/* Area Overview Cards - Collapsible */}
            {showAreaCards && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-300 ease-in-out">
                {/* Todas las Áreas Card */}
                <Card
                  className={`hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                    selectedArea === "Todas"
                      ? "ring-2 ring-purple-500 bg-purple-50 shadow-md"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedArea("Todas");
                    setCurrentEmployeePage(1);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        Todas las Áreas
                        <span className="text-xs text-purple-600 opacity-70">
                          Click para ver todas
                        </span>
                      </CardTitle>
                      <Users className="h-4 w-4 text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="default"
                          className="text-xs bg-purple-100 text-purple-800"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          General
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Promedio</span>
                          <span className="font-medium">
                              {(() => {
      const areasObjetivo = ["Planta", "Control de Calidad", "Mantenimiento"];
  
      const filtradas =
  Array.isArray(cardsData) && cardsData.length > 0
    ? cardsData.filter((area: any) =>
        areasObjetivo.includes(area.txt_nombre_area)
      )
    : [];
  
      const totalEmpleados = filtradas.reduce(
        (acc:any, area:any) => acc + area.total_empleados,
        0
      );
  
      const totalAsistencias = filtradas.reduce((acc:any, area:any) => {
        switch (selectedPeriod) {
          case "Hoy":
              console.log("Que es acc:",)
            return acc + area.asistencias_hoy;
          case "Esta Semana":
            return acc + area.asistencias_ayer;
          case "Este Mes":
            return acc + area.semana_actual;
          case "Último Trimestre":
            return acc + area.mes_actual;
          case "Este Año":
            return acc + area.trimestre_actual;
          default:
            return acc;
        }
      }, 0);
  
      const porcentaje = totalEmpleados
        ? Math.round((totalAsistencias * 100) / totalEmpleados)
        : 0;
  
      return `${porcentaje}%`;
    })()}
                          </span>
                        </div>
                        <Progress
                          value={Math.round(
                            attendanceData.reduce(
                              (acc, area) => acc + area.percentage,
                              0
                            ) / attendanceData.length
                          )}
                          className="h-2"
                        />
                      </div>
                      <div className="text-xs text-gray-500 text-center pt-2 border-t">
                        {attendanceData.reduce(
                          (acc, area) => acc + area.employees.length,
                          0
                        )}{" "}
                        empleados total
                      </div>
                    </div>
                  </CardContent>
                </Card>
  
                {/* Individual Area Cards */}
                {attendanceData.map((area) => (
                  <Card
                    key={area.area}
                    className={`hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                      selectedArea === area.area
                        ? "ring-2 ring-blue-500 bg-blue-50 shadow-md"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedArea(area.area);
                      setCurrentEmployeePage(1);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          {area.area}
                          <span className="text-xs text-blue-600 opacity-70">
                            Click para filtrar
                          </span>
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={area.trend >= 0 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {area.trend >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(area.trend)}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Asistencia</span>
                            <span className="font-medium">
                              {area.percentage}%
                            </span>
                          </div>
                          <Progress value={area.percentage} className="h-2" />
                        </div>
                        <div className="text-xs text-gray-500 text-center pt-2 border-t">
                          {area.employees.length} empleados
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
  
            {/* Current Filter Summary - Always visible when filters are hidden */}
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
                  <Badge variant="secondary" className="text-xs">
                    {getFilteredEmployees().length} empleados encontrados
                  </Badge>
                </div>
              </div>
            )}
  
            {/* Detailed Employee List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Detalle por Empleado -{" "}
                  {selectedArea === "Todas" ? "Todas las Áreas" : selectedArea}
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
                          setEmployeesPerPage(Number.parseInt(value));
                          setCurrentEmployeePage(1);
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
                        Total: {getFilteredEmployees().length} empleados
                      </div>
                    </div>
                  </div>
  
                  {/* Employee List */}
                  <div className="space-y-3">
                    {getPaginatedEmployees().length > 0 ? (
                      getPaginatedEmployees().map((employee, index) => (
                        <div
                          key={`${employee.area}-${employee.name}-${index}`}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                          onClick={() => handleEmployeeClick(employee.name)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                {employee.name}
                                <span className="text-xs text-blue-600 opacity-70">
                                  Click para ver detalles
                                </span>
                              </p>
                              <p className="text-sm text-gray-500">
                                {employee.area}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                {employee.attendance}%
                              </p>
                              <p className="text-sm text-gray-500">Asistencia</p>
                            </div>
                            <Badge className={getStatusColor(employee.status)}>
                              {getStatusText(employee.status)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No se encontraron empleados con los filtros aplicados
                      </div>
                    )}
                  </div>
  
                  {/* Pagination */}
                  {getTotalEmployeePages() > 1 && (
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Mostrando{" "}
                        {(currentEmployeePage - 1) * employeesPerPage + 1} a{" "}
                        {Math.min(
                          currentEmployeePage * employeesPerPage,
                          getFilteredEmployees().length
                        )}{" "}
                        de {getFilteredEmployees().length} empleados
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                setCurrentEmployeePage(
                                  Math.max(1, currentEmployeePage - 1)
                                )
                              }
                              className={
                                currentEmployeePage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {Array.from(
                            { length: getTotalEmployeePages() },
                            (_, i) => i + 1
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
                                    getTotalEmployeePages(),
                                    currentEmployeePage + 1
                                  )
                                )
                              }
                              className={
                                currentEmployeePage === getTotalEmployeePages()
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                Perfil de Empleado
              </DialogTitle>
            </DialogHeader>
  
            {selectedEmployee && (
              <div className="space-y-6">
                {/* Employee Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Información Personal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Nombre:</span>
                        <span>{selectedEmployee.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Área:</span>
                        <span>{selectedEmployee.area}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Jefe:</span>
                        <span>{selectedEmployee.supervisor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Cargo:</span>
                        <span>{selectedEmployee.position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">ID: {selectedEmployee.id}</Badge>
                      </div>
                    </CardContent>
                  </Card>
  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Métricas de Asistencia
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Asistencia General
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={selectedEmployee.attendanceRate}
                            className="w-20 h-2"
                          />
                          <span className="font-semibold">
                            {selectedEmployee.attendanceRate}%
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Llegadas Tardías
                        </span>
                        <Badge variant="destructive">
                          {selectedEmployee.lateArrivals}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Ausencias</span>
                        <Badge variant="destructive">
                          {selectedEmployee.absences}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
  
                {/* Records Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Historial de Marcajes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Filter Controls */}
                      <div className="flex flex-wrap gap-4 items-center">
                        <Select
                          value={recordsFilter}
                          onValueChange={setRecordsFilter}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrar por estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              Todos ({getFilterCount("all")})
                            </SelectItem>
                            <SelectItem value="on_time">
                              A Tiempo ({getFilterCount("on_time")})
                            </SelectItem>
                            <SelectItem value="late">
                              Llegadas Tardías ({getFilterCount("late")})
                            </SelectItem>
                            <SelectItem value="early_departure">
                              Salidas Tempranas (
                              {getFilterCount("early_departure")})
                            </SelectItem>
                            <SelectItem value="absent">
                              Inasistencias ({getFilterCount("absent")})
                            </SelectItem>
                            <SelectItem value="incomplete">
                              Marcajes Incompletos ({getFilterCount("incomplete")}
                              )
                            </SelectItem>
                            <SelectItem value="early_arrival">
                              Llegadas Tempranas (
                              {getFilterCount("early_arrival")})
                            </SelectItem>
                          </SelectContent>
                        </Select>
  
                        <div className="flex gap-2 items-center">
                          <CalendarDays className="h-4 w-4 text-gray-500" />
                          <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-40"
                            placeholder="Desde"
                          />
                          <span className="text-gray-500">hasta</span>
                          <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-40"
                            placeholder="Hasta"
                          />
                        </div>
  
                        <Select
                          value={recordsPerPage.toString()}
                          onValueChange={(value) =>
                            setRecordsPerPage(Number.parseInt(value))
                          }
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
                            setRecordsFilter("all");
                            setDateFrom("");
                            setDateTo("");
                            setCurrentPage(1);
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
                              <TableHead>Fecha</TableHead>
                              <TableHead>Entrada</TableHead>
                              <TableHead>Salida</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Notas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getPaginatedRecords().map((record) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">
                                  {record.date}
                                </TableCell>
                                <TableCell>{record.entryTime || "-"}</TableCell>
                                <TableCell>{record.exitTime || "-"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getRecordStatusIcon(record.status)}
                                    <span
                                      className={getRecordStatusColor(
                                        record.status
                                      )}
                                    >
                                      {getRecordStatusText(record.status)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {record.notes || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                            {getPaginatedRecords().length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center py-8 text-gray-500"
                                >
                                  No se encontraron registros con los filtros
                                  aplicados
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
  
                      {/* Pagination */}
                      {getTotalPages() > 1 && (
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Mostrando {(currentPage - 1) * recordsPerPage + 1} a{" "}
                            {Math.min(
                              currentPage * recordsPerPage,
                              getFilteredRecords().length
                            )}{" "}
                            de {getFilteredRecords().length} registros
                          </div>
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                  }
                                  className={
                                    currentPage === 1
                                      ? "pointer-events-none opacity-50"
                                      : "cursor-pointer"
                                  }
                                />
                              </PaginationItem>
                              {Array.from(
                                { length: getTotalPages() },
                                (_, i) => i + 1
                              ).map((page) => (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationItem>
                                <PaginationNext
                                  onClick={() =>
                                    setCurrentPage(
                                      Math.min(getTotalPages(), currentPage + 1)
                                    )
                                  }
                                  className={
                                    currentPage === getTotalPages()
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
      );
    }
  };


  if (showVacationDetail) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVacationDetail(false)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Resumen
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Análisis de Uso de Vacaciones
                </h1>
                <p className="text-gray-600">
                  Análisis detallado del uso de vacaciones por área y empleado
                </p>
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
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAreaCards(!showAreaCards)}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {showAreaCards ? "Ocultar Métricas" : "Mostrar Métricas"}
                {showAreaCards ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
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
                  <SelectItem value="Último Trimestre">
                    Último Trimestre
                  </SelectItem>
                  <SelectItem value="Este Año">Este Año</SelectItem>
                  <SelectItem value="Año Anterior">Año Anterior</SelectItem>
                  <SelectItem value="Comparación Interanual">
                    Comparación Interanual
                  </SelectItem>
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

          {/* Vacation Metrics Cards */}
          {showAreaCards && (
            <div className="space-y-6 mb-8 transition-all duration-300 ease-in-out">
              {/* Top Level Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Uso Total de Vacaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      {vacationData.reduce(
                        (acc, area) => acc + area.usagePercentage,
                        0
                      ) / vacationData.length}
                      %
                    </div>
                    <p className="text-sm text-blue-700">Promedio general</p>
                    <div className="mt-2">
                      <Progress
                        value={
                          vacationData.reduce(
                            (acc, area) => acc + area.usagePercentage,
                            0
                          ) / vacationData.length
                        }
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Promedio por Empleado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {(
                        vacationData.reduce(
                          (acc, area) => acc + area.averageDaysPerEmployee,
                          0
                        ) / vacationData.length
                      ).toFixed(1)}{" "}
                      días
                    </div>
                    <p className="text-sm text-green-700">Por colaborador</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Días Acumulados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">
                      {vacationData.reduce(
                        (acc, area) => acc + area.accumulatedDays,
                        0
                      )}
                    </div>
                    <p className="text-sm text-orange-700">Total sin usar</p>
                    <div className="text-xs text-orange-600 mt-1">
                      {Math.round(
                        vacationData.reduce(
                          (acc, area) => acc + area.accumulationPercentage,
                          0
                        ) / vacationData.length
                      )}
                      % acumulación
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Planificación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {Math.round(
                        vacationData.reduce(
                          (acc, area) => acc + area.plannedVsLastMinute.planned,
                          0
                        ) / vacationData.length
                      )}
                      %
                    </div>
                    <p className="text-sm text-purple-700">Planificadas</p>
                    <div className="text-xs text-purple-600 mt-1">
                      vs{" "}
                      {Math.round(
                        vacationData.reduce(
                          (acc, area) =>
                            acc + area.plannedVsLastMinute.lastMinute,
                          0
                        ) / vacationData.length
                      )}
                      % último momento
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Area Comparison Cards */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análisis por Área
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {vacationData.map((area) => (
                    <Card
                      key={area.area}
                      className={`hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                        selectedArea === area.area
                          ? "ring-2 ring-blue-500 bg-blue-50 shadow-md"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedArea(area.area);
                        setCurrentEmployeePage(1);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {area.area}
                          </CardTitle>
                          <Building2 className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Uso</span>
                            <span className="font-medium">
                              {area.usagePercentage}%
                            </span>
                          </div>
                          <Progress
                            value={area.usagePercentage}
                            className="h-2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold text-blue-800">
                              {area.averageDaysPerEmployee}
                            </div>
                            <div className="text-blue-600">Promedio</div>
                          </div>
                          <div className="text-center p-2 bg-orange-50 rounded">
                            <div className="font-semibold text-orange-800">
                              {area.accumulatedDays}
                            </div>
                            <div className="text-orange-600">Acumulados</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <Badge
                            variant={
                              area.trend >= 0 ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {area.trend >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(area.trend)}%
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {area.totalEmployees} empleados
                          </span>
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
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Áreas con Mayor Uso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vacationData
                        .sort((a, b) => b.usagePercentage - a.usagePercentage)
                        .slice(0, 3)
                        .map((area, index) => (
                          <div
                            key={area.area}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-800">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {area.area}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {area.averageDaysPerEmployee} días promedio
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-800">
                                {area.usagePercentage}%
                              </p>
                              <p className="text-xs text-green-600">
                                uso total
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      Áreas con Menor Uso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vacationData
                        .sort((a, b) => a.usagePercentage - b.usagePercentage)
                        .slice(0, 3)
                        .map((area, index) => (
                          <div
                            key={area.area}
                            className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-800">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {area.area}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {area.accumulatedDays} días acumulados
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-800">
                                {area.usagePercentage}%
                              </p>
                              <p className="text-xs text-red-600">uso total</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Employee Vacation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Detalle de Vacaciones por Empleado -{" "}
                {selectedArea === "Todas" ? "Todas las Áreas" : selectedArea}
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
                        setEmployeesPerPage(Number.parseInt(value));
                        setCurrentEmployeePage(1);
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
                      {vacationData
                        .filter(
                          (area) =>
                            selectedArea === "Todas" ||
                            area.area === selectedArea
                        )
                        .reduce(
                          (acc, area) => acc + area.employees.length,
                          0
                        )}{" "}
                      empleados
                    </div>
                  </div>
                </div>

                {/* Employee Vacation List */}
                <div className="space-y-3">
                  {vacationData
                    .filter(
                      (area) =>
                        selectedArea === "Todas" || area.area === selectedArea
                    )
                    .flatMap((area) =>
                      area.employees
                        .filter(
                          (employee) =>
                            searchTerm === "" ||
                            employee.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        )
                        .map((employee) => ({ ...employee, area: area.area }))
                    )
                    .slice(
                      (currentEmployeePage - 1) * employeesPerPage,
                      currentEmployeePage * employeesPerPage
                    )
                    .map((employee, index) => (
                      <div
                        key={`${employee.area}-${employee.name}-${index}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 cursor-pointer"
                        onClick={() =>
                          handleVacationEmployeeClick(employee.name)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Plane className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {employee.area}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="font-semibold text-lg text-blue-600">
                              {employee.daysUsed}
                            </p>
                            <p className="text-xs text-gray-500">días usados</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-lg text-orange-600">
                              {employee.daysAccumulated}
                            </p>
                            <p className="text-xs text-gray-500">acumulados</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-lg text-green-600">
                              {employee.plannedPercentage}%
                            </p>
                            <p className="text-xs text-gray-500">
                              planificadas
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-lg text-purple-600">
                              {employee.productivity}%
                            </p>
                            <p className="text-xs text-gray-500">
                              productividad
                            </p>
                          </div>
                          <div className="w-20">
                            <Progress
                              value={
                                (employee.daysUsed / employee.daysAvailable) *
                                100
                              }
                              className="h-2"
                            />
                            <p className="text-xs text-gray-500 text-center mt-1">
                              {Math.round(
                                (employee.daysUsed / employee.daysAvailable) *
                                  100
                              )}
                              % uso
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Pagination */}
                {Math.ceil(
                  vacationData
                    .filter(
                      (area) =>
                        selectedArea === "Todas" || area.area === selectedArea
                    )
                    .reduce((acc, area) => acc + area.employees.length, 0) /
                    employeesPerPage
                ) > 1 && (
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Mostrando{" "}
                      {(currentEmployeePage - 1) * employeesPerPage + 1} a{" "}
                      {Math.min(
                        currentEmployeePage * employeesPerPage,
                        vacationData
                          .filter(
                            (area) =>
                              selectedArea === "Todas" ||
                              area.area === selectedArea
                          )
                          .reduce((acc, area) => acc + area.employees.length, 0)
                      )}{" "}
                      de{" "}
                      {vacationData
                        .filter(
                          (area) =>
                            selectedArea === "Todas" ||
                            area.area === selectedArea
                        )
                        .reduce(
                          (acc, area) => acc + area.employees.length,
                          0
                        )}{" "}
                      empleados
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentEmployeePage(
                                Math.max(1, currentEmployeePage - 1)
                              )
                            }
                            className={
                              currentEmployeePage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          {
                            length: Math.ceil(
                              vacationData
                                .filter(
                                  (area) =>
                                    selectedArea === "Todas" ||
                                    area.area === selectedArea
                                )
                                .reduce(
                                  (acc, area) => acc + area.employees.length,
                                  0
                                ) / employeesPerPage
                            ),
                          },
                          (_, i) => i + 1
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
                                    vacationData
                                      .filter(
                                        (area) =>
                                          selectedArea === "Todas" ||
                                          area.area === selectedArea
                                      )
                                      .reduce(
                                        (acc, area) =>
                                          acc + area.employees.length,
                                        0
                                      ) / employeesPerPage
                                  ),
                                  currentEmployeePage + 1
                                )
                              )
                            }
                            className={
                              currentEmployeePage ===
                              Math.ceil(
                                vacationData
                                  .filter(
                                    (area) =>
                                      selectedArea === "Todas" ||
                                      area.area === selectedArea
                                  )
                                  .reduce(
                                    (acc, area) => acc + area.employees.length,
                                    0
                                  ) / employeesPerPage
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
        {/* Vacation Employee Detail Modal */}
      <Dialog
        open={showVacationEmployeeModal}
        onOpenChange={setShowVacationEmployeeModal}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              Perfil de Vacaciones - {selectedVacationEmployee?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedVacationEmployee && (
            <div className="space-y-6">
              {/* Vacation Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Días Disponibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      {selectedVacationEmployee.daysAvailable}
                    </div>
                    <p className="text-sm text-blue-700">Total asignados</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Días Tomados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {selectedVacationEmployee.daysUsed}
                    </div>
                    <p className="text-sm text-green-700">Ya utilizados</p>
                    <div className="mt-2">
                      <Progress
                        value={
                          (selectedVacationEmployee.daysUsed /
                            selectedVacationEmployee.daysAvailable) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pendientes por Aprobar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-900">
                      {selectedVacationEmployee.daysPending}
                    </div>
                    <p className="text-sm text-yellow-700">En proceso</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Días Acumulados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">
                      {selectedVacationEmployee.daysAccumulated}
                    </div>
                    <p className="text-sm text-orange-700">Sin usar</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expiration Warning */}
              {selectedVacationEmployee.daysExpiring > 0 && (
                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-red-900">
                          ⚠️ Días por Vencer
                        </h3>
                        <p className="text-red-700">
                          Tienes{" "}
                          <strong>
                            {selectedVacationEmployee.daysExpiring} días
                          </strong>{" "}
                          que vencerán el{" "}
                          <strong>
                            {selectedVacationEmployee.expirationDate}
                          </strong>
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          Te recomendamos planificar tus vacaciones para no
                          perder estos días.
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
                      <div className="text-2xl font-bold text-blue-800">
                        {selectedVacationEmployee.daysUsed}
                      </div>
                      <div className="text-sm text-blue-600">
                        Tus días tomados
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">
                        {selectedVacationEmployee.areaAverage}
                      </div>
                      <div className="text-sm text-gray-600">
                        Promedio en {selectedVacationEmployee.area}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-800">
                        {selectedVacationEmployee.daysUsed >
                        selectedVacationEmployee.areaAverage
                          ? "+"
                          : ""}
                        {(
                          selectedVacationEmployee.daysUsed -
                          selectedVacationEmployee.areaAverage
                        ).toFixed(1)}
                      </div>
                      <div className="text-sm text-purple-600">Diferencia</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {selectedVacationEmployee.daysUsed >
                      selectedVacationEmployee.areaAverage
                        ? "🎉 Estás tomando más vacaciones que el promedio de tu área. ¡Excelente balance vida-trabajo!"
                        : selectedVacationEmployee.daysUsed <
                          selectedVacationEmployee.areaAverage
                        ? "💡 Estás por debajo del promedio de tu área. Considera planificar más tiempo de descanso."
                        : "✅ Estás en línea con el promedio de tu área."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Evolución del Uso de Vacaciones (2024)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedVacationEmployee.monthlyUsage.map((month) => (
                      <div
                        key={month.month}
                        className="flex items-center gap-4"
                      >
                        <div className="w-12 text-sm font-medium text-gray-600">
                          {month.month}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div
                                className="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{
                                  width: `${Math.max(
                                    (month.days / 5) * 100,
                                    month.days > 0 ? 20 : 0
                                  )}%`,
                                }}
                              >
                                {month.days > 0 && month.days}
                              </div>
                            </div>
                            <div className="w-16 text-sm text-gray-600">
                              {month.days} día{month.days !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Meses con más vacaciones:</strong>{" "}
                      {selectedVacationEmployee.monthlyUsage
                        .filter((m) => m.days > 0)
                        .sort((a, b) => b.days - a.days)
                        .slice(0, 3)
                        .map((m) => `${m.month} (${m.days})`)
                        .join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Vacation History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Historial de Solicitudes de Vacaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-4 items-center">
                      <Select
                        value={vacationRecordsFilter}
                        onValueChange={setVacationRecordsFilter}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Todas ({getVacationFilterCount("all")})
                          </SelectItem>
                          <SelectItem value="approved">
                            Aprobadas ({getVacationFilterCount("approved")})
                          </SelectItem>
                          <SelectItem value="pending">
                            Pendientes ({getVacationFilterCount("pending")})
                          </SelectItem>
                          <SelectItem value="rejected">
                            Rechazadas ({getVacationFilterCount("rejected")})
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={vacationRecordsPerPage.toString()}
                        onValueChange={(value) =>
                          setVacationRecordsPerPage(Number.parseInt(value))
                        }
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
                          setVacationRecordsFilter("all");
                          setCurrentVacationPage(1);
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
                            <TableHead>Días</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Aprobado Por</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPaginatedVacationRecords().map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {request.requestDate}
                              </TableCell>
                              <TableCell>
                                {request.startDate === request.endDate
                                  ? request.startDate
                                  : `${request.startDate} - ${request.endDate}`}
                              </TableCell>
                              <TableCell className="text-center">
                                {request.daysRequested}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getVacationStatusIcon(request.status)}
                                  <span
                                    className={getVacationStatusColor(
                                      request.status
                                    )}
                                  >
                                    {getVacationStatusText(request.status)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {request.reason}
                              </TableCell>
                              <TableCell className="text-sm">
                                {request.approvedBy || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                          {getPaginatedVacationRecords().length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-8 text-gray-500"
                              >
                                No se encontraron solicitudes con los filtros
                                aplicados
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {getTotalVacationPages() > 1 && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Mostrando{" "}
                          {(currentVacationPage - 1) * vacationRecordsPerPage +
                            1}{" "}
                          a{" "}
                          {Math.min(
                            currentVacationPage * vacationRecordsPerPage,
                            getFilteredVacationRecords().length
                          )}{" "}
                          de {getFilteredVacationRecords().length} solicitudes
                        </div>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setCurrentVacationPage(
                                    Math.max(1, currentVacationPage - 1)
                                  )
                                }
                                className={
                                  currentVacationPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                            {Array.from(
                              { length: getTotalVacationPages() },
                              (_, i) => i + 1
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentVacationPage(page)}
                                  isActive={currentVacationPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setCurrentVacationPage(
                                    Math.min(
                                      getTotalVacationPages(),
                                      currentVacationPage + 1
                                    )
                                  )
                                }
                                className={
                                  currentVacationPage ===
                                  getTotalVacationPages()
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
    );
  }

 

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <PermissionsDashboard setShowPermissionDetail={setShowPermissionDetail} showPermissionDetail={showPermissionDetail}></PermissionsDashboard>  
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Estadísticas y Asistencia
            </h1>
            <p className="text-gray-600 mt-1">
              Monitorea la asistencia y métricas de rendimiento de empleados
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-48">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
              <SelectItem value="Hoy">Hoy</SelectItem>
              <SelectItem value="Esta Semana">Esta Semana</SelectItem>
              <SelectItem value="Este Mes">Este Mes</SelectItem>
              <SelectItem value="Último Trimestre">Último Trimestre</SelectItem>
              <SelectItem value="Este Año">Este Año</SelectItem>
            </SelectContent>
          </Select>

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

       

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Asistencia Card - Clickable */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-300"
            onClick={() => setShowAttendanceDetail(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Asistencia
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 mr-2">94.2%</span>
                <Badge
                  variant="default"
                  className="text-xs bg-green-100 text-green-800"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  2.1%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Uso de Vacaciones Card - Clickable */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-300"
            onClick={() => setShowVacationDetail(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Uso de Vacaciones
              </CardTitle>
              <Plane className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 mr-2">17.6%</span>
                <Badge
                  variant="default"
                  className="text-xs bg-red-100 text-red-800"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  3.2%
                </Badge>
              </div>
            </CardContent>
          </Card>

          

          {/* Solicitudes de Permisos Card */}
          <Card 
           onClick={() => setShowAttendanceDetail(true)}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Solicitudes de Permisos
              </CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 mr-2">6.7%</span>
                <Badge
                  variant="destructive"
                  className="text-xs bg-green-100 text-green-800"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  0.5%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Employee Detail Modal */}
      <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              Perfil de Empleado
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Nombre:</span>
                      <span>{selectedEmployee.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Área:</span>
                      <span>{selectedEmployee.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Jefe:</span>
                      <span>{selectedEmployee.supervisor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Cargo:</span>
                      <span>{selectedEmployee.position}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">ID: {selectedEmployee.id}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Métricas de Asistencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Asistencia General
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={selectedEmployee.attendanceRate}
                          className="w-20 h-2"
                        />
                        <span className="font-semibold">
                          {selectedEmployee.attendanceRate}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Llegadas Tardías
                      </span>
                      <Badge variant="destructive">
                        {selectedEmployee.lateArrivals}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ausencias</span>
                      <Badge variant="destructive">
                        {selectedEmployee.absences}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Records Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Historial de Marcajes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-4 items-center">
                      <Select
                        value={recordsFilter}
                        onValueChange={setRecordsFilter}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Todos ({getFilterCount("all")})
                          </SelectItem>
                          <SelectItem value="on_time">
                            A Tiempo ({getFilterCount("on_time")})
                          </SelectItem>
                          <SelectItem value="late">
                            Llegadas Tardías ({getFilterCount("late")})
                          </SelectItem>
                          <SelectItem value="early_departure">
                            Salidas Tempranas (
                            {getFilterCount("early_departure")})
                          </SelectItem>
                          <SelectItem value="absent">
                            Inasistencias ({getFilterCount("absent")})
                          </SelectItem>
                          <SelectItem value="incomplete">
                            Marcajes Incompletos ({getFilterCount("incomplete")}
                            )
                          </SelectItem>
                          <SelectItem value="early_arrival">
                            Llegadas Tempranas (
                            {getFilterCount("early_arrival")})
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2 items-center">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-40"
                          placeholder="Desde"
                        />
                        <span className="text-gray-500">hasta</span>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-40"
                          placeholder="Hasta"
                        />
                      </div>

                      <Select
                        value={recordsPerPage.toString()}
                        onValueChange={(value) =>
                          setRecordsPerPage(Number.parseInt(value))
                        }
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
                          setRecordsFilter("all");
                          setDateFrom("");
                          setDateTo("");
                          setCurrentPage(1);
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
                            <TableHead>Fecha</TableHead>
                            <TableHead>Entrada</TableHead>
                            <TableHead>Salida</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Notas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPaginatedRecords().map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">
                                {record.date}
                              </TableCell>
                              <TableCell>{record.entryTime || "-"}</TableCell>
                              <TableCell>{record.exitTime || "-"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getRecordStatusIcon(record.status)}
                                  <span
                                    className={getRecordStatusColor(
                                      record.status
                                    )}
                                  >
                                    {getRecordStatusText(record.status)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {record.notes || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                          {getPaginatedRecords().length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-gray-500"
                              >
                                No se encontraron registros con los filtros
                                aplicados
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {getTotalPages() > 1 && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Mostrando {(currentPage - 1) * recordsPerPage + 1} a{" "}
                          {Math.min(
                            currentPage * recordsPerPage,
                            getFilteredRecords().length
                          )}{" "}
                          de {getFilteredRecords().length} registros
                        </div>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                className={
                                  currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                            {Array.from(
                              { length: getTotalPages() },
                              (_, i) => i + 1
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setCurrentPage(
                                    Math.min(getTotalPages(), currentPage + 1)
                                  )
                                }
                                className={
                                  currentPage === getTotalPages()
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

      {/* Vacation Employee Detail Modal */}
      <Dialog
        open={showVacationEmployeeModal}
        onOpenChange={setShowVacationEmployeeModal}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              Perfil de Vacaciones - {selectedVacationEmployee?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedVacationEmployee && (
            <div className="space-y-6">
              {/* Vacation Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Días Disponibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      {selectedVacationEmployee.daysAvailable}
                    </div>
                    <p className="text-sm text-blue-700">Total asignados</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Días Tomados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {selectedVacationEmployee.daysUsed}
                    </div>
                    <p className="text-sm text-green-700">Ya utilizados</p>
                    <div className="mt-2">
                      <Progress
                        value={
                          (selectedVacationEmployee.daysUsed /
                            selectedVacationEmployee.daysAvailable) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pendientes por Aprobar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-900">
                      {selectedVacationEmployee.daysPending}
                    </div>
                    <p className="text-sm text-yellow-700">En proceso</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Días Acumulados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">
                      {selectedVacationEmployee.daysAccumulated}
                    </div>
                    <p className="text-sm text-orange-700">Sin usar</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expiration Warning */}
              {selectedVacationEmployee.daysExpiring > 0 && (
                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-red-900">
                          ⚠️ Días por Vencer
                        </h3>
                        <p className="text-red-700">
                          Tienes{" "}
                          <strong>
                            {selectedVacationEmployee.daysExpiring} días
                          </strong>{" "}
                          que vencerán el{" "}
                          <strong>
                            {selectedVacationEmployee.expirationDate}
                          </strong>
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          Te recomendamos planificar tus vacaciones para no
                          perder estos días.
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
                      <div className="text-2xl font-bold text-blue-800">
                        {selectedVacationEmployee.daysUsed}
                      </div>
                      <div className="text-sm text-blue-600">
                        Tus días tomados
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">
                        {selectedVacationEmployee.areaAverage}
                      </div>
                      <div className="text-sm text-gray-600">
                        Promedio en {selectedVacationEmployee.area}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-800">
                        {selectedVacationEmployee.daysUsed >
                        selectedVacationEmployee.areaAverage
                          ? "+"
                          : ""}
                        {(
                          selectedVacationEmployee.daysUsed -
                          selectedVacationEmployee.areaAverage
                        ).toFixed(1)}
                      </div>
                      <div className="text-sm text-purple-600">Diferencia</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {selectedVacationEmployee.daysUsed >
                      selectedVacationEmployee.areaAverage
                        ? "🎉 Estás tomando más vacaciones que el promedio de tu área. ¡Excelente balance vida-trabajo!"
                        : selectedVacationEmployee.daysUsed <
                          selectedVacationEmployee.areaAverage
                        ? "💡 Estás por debajo del promedio de tu área. Considera planificar más tiempo de descanso."
                        : "✅ Estás en línea con el promedio de tu área."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Evolución del Uso de Vacaciones (2024)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedVacationEmployee.monthlyUsage.map((month) => (
                      <div
                        key={month.month}
                        className="flex items-center gap-4"
                      >
                        <div className="w-12 text-sm font-medium text-gray-600">
                          {month.month}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div
                                className="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{
                                  width: `${Math.max(
                                    (month.days / 5) * 100,
                                    month.days > 0 ? 20 : 0
                                  )}%`,
                                }}
                              >
                                {month.days > 0 && month.days}
                              </div>
                            </div>
                            <div className="w-16 text-sm text-gray-600">
                              {month.days} día{month.days !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Meses con más vacaciones:</strong>{" "}
                      {selectedVacationEmployee.monthlyUsage
                        .filter((m) => m.days > 0)
                        .sort((a, b) => b.days - a.days)
                        .slice(0, 3)
                        .map((m) => `${m.month} (${m.days})`)
                        .join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Vacation History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Historial de Solicitudes de Vacaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-4 items-center">
                      <Select
                        value={vacationRecordsFilter}
                        onValueChange={setVacationRecordsFilter}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            Todas ({getVacationFilterCount("all")})
                          </SelectItem>
                          <SelectItem value="approved">
                            Aprobadas ({getVacationFilterCount("approved")})
                          </SelectItem>
                          <SelectItem value="pending">
                            Pendientes ({getVacationFilterCount("pending")})
                          </SelectItem>
                          <SelectItem value="rejected">
                            Rechazadas ({getVacationFilterCount("rejected")})
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={vacationRecordsPerPage.toString()}
                        onValueChange={(value) =>
                          setVacationRecordsPerPage(Number.parseInt(value))
                        }
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
                          setVacationRecordsFilter("all");
                          setCurrentVacationPage(1);
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
                            <TableHead>Días</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Aprobado Por</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPaginatedVacationRecords().map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {request.requestDate}
                              </TableCell>
                              <TableCell>
                                {request.startDate === request.endDate
                                  ? request.startDate
                                  : `${request.startDate} - ${request.endDate}`}
                              </TableCell>
                              <TableCell className="text-center">
                                {request.daysRequested}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getVacationStatusIcon(request.status)}
                                  <span
                                    className={getVacationStatusColor(
                                      request.status
                                    )}
                                  >
                                    {getVacationStatusText(request.status)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {request.reason}
                              </TableCell>
                              <TableCell className="text-sm">
                                {request.approvedBy || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                          {getPaginatedVacationRecords().length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-8 text-gray-500"
                              >
                                No se encontraron solicitudes con los filtros
                                aplicados
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {getTotalVacationPages() > 1 && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Mostrando{" "}
                          {(currentVacationPage - 1) * vacationRecordsPerPage +
                            1}{" "}
                          a{" "}
                          {Math.min(
                            currentVacationPage * vacationRecordsPerPage,
                            getFilteredVacationRecords().length
                          )}{" "}
                          de {getFilteredVacationRecords().length} solicitudes
                        </div>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setCurrentVacationPage(
                                    Math.max(1, currentVacationPage - 1)
                                  )
                                }
                                className={
                                  currentVacationPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                            {Array.from(
                              { length: getTotalVacationPages() },
                              (_, i) => i + 1
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentVacationPage(page)}
                                  isActive={currentVacationPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setCurrentVacationPage(
                                    Math.min(
                                      getTotalVacationPages(),
                                      currentVacationPage + 1
                                    )
                                  )
                                }
                                className={
                                  currentVacationPage ===
                                  getTotalVacationPages()
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
  );
}
