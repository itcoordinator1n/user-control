"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpDown,
  Calendar,
  Download,
  FileText,
  Filter,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RequestDetail from "@/components/request-detail";
import StatisticsPanel from "@/components/statistics-panel";
import { useSession } from "next-auth/react";

// Sample data for the requests

type SolicitudEmpleado = {
  idSolicitud: number;
  nombreSolicitante: string;
  idEmpleado: number;
  estado: string;
  puesto: string;
  nombreArea: string;
  tipoSolicitud: string;
  fechaEnvio: string; // o Date si haces la conversión
  fechaInicio: string;
  fechaFin: string;
  arhivo: string | null; // Asumiendo que puede ser null si no hay archivo
  descripcion: string;
};
const requests = [
  {
    id: "REQ-001",
    employeeId: "EMP-001",
    employeeName: "Ana Martínez",
    employeePhoto: "/placeholder.svg?height=40&width=40",
    employeePosition: "Analista de Marketing",
    employeeDepartment: "Marketing",
    type: "Vacaciones",
    submissionDate: "2023-11-15",
    startDate: "2023-12-20",
    endDate: "2023-12-30",
    status: "Pendiente",
    description:
      "Solicito vacaciones para visitar a mi familia durante las fiestas de fin de año.",
    attachments: [],
  },
  {
    id: "REQ-002",
    employeeId: "EMP-002",
    employeeName: "Miguel Sánchez",
    employeePhoto: "/placeholder.svg?height=40&width=40",
    employeePosition: "Desarrollador Frontend",
    employeeDepartment: "Tecnología",
    type: "Permiso",
    submissionDate: "2023-11-16",
    startDate: "2023-11-22",
    endDate: "2023-11-22",
    status: "Pendiente",
    description:
      "Necesito asistir a una cita médica en la mañana. Estaré de regreso después del almuerzo.",
    attachments: [{ name: "certificado_medico.pdf", url: "#" }],
  },
  {
    id: "REQ-003",
    employeeId: "EMP-003",
    employeeName: "Laura Gómez",
    employeePhoto: "/placeholder.svg?height=40&width=40",
    employeePosition: "Contadora",
    employeeDepartment: "Finanzas",
    type: "Permiso",
    submissionDate: "2023-11-14",
    startDate: "2023-11-20",
    endDate: "2023-11-21",
    status: "Pendiente",
    description:
      "Solicito permiso para asistir a un seminario de actualización contable.",
    attachments: [{ name: "invitacion_seminario.pdf", url: "#" }],
  },
  {
    id: "REQ-004",
    employeeId: "EMP-004",
    employeeName: "Javier Pérez",
    employeePhoto: "/placeholder.svg?height=40&width=40",
    employeePosition: "Ejecutivo de Ventas",
    employeeDepartment: "Ventas",
    type: "Vacaciones",
    submissionDate: "2023-11-10",
    startDate: "2023-12-05",
    endDate: "2023-12-15",
    status: "Pendiente",
    description: "Solicito vacaciones para un viaje familiar ya planificado.",
    attachments: [],
  },
  {
    id: "REQ-005",
    employeeId: "EMP-005",
    employeeName: "Sofía Ramírez",
    employeePhoto: "/placeholder.svg?height=40&width=40",
    employeePosition: "Diseñadora Gráfica",
    employeeDepartment: "Marketing",
    type: "Permiso",
    submissionDate: "2023-11-17",
    startDate: "2023-11-24",
    endDate: "2023-11-24",
    status: "Pendiente",
    description:
      "Necesito ausentarme por la tarde para asistir a la graduación de mi hijo.",
    attachments: [{ name: "invitacion_graduacion.pdf", url: "#" }],
  },
];

export default function RequestsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("requests");
  const { data: session, status } = useSession();

  // Filter requests based on search query and type filter
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || request.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const [requestss, setRequestss] = useState<SolicitudEmpleado[]>([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Asegúrate de que la URL corresponda a la ruta de tu endpoint en Express.
        const res = await fetch(
          "https://infarma.duckdns.org/api/requests/get-all-requests",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session?.user.accessToken}`,
            },
          }
        );
        if (!res.ok) {
          throw new Error(`Error en la solicitud: ${res.statusText}`);
        }
        const data = await res.json();
        setRequestss(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
        //setError("Hubo");
      }
    };

    fetchRequests();
  }, [session]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Aprobación de Solicitudes
        </h1>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Datos
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="requests">Solicitudes Pendientes</TabsTrigger>
          <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filtrar por tipo</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                  <SelectItem value="Permiso">Permisos</SelectItem>
                </SelectContent>
              </Select>
              {typeFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTypeFilter("all")}
                  title="Limpiar filtro"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="px-6">
                <CardTitle>Solicitudes Pendientes</CardTitle>
                <CardDescription>
                  {requestss.length} solicitudes requieren su aprobación
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">
                          <Button
                            variant="ghost"
                            className="p-0 font-medium flex items-center gap-1"
                          >
                            Solicitante
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="p-0 font-medium flex items-center gap-1"
                          >
                            Tipo
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="p-0 font-medium flex items-center gap-1"
                          >
                            Fecha de Envío
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requestss.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-6 text-muted-foreground"
                          >
                            No se encontraron solicitudes
                          </TableCell>
                        </TableRow>
                      ) : (
                        requestss.map((request) => (
                          <TableRow
                            key={request.idSolicitud}
                            className={`cursor-pointer ${
                              selectedRequest?.idSolicitud ===
                              request.idSolicitud
                                ? "bg-muted/50"
                                : ""
                            }`}
                            onClick={() => setSelectedRequest(request)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <img
                                  src={"/placeholder.svg"}
                                  alt={request.nombreSolicitante}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <div>{request.nombreSolicitante}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {request.nombreArea}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  request.tipoSolicitud === "vacaciones"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {request.tipoSolicitud === "vacaciones" ? (
                                  <Calendar className="mr-1 h-3 w-3" />
                                ) : (
                                  <FileText className="mr-1 h-3 w-3" />
                                )}
                                {request.tipoSolicitud}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(request.fechaEnvio)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-yellow-50 text-yellow-700 border-yellow-200"
                              >
                                {request.estado}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {selectedRequest ? (
              <RequestDetail
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
              />
            ) : (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Detalle de Solicitud</CardTitle>
                  <CardDescription>
                    Seleccione una solicitud para ver los detalles
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mb-4" />
                  <p>
                    Haga clic en una solicitud para ver su información detallada
                    y tomar una decisión.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="statistics">
          <StatisticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to format dates
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
