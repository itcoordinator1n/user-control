"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Filter,
  ImageIcon,
  MessageSquare,
  Search,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
// xlsx removido — el Excel lo genera el backend

// Add line-clamp utility for text truncation
import "../../../globals.css";
import { useSession } from "next-auth/react";
import { WaitModal } from "../../vacations-permits/components/wait-modal";

interface PermitRequest {
  id: string;
  employeeName: string;
  date: string;
  timeRange: string;
  reason: string;
  tipo?: "permiso" | "incapacidad" | "duelo";
  compensatorio?: boolean;
  startDateTime?: string;
  endDateTime?: string;
  status: "Pendiente" | "Aprovada" | "Rechazada";
  approver: string;
  submittedDate: string;
  responseDate?: string;
  comments?: string;
  employeeComments?: string;
  department: string;
  position: string;
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
}

interface VacationRequest {
  id: string;
  employeeName: string;
  period: string;
  days: number;
  workDays: number;
  halfDay?: boolean;
  status: "Pendiente" | "Aprovada" | "Rechazada";
  approver: string;
  submittedDate: string;
  responseDate?: string;
  comments?: string;
  employeeComments?: string;
  startDate: string;
  endDate: string;
  department: string;
  position: string;
}
type Request = (PermitRequest | VacationRequest) & {
  type: "permit" | "vacation";
};
type RequestsToMe = {
  permits: PermitRequest[];
  vacations: VacationRequest[];
};

// const mockRequests: Request[] = [
//   {
//     id: "PER-24",
//     type: "permit",
//     employeeName: "Sara Eloisa Vega Acosta",
//     date: "19 de junio de 2025",
//     timeRange: "04:00 - 06:00",
//     reason: "Salida a comer",
//     status: "Pendiente",
//     approver: "",
//     submittedDate: "17 de junio de 2025",
//     department: "Planta",
//     position: "Operario",
//     employeeComments:
//       "Necesito salir para una cita médica importante que no pude programar en otro horario.",
//   },
//   {
//     id: "VAC-15",
//     type: "vacation",
//     employeeName: "Carlos Rodriguez Martinez",
//     period: "1-15 julio 2025",
//     days: 15,
//     workDays: 11,
//     status: "Aprovada",
//     approver: "Manager",
//     submittedDate: "10 de junio de 2025",
//     responseDate: "12 de junio de 2025",
//     startDate: "1 de julio de 2025",
//     endDate: "15 de julio de 2025",
//     department: "Administración",
//     position: "Analista",
//     comments: "Aprobado. Disfrute sus vacaciones.",
//   },
//   {
//     id: "PER-25",
//     type: "permit",
//     employeeName: "Ana Maria Gonzalez",
//     date: "20 de junio de 2025",
//     timeRange: "14:00 - 16:00",
//     reason: "Cita médica",
//     status: "Rechazada",
//     approver: "Manager",
//     submittedDate: "18 de junio de 2025",
//     responseDate: "19 de junio de 2025",
//     department: "Ventas",
//     position: "Ejecutiva",
//     comments: "No se puede aprobar debido a la carga de trabajo del día.",
//     attachments: [{ name: "cita_medica.pdf", type: "pdf", url: "#" }],
//   },
// ];

/** Devuelve una clave de subtipo derivada de los campos reales del registro.
 *  Al provenir de los datos de la API, los tipos se descubren automáticamente
 *  sin necesidad de codificarlos de forma fija. */
const getRequestSubtype = (r: Request): string => {
  if (r.type === "vacation") {
    return (r as Request & VacationRequest).halfDay ? "vacation-halfday" : "vacation";
  }
  const perm = r as Request & PermitRequest;
  if (perm.compensatorio) return "compensatorio";
  return perm.tipo ?? "permiso";
};

/** Etiquetas de presentación. Se usa como fallback; si llega un tipo nuevo
 *  del backend que no esté aquí, se muestra la clave tal cual. */
const TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  "vacation-halfday": "Vacaciones — ½ Día",
  permiso: "Permiso",
  incapacidad: "Incapacidad",
  duelo: "Duelo",
  compensatorio: "Compensatorio",
};

const SPANISH_MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

