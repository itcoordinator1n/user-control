"use client";

import { useEffect, useState } from "react";
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
  Calendar,
  Clock,
  Download,
  FileText,
  Filter,
  MessageSquare,
  Search,
  User,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Add line-clamp utility for text truncation
import "../../../globals.css";
import { useSession } from "next-auth/react";

interface PermitRequest {
  id: string;
  employeeName: string;
  date: string;
  timeRange: string;
  reason: string;
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
  const [requests, setRequests] = useState<Request[]>();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [supervisorComments, setSupervisorComments] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredRequests = requests?.filter((request) => {
    const matchesType = filterType === "all" || request.type === filterType;
    const matchesStatus =
      filterStatus === "all" || request.status === filterStatus;
    const matchesSearch = request.employeeName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });
  let totalPages = 0;
  if (filteredRequests) {
    totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  }
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests?.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  useEffect(() => {
    // Asegúrate de que el token esté disponible
    if (session?.user?.accessToken) {
      fetch("https://infarma.duckdns.org/api/permissions/get-all-request-to-me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Error al obtener el perfil");
          }
          return res.json();
        })
        .then((data: RequestsToMe) => {
          const { permits, vacations } = data;

          const combinedRequests: Request[] = [
            ...permits.map((p) => ({ ...p, type: "permit" as const })),
            ...vacations.map((v) => ({ ...v, type: "vacation" as const })),
          ];

          setRequests(combinedRequests);
          console.log("De las solicitudes", combinedRequests);
        })
        .catch((err: Error) => setError(err.message));
    }
  }, [session]);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  console.log("Request que le llega al jefe", selectedRequest);
  const handleViewDetails = (request: Request) => {
    setSelectedRequest(request);
    setSupervisorComments(request.comments || "");
    setIsDetailOpen(true);
  };
  const handleApprove = async (status: string) => {
    if (selectedRequest) {
      const updatedRequests = requests?.map((req) =>
        req.id === selectedRequest.id
          ? status == "Aprovada"
            ? {
                ...req,
                status: "Aprovada" as const,
                comments: supervisorComments,
                responseDate: new Date().toLocaleDateString("es-ES"),
              }
            : {
                ...req,
                status: "Rechazada" as const,
                comments: supervisorComments,
                responseDate: new Date().toLocaleDateString("es-ES"),
              }
          : req
      );

      try {
        const response = await fetch(
          "https://infarma.duckdns.org/api/permissions/handle-request",
          {
            method: "PUT", // o POST según cómo configuraste tu endpoint
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.user.accessToken}`, // si usas JWT
            },
            body: JSON.stringify({
              id: selectedRequest.id, // Ej: "PER-24" o "VAC-10"
              status: status, // "Aprovada" o "Rechazada"
              comments: supervisorComments || "", // texto del comentario del aprobador
            }),
          }
        );
        console.log("Comentarios del supervisor:", supervisorComments);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Ocurrió un error al actualizar la solicitud"
          );
        }

        console.log("✅ Solicitud actualizada:", result);
        // Actualizar el estado o mostrar notificación
      } catch (e) {
        console.error("❌ Error aprobando/rechazando solicitud:",e);
      }
      console.log("Actualizacion:", updatedRequests);
      console.log("Actualizacion Seleccionada:", selectedRequest);
      setRequests(updatedRequests);
      setIsDetailOpen(false);
    }
  };

  const handleExport = () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    // 1. Mapear los datos a un formato plano
    const data = filteredRequests.map((req) => {
      if (req.type === "permit") {
        return {
          ID: req.id,
          Empleado: req.employeeName,
          Estado: req.status,
          Aprobador: req.approver,
          Enviado: req.submittedDate,
          Respondido: req.responseDate || "",
          ComentarioEmpleado: req.employeeComments || "",
          ComentarioAprobador: req.comments || "",
          Departamento: req.department,
          Puesto: req.position || "",
        };
      } else {
        return {
          ID: req.id,
          Empleado: req.employeeName,
          Estado: req.status,
          Aprobador: req.approver,
          Enviado: req.submittedDate,
          Respondido: req.responseDate || "",
          ComentarioEmpleado: req.employeeComments || "",
          ComentarioAprobador: req.comments || "",
          Departamento: req.department,
          Puesto: req.position || "",
        };
      }
    });

    // 2. Crear hoja de Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitudes");

    // 3. Generar archivo y descargar
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `solicitudes_${new Date().toISOString().split("T")[0]}.xlsx`);
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
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar a Excel
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar empleado</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nombre del empleado..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleFilterChange();
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-filter">Tipo de solicitud</Label>
                <Select
                  value={filterType}
                  onValueChange={(value) => {
                    setFilterType(value);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="vacation">Vacaciones</SelectItem>
                    <SelectItem value="permit">Permisos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter">Estado</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => {
                    setFilterStatus(value);
                    handleFilterChange();
                  }}
                >
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
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType("all");
                    setFilterStatus("all");
                    setSearchTerm("");
                    handleFilterChange();
                  }}
                  className="w-full"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Solicitudes ({filteredRequests?.length}) - Página {currentPage} de{" "}
              {totalPages}
            </CardTitle>
            <CardDescription>
              Lista de todas las solicitudes de vacaciones y permisos
            </CardDescription>
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
                    {paginatedRequests?.map((request) => (
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
                          <Badge
                            variant="outline"
                            className={`whitespace-nowrap ${
                              request.type === "vacation"
                                ? "border-green-200 text-green-700"
                                : "border-blue-200 text-blue-700"
                            }`}
                          >
                            {request.type === "vacation"
                              ? "Vacaciones"
                              : "Permiso"}
                          </Badge>
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
              {paginatedRequests?.map((request) => (
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
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          request.type === "vacation"
                            ? "border-green-200 text-green-700"
                            : "border-blue-200 text-blue-700"
                        }`}
                      >
                        {request.type === "vacation" ? "Vacaciones" : "Permiso"}
                      </Badge>
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

              {/* Empty State for Mobile */}
              {paginatedRequests?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg font-medium mb-2">
                    No se encontraron solicitudes
                  </div>
                  <div className="text-sm">
                    Intente ajustar los filtros de búsqueda
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Mostrar</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
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
                <span>de {filteredRequests?.length} solicitudes</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    {selectedRequest?.type === "vacation" ? (
                      <Calendar className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <DialogTitle>
                      Detalles de{" "}
                      {selectedRequest?.type === "vacation"
                        ? "Vacaciones"
                        : "Permiso"}{" "}
                      - {selectedRequest?.id}
                    </DialogTitle>
                    <DialogDescription>
                      Revise y gestione la solicitud del empleado
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRequest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePDF(selectedRequest)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar PDF
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                {/* Employee Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Información del Solicitante
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Empleado
                        </Label>
                        <p className="text-lg font-semibold text-blue-600">
                          {selectedRequest.employeeName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Cargo
                        </Label>
                        <p className="text-sm">{selectedRequest.position}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Departamento
                        </Label>
                        <p className="text-sm">{selectedRequest.department}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Fecha de Solicitud
                        </Label>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {selectedRequest.submittedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Request Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Estado de la Solicitud
                    </Label>
                  </div>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                {selectedRequest.attachments &&
                  selectedRequest.attachments.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <FileText className="mr-2 h-5 w-5" />
                          Documentos Adjuntos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a
                          target="_blank"
                          href={selectedRequest.attachments[0].url}
                          className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                          {selectedRequest.attachments.map(
                            (file: any, index: number) => (
                              <div
                                key={index}
                                className="text-center p-3 border rounded-lg"
                              >
                                <div className="flex justify-center mb-2">
                                  {file.type.startsWith("image/") ? (
                                    <img
                                      src={
                                        selectedRequest.attachments[0].url ||
                                        "/placeholder.svg"
                                      }
                                      alt={file.name}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                      <FileText className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <p
                                  className="text-xs truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </p>
                              </div>
                            )
                          )}
                        </a>
                      </CardContent>
                    </Card>
                  )}
                {selectedRequest.employeeComments && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Comentarios del Empleado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                        <div
                          className="formatted-content text-sm"
                          dangerouslySetInnerHTML={{
                            __html: selectedRequest.employeeComments,
                          }}
                          style={{ direction: "ltr", textAlign: "left" }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Request Details */}
                <Card>
                  <CardContent className="pt-6">
                    {isVacationRequest(selectedRequest) ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Período de Vacaciones
                          </Label>
                          <p className="text-sm">{selectedRequest.period}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Días Totales
                          </Label>
                          <p className="text-sm">{selectedRequest.days} días</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Días Laborables
                          </Label>
                          <p className="text-sm">
                            {selectedRequest.workDays} días
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Fecha de Inicio
                          </Label>
                          <p className="text-sm">{selectedRequest.startDate}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Fecha de Fin
                          </Label>
                          <p className="text-sm">{selectedRequest.endDate}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Fecha del Permiso
                          </Label>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {selectedRequest.date}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Horario del Permiso
                          </Label>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {selectedRequest.timeRange}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Motivo del Permiso
                          </Label>
                          <p className="text-sm">{selectedRequest.reason}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedRequest.comments && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Comentarios del Supervisor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-blue-900">
                          {selectedRequest.comments}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Supervisor Comments */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Comentarios del Supervisor
                    </Label>
                    <Textarea
                      value={supervisorComments}
                      onChange={(e) => setSupervisorComments(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleApprove("Aprovada")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Aprobar
                    </Button>
                    <Button
                      onClick={() => handleApprove("Rechazada")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