/** Parsea fecha en formato "17 de junio de 2025" o ISO "2025-06-19 08:00:00" */
const parseRecordDate = (s: string): Date | null => {
  if (!s) return null;
  // ISO-like: "2025-06-19 08:00:00"
  const isoAttempt = new Date(s.replace(" ", "T"));
  if (!isNaN(isoAttempt.getTime())) return isoAttempt;
  // Español: "17 de junio de 2025"
  const m = s.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!m) return null;
  const month = SPANISH_MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  return new Date(Number(m[3]), month, Number(m[1]));
};

/** Devuelve la fecha representativa de la solicitud (inicio del permiso/vacación) */
const getRecordStartDate = (r: Request): Date | null => {
  if (r.type === "permit") {
    const p = r as Request & PermitRequest;
    return parseRecordDate(p.startDateTime ?? p.date ?? "");
  }
  const v = r as Request & VacationRequest;
  return parseRecordDate(v.startDate ?? "");
};

const generatePDF = (request: Request) => {
  console.log("HOLA MUNDOOOO")
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 30;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(
    "SOLICITUD DE " + (request.type === "vacation" ? "VACACIONES" : "PERMISO"),
    pageWidth / 2,
    yPosition,
    {
      align: "center",
    }
  );

  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`ID: ${request.id}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 20;

  // Employee Information Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMACIÓN DEL EMPLEADO", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const employeeInfo = [
    ["Nombre:", request.employeeName],
    ["Departamento:", request.department],
    ["Cargo:", request.position],
    ["Fecha de Solicitud:", request.submittedDate],
  ];

  employeeInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 40, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Request Details Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DE LA SOLICITUD", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const isVacationRequest = (
    req: Request
  ): req is Request & VacationRequest => {
    return req.type === "vacation";
  };

  const isPermitRequest = (req: Request): req is Request & PermitRequest => {
    return req.type === "permit";
  };

  if (isVacationRequest(request)) {
    const vacationDetails = [
      ["Tipo:", "Vacaciones"],
      ["Período:", request.period],
      ["Fecha de Inicio:", request.startDate],
      ["Fecha de Fin:", request.endDate],
      ["Días Totales:", `${request.days} días`],
      ["Días Laborables:", `${request.workDays} días`],
    ];

    vacationDetails.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 40, yPosition);
      yPosition += 8;
    });
  } else {
    const permitDetails = [
      ["Tipo:", "Permiso"],
      ["Fecha:", request.date],
      ["Horario:", request.timeRange],
      ["Motivo:", request.reason],
    ];

    permitDetails.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 40, yPosition);
      yPosition += 8;
    });
  }

  yPosition += 10;

  // Status Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ESTADO DE LA SOLICITUD", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  const statusText =
    request.status === "Pendiente"
      ? "Pendiente"
      : request.status === "Aprovada"
      ? "Aprobado"
      : "Rechazado";

  const statusInfo = [
    ["Estado:", statusText],
    ["Fecha de Respuesta:", request.responseDate || "Pendiente"],
  ];

  statusInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 40, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Employee Comments Section
  if (request.employeeComments) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("COMENTARIOS DEL EMPLEADO", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const splitComments = doc.splitTextToSize(
      request.employeeComments,
      pageWidth - 2 * margin
    );
    doc.text(splitComments, margin, yPosition);
    yPosition += splitComments.length * 6 + 10;
  }

  // Supervisor Comments Section
  if (request.comments) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("COMENTARIOS DEL SUPERVISOR", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const splitComments = doc.splitTextToSize(
      request.comments,
      pageWidth - 2 * margin
    );
    doc.text(splitComments, margin, yPosition);
    yPosition += splitComments.length * 6 + 10;
  }

  // Attachments Section
  if (
    isPermitRequest(request) &&
    request.attachments &&
    request.attachments.length > 0
  ) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DOCUMENTOS ADJUNTOS", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    request.attachments.forEach((attachment, index) => {
      doc.text(
        `${index + 1}. ${attachment.name} (${attachment.type.toUpperCase()})`,
        margin,
        yPosition
      );
      yPosition += 8;
    });
    yPosition += 10;
  }

  // Signature Section
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 30;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FIRMAS", margin, yPosition);
  yPosition += 20;

  // Employee signature
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Empleado:", margin, yPosition);
  doc.line(margin + 25, yPosition, margin + 100, yPosition);
  doc.text("Fecha:", margin + 110, yPosition);
  doc.line(margin + 125, yPosition, margin + 180, yPosition);
  yPosition += 30;

  // Supervisor signature
  doc.text("Supervisor:", margin, yPosition);
  doc.line(margin + 25, yPosition, margin + 100, yPosition);
  doc.text("Fecha:", margin + 110, yPosition);
  doc.line(margin + 125, yPosition, margin + 180, yPosition);

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Documento generado el ${new Date().toLocaleDateString("es-ES")}`,
    pageWidth / 2,
    doc.internal.pageSize.height - 10,
    { align: "center" }
  );

  // Save the PDF
  const fileName = `${request.type === "vacation" ? "Vacaciones" : "Permiso"}_${
    request.id
  }_${request.employeeName.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};

export default function SupervisorDashboard() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [allRecords, setAllRecords] = useState<Request[]>([]);
  const clientModeRef = useRef(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [supervisorComments, setSupervisorComments] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [waitStatus, setWaitStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [waitAction, setWaitAction] = useState<"approve" | "reject">("approve")
  const [waitError, setWaitError] = useState("")
  // Filtros de fecha
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  // Filtro por empleados
  const [fetchedEmployees, setFetchedEmployees] = useState<{ id: string; name: string; department: string }[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [employeePanelOpen, setEmployeePanelOpen] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")
  // Export
  const [isExporting, setIsExporting] = useState(false)
  const { data: session, status } = useSession();

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasActiveFilters =
    filterType !== "all" || filterStatus !== "all" ||
    dateFrom !== "" || dateTo !== "" || selectedEmployeeIds.length > 0;

  // Empleados disponibles — fuente primaria: endpoint dedicado; fallback: allRecords (modo cliente)
  const availableEmployees = useMemo(() => {
    if (fetchedEmployees.length > 0) return fetchedEmployees;
    // Fallback modo cliente: derivar de allRecords usando employeeName como ID
    if (allRecords.length === 0) return [];
    const seen = new Map<string, { id: string; name: string; department: string }>();
    allRecords.forEach((r) => {
      if (!seen.has(r.employeeName))
        seen.set(r.employeeName, { id: r.employeeName, name: r.employeeName, department: r.department ?? "" });
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [fetchedEmployees, allRecords]);

  const filteredEmployeeList = useMemo(
    () =>
      availableEmployees.filter((e) =>
        e.name.toLowerCase().includes(employeeSearch.toLowerCase())
      ),
    [availableEmployees, employeeSearch]
  );

  // Tipos disponibles: base fija desde TYPE_LABELS (siempre visible) + cualquier tipo
  // nuevo que llegue del backend en el futuro se agrega automáticamente desde allRecords.
  const availableTypes = useMemo(() => {
    const seen = new Set(Object.keys(TYPE_LABELS));
    allRecords.forEach((r) => seen.add(getRequestSubtype(r)));
    return Array.from(seen).sort();
  }, [allRecords]);


  // Cargar lista de empleados a cargo del supervisor
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.accessToken) return;
    setEmployeesLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/my-team`, {
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json: any) => {
        const list: { id: string; name: string; department: string }[] = (json.data ?? json).map(
          (e: any) => ({
            id: String(e.id ?? e.id_usuario ?? e.employeeId ?? e.name ?? ""),
            name: e.name ?? e.txt_nombre ?? e.employeeName ?? "",
            department: e.department ?? e.txt_area ?? e.area ?? "",
          })
        );
        setFetchedEmployees(list.filter((e) => e.name).sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {
        // El fallback a allRecords aplica automáticamente si este fetch falla
      })
      .finally(() => setEmployeesLoading(false));
  }, [session, status]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus, itemsPerPage, dateFrom, dateTo, selectedEmployeeIds]);

  // Fetch server-side con paginación y filtros
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.accessToken) return;
    // Si el backend devolvió formato antiguo, el cliente maneja todo — no re-fetchear
    if (clientModeRef.current) return; // eslint-disable-line react-hooks/exhaustive-deps

    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", itemsPerPage.toString());
    params.set("sortOrder", "desc");
    if (filterType !== "all") params.set("type", filterType);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (selectedEmployeeIds.length > 0) params.set("employees", selectedEmployeeIds.join(","));

    setIsLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/permissions/get-all-request-to-me?${params}`,
      { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar solicitudes");
        return res.json();
      })
      .then((json: any) => {
        // Formato nuevo { data, total } — el backend pagina y filtra
        if (json.data) {
          setRequests(json.data);
          setTotalCount(json.total ?? json.data.length);
          setIsLoading(false);
        } else {
          // Formato antiguo { permits, vacations } — guardar todos y paginar en cliente
          clientModeRef.current = true;
          const permits: Request[] = (json.permits ?? []).map((p: any) => ({ ...p, type: "permit" as const }));
          const vacations: Request[] = (json.vacations ?? []).map((v: any) => ({ ...v, type: "vacation" as const }));
          setAllRecords([...permits, ...vacations]);
          // El useEffect de modo cliente se encargará de setRequests + setTotalCount
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setRequests([]);
        setTotalCount(0);
        setIsLoading(false);
      });
  }, [session, status, currentPage, itemsPerPage, filterType, filterStatus]);

  // Paginación y filtros en cliente cuando el backend devuelve formato antiguo
  useEffect(() => {
    if (!clientModeRef.current || allRecords.length === 0) return;
    let filtered = allRecords;
    if (filterType !== "all") filtered = filtered.filter((r) => getRequestSubtype(r) === filterType);
    if (filterStatus !== "all") filtered = filtered.filter((r) => r.status === filterStatus);
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((r) => {
        const d = getRecordStartDate(r);
        return d ? d >= from : true;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => {
        const d = getRecordStartDate(r);
        return d ? d <= to : true;
      });
    }
    if (selectedEmployeeIds.length > 0) {
      // Resolver nombres a partir de los IDs seleccionados para filtrar en modo cliente
      const selectedNames = availableEmployees
        .filter((e) => selectedEmployeeIds.includes(e.id))
        .map((e) => e.name);
      filtered = filtered.filter((r) => selectedNames.includes(r.employeeName));
    }
    setTotalCount(filtered.length);
    const start = (currentPage - 1) * itemsPerPage;
    setRequests(filtered.slice(start, start + itemsPerPage));
    setIsLoading(false);
  }, [allRecords, availableEmployees, filterType, filterStatus, dateFrom, dateTo, selectedEmployeeIds, currentPage, itemsPerPage]);
  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setSupervisorComments(request.comments || "");
    setIsDetailOpen(true);
  };
  const handleApprove = async (actionStatus: string) => {
    if (!selectedRequest) return
    const isApproving = actionStatus === "Aprovada"
    setWaitAction(isApproving ? "approve" : "reject")
    setWaitError("")
    setWaitStatus("loading")

    // Timeout de 30s — evita que el loader quede cargando si el servidor no responde
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/permissions/handle-request`,
        {
          method: "PUT",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
          body: JSON.stringify({
            id: selectedRequest.id,
            status: actionStatus,
            comments: supervisorComments || "",
          }),
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || "Ocurrió un error al actualizar la solicitud")
      }

      // Actualizar estado local optimistamente
      const updatedStatus: "Aprovada" | "Rechazada" = isApproving ? "Aprovada" : "Rechazada";
      const responseDate = new Date().toLocaleDateString("es-ES");
      const applyUpdate = (req: Request) =>
        req.id === selectedRequest.id
          ? { ...req, status: updatedStatus, comments: supervisorComments, responseDate }
          : req;
      setRequests((prev) => prev.map(applyUpdate));
      if (clientModeRef.current) {
        setAllRecords((prev) => prev.map(applyUpdate));
      }
      setWaitStatus("success")
    } catch (e: any) {
      const isTimeout = e?.name === "AbortError"
      console.error("❌ Error aprobando/rechazando solicitud:", e)
      setWaitError(isTimeout ? "La solicitud tardó demasiado. Verifica si se procesó." : (e?.message || "Error de conexión. Intenta de nuevo."))
      setWaitStatus("error")
    } finally {
      clearTimeout(timeoutId)
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // El backend genera el Excel con todos los filtros activos, sin paginación
      const params = new URLSearchParams();
      params.set("sortOrder", "desc");
      if (filterType !== "all") params.set("type", filterType);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (selectedEmployeeIds.length > 0) params.set("employees", selectedEmployeeIds.join(","));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/permissions/export?${params}`,
        { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }
      );

      if (!res.ok) throw new Error("Error al generar el reporte");

      const blob = await res.blob();
      saveAs(blob, `solicitudes_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err: any) {
      alert(err?.message ?? "No se pudo descargar el reporte");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pendiente":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pendiente
          </Badge>
        );
      case "Aprovada":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Aprobado
          </Badge>
        );
      case "Rechazada":
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 hover:bg-red-100"
          >
            Rechazado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadges = (request: Request) => {
    if (request.type === "vacation") {
      const vac = request as Request & VacationRequest
      return (
        <div className="flex flex-wrap gap-1">
          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 whitespace-nowrap">
            Vacaciones
          </Badge>
          {vac.halfDay && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 whitespace-nowrap">
              ½ Día
            </Badge>
          )}
        </div>
      )
    }
    const perm = request as Request & PermitRequest
    return (
      <div className="flex flex-col gap-1">
        {perm.tipo === "incapacidad" ? (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 w-fit whitespace-nowrap">
            Incapacidad
          </Badge>
        ) : perm.tipo === "duelo" ? (
          <Badge className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100 w-fit whitespace-nowrap">
            Duelo
          </Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 w-fit whitespace-nowrap">
            Permiso
          </Badge>
        )}
        {perm.compensatorio && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 w-fit whitespace-nowrap">
            Compensatorio
          </Badge>
        )}
      </div>
    )
  }

  const isPermitRequest = (
    request: Request
  ): request is Request & PermitRequest => {
    return request.type === "permit";
  };

  const isVacationRequest = (
    request: Request
  ): request is Request & VacationRequest => {
    return request.type === "vacation";
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Gestión de Solicitudes
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Administre las solicitudes de vacaciones y permisos de su equipo
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {isExporting ? (
              <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Generando..." : "Exportar a Excel"}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fila 1: tipo, estado, empleados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              <div className="space-y-2">
                <Label htmlFor="type-filter">Tipo de solicitud</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableTypes.map((subtype) => (
                      <SelectItem key={subtype} value={subtype}>
                        {TYPE_LABELS[subtype] ?? subtype}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Aprovada">Aprobado</SelectItem>
                    <SelectItem value="Rechazada">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de empleados */}
              <div className="space-y-2">
                <Label>Empleados</Label>
                <Popover open={employeePanelOpen} onOpenChange={setEmployeePanelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Users className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {employeesLoading
                            ? "Cargando empleados..."
                            : selectedEmployeeIds.length === 0
                            ? "Todos los empleados"
                            : selectedEmployeeIds.length === 1
                            ? (availableEmployees.find((e) => e.id === selectedEmployeeIds[0])?.name ?? "1 empleado")
                            : `${selectedEmployeeIds.length} empleados`}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    {/* Cabecera */}
                    <div className="p-3 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                        <Input
                          placeholder="Buscar empleado..."
                          value={employeeSearch}
                          onChange={(e) => setEmployeeSearch(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                      {availableEmployees.length > 0 && (
                        <div className="flex justify-between mt-2">
                          <button
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => setSelectedEmployeeIds(availableEmployees.map((e) => e.id))}
                          >
                            Seleccionar todos
                          </button>
                          {selectedEmployeeIds.length > 0 && (
                            <button
                              className="text-xs text-gray-500 hover:underline"
                              onClick={() => setSelectedEmployeeIds([])}
                            >
                              Limpiar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Lista */}
                    <div className="max-h-56 overflow-y-auto">
                      {filteredEmployeeList.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4 px-3">
                          {employeesLoading
                            ? "Cargando lista de empleados..."
                            : availableEmployees.length === 0
                            ? "No hay empleados registrados"
                            : "Sin coincidencias"}
                        </p>
                      ) : (
                        <div className="p-1">
                          {filteredEmployeeList.map((emp) => {
                            const checked = selectedEmployeeIds.includes(emp.id);
                            return (
                              <button
                                key={emp.id}
                                onClick={() =>
                                  setSelectedEmployeeIds((prev) =>
                                    checked ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                                  )
                                }
                                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 text-left"
                              >
                                <Checkbox checked={checked} className="pointer-events-none" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{emp.name}</p>
                                  {emp.department && (
                                    <p className="text-xs text-gray-400 truncate">{emp.department}</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Fila 2: rango de fechas + limpiar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="date-from">Desde</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-9 pr-3 h-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">Hasta</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-9 pr-3 h-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterType("all");
                      setFilterStatus("all");
                      setDateFrom("");
                      setDateTo("");
                      setSelectedEmployeeIds([]);
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>

            {/* Chips de filtros activos */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-1">
                {filterType !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {TYPE_LABELS[filterType] ?? filterType}
                    <button onClick={() => setFilterType("all")} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filterStatus !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {filterStatus}
                    <button onClick={() => setFilterStatus("all")} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {dateFrom && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    Desde {dateFrom}
                    <button onClick={() => setDateFrom("")} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {dateTo && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    Hasta {dateTo}
                    <button onClick={() => setDateTo("")} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {selectedEmployeeIds.map((id) => {
                  const emp = availableEmployees.find((e) => e.id === id);
                  if (!emp) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {emp.name.split(" ").slice(0, 2).join(" ")}
                      <button onClick={() => setSelectedEmployeeIds((p) => p.filter((i) => i !== id))} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Solicitudes recibidas
                  {!isLoading && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {totalCount} {totalCount === 1 ? "resultado" : "resultados"}
                      {hasActiveFilters && " (filtrado)"}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Lista de todas las solicitudes de vacaciones y permisos
                </CardDescription>
              </div>
              {isLoading && (
                <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block w-full overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha de solicitud</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Período/Horario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-8 w-8 text-gray-300" />
                            <p className="font-medium">
                              {hasActiveFilters ? "No se encontraron solicitudes con los filtros aplicados" : "No hay solicitudes registradas"}
                            </p>
                            {hasActiveFilters && (
                              <button
                                onClick={() => { setFilterType("all"); setFilterStatus("all"); }}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Limpiar filtros
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {requests.map((request) => (
                      <TableRow
                        key={request.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleViewDetails(request)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {request.employeeName}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {request.department}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadges(request)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {request.submittedDate}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {isVacationRequest(request) ? (
                            <div className="flex items-center gap-1 min-w-0">
                              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm truncate">
                                {request.period}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 min-w-0">
                              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm truncate">
                                {request.timeRange}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {requests.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="font-medium">
                    {hasActiveFilters ? "No se encontraron solicitudes con los filtros aplicados" : "No hay solicitudes registradas"}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterType("all"); setFilterStatus("all"); }}
                      className="text-sm text-blue-600 hover:underline mt-1"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  onClick={() => handleViewDetails(request)}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="font-semibold text-gray-900">
                      {request.id}
                    </div>
                    <div>{getStatusBadge(request.status)}</div>
                  </div>

                  {/* Date and Time */}
                  <div className="mb-3">
                    {isVacationRequest(request) ? (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {request.startDate} - {request.endDate}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.days} días ({request.workDays} laborables)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{request.date}</div>
                          <div className="text-sm text-gray-500">
                            {request.timeRange}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Request Type and Reason */}
                  <div className="mb-3">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {getTypeBadges(request)}
                    </div>
                    {isPermitRequest(request) && (
                      <div className="font-medium text-gray-900 mb-1">
                        {request.reason}
                      </div>
                    )}
                    {request.employeeComments && (
                      <div className="text-sm text-blue-600 line-clamp-2">
                        {request.employeeComments}
                      </div>
                    )}
                  </div>

                  {/* Employee Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.employeeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.department}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {request.submittedDate}
                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              {/* Selector por página + contador — siempre visible */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Por página:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
                {totalCount > 0 && (
                  <span className="text-gray-500">
                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}
                  </span>
                )}
              </div>

              {/* Navegación — solo si hay más de una página */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3"
                  >
                    ‹
                  </Button>

                  {(() => {
                    const windowSize = Math.min(5, totalPages)
                    let start: number
                    if (totalPages <= 5) {
                      start = 1
                    } else if (currentPage <= 3) {
                      start = 1
                    } else if (currentPage >= totalPages - 2) {
                      start = totalPages - 4
                    } else {
                      start = currentPage - 2
                    }
                    return Array.from({ length: windowSize }, (_, i) => start + i).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    ))
                  })()}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3"
                  >
                    ›
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog
          open={isDetailOpen}
          onOpenChange={(open) => {
            // Bloquear cierre del dialog mientras el loader está activo
            if (waitStatus !== "idle") return
            setIsDetailOpen(open)
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <DialogHeader className="border-b pb-4">
              <div className="flex items-start justify-between pr-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    {selectedRequest?.type === "vacation" ? (
                      <Calendar className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-blue-900">
                      Detalle de Solicitud — {selectedRequest?.id}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {selectedRequest?.type === "vacation" ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Vacaciones</Badge>
                      ) : selectedRequest?.tipo === "incapacidad" ? (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Incapacidad</Badge>
                      ) : selectedRequest?.tipo === "duelo" ? (
                        <Badge className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100">Duelo</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Permiso</Badge>
                      )}
                      {selectedRequest?.compensatorio && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Compensatorio</Badge>
                      )}
                      {selectedRequest && getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedRequest && generatePDF(selectedRequest)}
                  className="flex items-center gap-2 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            </DialogHeader>

            {selectedRequest && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">

                {/* ── Columna principal (2/3) ── */}
                <div className="md:col-span-2 space-y-4">

                  {/* Empleado */}
                  <Card>
                    <CardHeader className="bg-gray-50 pb-3">
                      <CardTitle className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
                        Solicitante
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">{selectedRequest.employeeName}</p>
                          <p className="text-sm text-gray-500">{selectedRequest.position}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Departamento</p>
                            <p className="text-sm font-medium">{selectedRequest.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Fecha solicitud</p>
                            <p className="text-sm font-medium">{selectedRequest.submittedDate}</p>
                          </div>
                        </div>
                        {selectedRequest.responseDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400">Fecha respuesta</p>
                              <p className="text-sm font-medium">{selectedRequest.responseDate}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detalles */}
                  <Card>
                    <CardHeader className="bg-gray-50 pb-3">
                      <CardTitle className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
                        {selectedRequest.type === "vacation" ? "Período de Vacaciones" : "Detalles del Permiso"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {isVacationRequest(selectedRequest) ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <Calendar className="h-5 w-5 text-green-600 shrink-0" />
                            <div>
                              <p className="text-xs text-green-600 font-medium">Período</p>
                              <p className="text-sm font-semibold text-green-900">{selectedRequest.period}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Fecha inicio</p>
                              <p className="text-sm font-medium">{selectedRequest.startDate}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-400 mb-1">Fecha fin</p>
                              <p className="text-sm font-medium">{selectedRequest.endDate}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-500 mb-1">Días totales</p>
                              <p className="text-sm font-semibold text-blue-800">{selectedRequest.days} días</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-500 mb-1">Días laborables</p>
                              <p className="text-sm font-semibold text-blue-800">{selectedRequest.workDays} días</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
                              <div>
                                <p className="text-xs text-blue-500 font-medium">Fecha</p>
                                <p className="text-sm font-semibold text-blue-900">{selectedRequest.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                              <div>
                                <p className="text-xs text-blue-500 font-medium">Horario</p>
                                <p className="text-sm font-semibold text-blue-900">{selectedRequest.timeRange}</p>
                              </div>
                            </div>
                          </div>
                          {selectedRequest.reason && (
                            <div className="p-3 bg-gray-50 rounded-lg border">
                              <p className="text-xs text-gray-400 mb-1">Motivo</p>
                              <p className="text-sm font-medium text-gray-800">{selectedRequest.reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Comentarios del empleado */}
                  {selectedRequest.employeeComments && (
                    <Card>
                      <CardHeader className="bg-gray-50 pb-3">
                        <CardTitle className="text-sm font-semibold uppercase text-gray-500 tracking-wide flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Comentarios del Empleado
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="bg-blue-50/60 p-4 rounded-lg border border-blue-100">
                          <div
                            className="formatted-content text-sm text-gray-700"
                            dangerouslySetInnerHTML={{ __html: selectedRequest.employeeComments }}
                            style={{ direction: "ltr", textAlign: "left" }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Adjuntos */}
                  {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                    <Card>
                      <CardHeader className="bg-gray-50 pb-3">
                        <CardTitle className="text-sm font-semibold uppercase text-gray-500 tracking-wide flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Documentos Adjuntos
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-3">
                          {selectedRequest.attachments.map((file: any, index: number) => (
                            <a
                              key={index}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              {file.type?.startsWith("image/") ? (
                                <ImageIcon className="h-4 w-4 shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate max-w-[160px]">{file.name}</span>
                              <Download className="h-3 w-3 shrink-0 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* ── Columna lateral (1/3) ── */}
                <div className="space-y-4">

                  {/* Estado */}
                  <Card>
                    <CardHeader className="bg-blue-50 pb-3">
                      <CardTitle className="text-sm font-semibold uppercase text-gray-500 tracking-wide">Estado</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Estado actual</span>
                        {getStatusBadge(selectedRequest.status)}
                      </div>
                      {selectedRequest.responseDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Respondido</span>
                          <span className="text-sm font-medium">{selectedRequest.responseDate}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Comentarios previos del supervisor (si ya fue procesado) */}
                  {selectedRequest.comments && (
                    <Card>
                      <CardHeader className="bg-blue-50 pb-3">
                        <CardTitle className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
                          Respuesta del Supervisor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-700 italic">"{selectedRequest.comments}"</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Acciones — solo si está pendiente */}
                  {selectedRequest.status === "Pendiente" && (
                    <Card className="border-yellow-200">
                      <CardHeader className="bg-yellow-50 pb-3">
                        <CardTitle className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
                          Acción Requerida
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <div>
                          <Label className="text-xs text-gray-500 mb-1.5 block">
                            Comentario <span className="text-gray-400">(opcional para aprobar, requerido para rechazar)</span>
                          </Label>
                          <Textarea
                            value={supervisorComments}
                            onChange={(e) => setSupervisorComments(e.target.value)}
                            placeholder="Escribe un comentario..."
                            rows={3}
                            className="text-sm resize-none"
                          />
                        </div>
                        <Button
                          onClick={() => handleApprove("Aprovada")}
                          className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2"
                          disabled={waitStatus === "loading"}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprobar Solicitud
                        </Button>
                        <Button
                          onClick={() => handleApprove("Rechazada")}
                          variant="destructive"
                          className="w-full flex items-center gap-2"
                          disabled={waitStatus === "loading" || !supervisorComments.trim()}
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar Solicitud
                        </Button>
                        {!supervisorComments.trim() && (
                          <p className="text-xs text-gray-400 text-center">Agrega un comentario para poder rechazar</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsDetailOpen(false)}
                    disabled={waitStatus === "loading"}
                  >
                    Cerrar
                  </Button>
                </div>

              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <WaitModal
      isOpen={waitStatus !== "idle"}
      status={waitStatus === "idle" ? "loading" : waitStatus}
      title={
        waitStatus === "loading"
          ? (waitAction === "approve" ? "Aprobando solicitud..." : "Rechazando solicitud...")
          : waitStatus === "success"
          ? (waitAction === "approve" ? "¡Solicitud aprobada!" : "Solicitud rechazada")
          : (waitAction === "approve" ? "Error al aprobar" : "Error al rechazar")
      }
      message={
        waitStatus === "loading"
          ? "Estamos procesando tu acción..."
          : waitStatus === "success"
          ? (waitAction === "approve"
              ? "La solicitud fue aprobada exitosamente."
              : "La solicitud fue rechazada.")
          : undefined
      }
      errorMessage={waitError}
      onClose={() => {
        if (waitStatus === "success") {
          setIsDetailOpen(false)
        }
        setWaitStatus("idle")
      }}
      autoCloseMs={waitStatus === "success" ? 2000 : undefined}
    />
    </>
  );
}
