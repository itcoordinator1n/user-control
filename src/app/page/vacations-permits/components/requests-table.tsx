"use client"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, FileText, Calendar, Clock, User } from "lucide-react"
import { RequestStatusBadge } from "./request-status-badge"
import { RequestDetailsModal } from "./request-details-modal"
import { TableFilters, type FilterState } from "./table-filters"
import {  useSession } from "next-auth/react";

interface PermitRequest {
  id: string
  date: string
  timeRange: string
  reason: string
  status: "pendiente" | "aprobada" | "rechazada"
  approver: string
  submittedDate: string
  responseDate?: string
  comments?: string
  employeeComments?: string
  attachments?: Array<{
    name: string
    type: string
    url: string
  }>
}

interface VacationRequest {
  id: string
  period: string
  days: number
  workDays: number
  status: "pendiente" | "aprobada" | "rechazada"
  approver: string
  submittedDate: string
  responseDate?: string
  comments?: string
  employeeComments?: string
  startDate: string
  endDate: string
}
type Request = PermitRequest | VacationRequest;

interface RequestsTableProps {
  type: "permits" | "vacations"
  onRequestDeleted?: () => void
}

export function RequestsTable({ type, onRequestDeleted }: RequestsTableProps) {
  const { data: session, status } = useSession()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [filters, setFilters] = useState<FilterState>({
    keyword: "",
    status: "all",
    startDate: undefined,
    endDate: undefined,
  })
  const [requests, setRequests] = useState<(PermitRequest | VacationRequest)[]>([])
  const token = session?.user.accessToken

  useEffect(() => {
    console.log(token)
    // No lanzamos la petición hasta tener token válido
    if (status !== "authenticated" || !token) return

    fetch("https://infarmaserver-production.up.railway.app/api/permissions/get-all-requests", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log(res)
        if (!res.ok) throw new Error("Error al cargar solicitudes")
        return res.json() as Promise<{
          permits: PermitRequest[]
          vacations: VacationRequest[]
        }>
      })
      .then(({ permits, vacations }) => {
        // Actualizamos según el `type` actual
        if (type === "permits") setRequests(permits)
        else setRequests(vacations)
      })
      .catch(err => {
        console.error("Error fetching requests:", err)
        // Aquí podrías setear un estado de error si quieres
      })
  }, [session])

//   const [requests, setRequests] = useState(() => {
//     // Datos de ejemplo para permisos
//     const permitRequests: PermitRequest[] = [
//       {
//         id: "PER-001",
//         date: "15 de junio de 2025",
//         timeRange: "09:00 - 12:00",
//         reason: "Cita médica especialista",
//         status: "aprobada",
//         approver: "María González Rodríguez",
//         submittedDate: "10 de junio de 2025",
//         responseDate: "11 de junio de 2025",
//         comments: "Aprobado. Recuerda presentar el certificado médico al regresar.",
//         employeeComments:
//           "<p>Necesito asistir a una <strong>cita médica con el cardiólogo</strong> para seguimiento de tratamiento.</p><h3>Documentos adjuntos:</h3><ul><li>Cita médica como comprobante</li><li>Orden médica del especialista</li></ul>",
//         attachments: [
//           {
//             name: "cita_medica.pdf",
//             type: "application/pdf",
//             url: "/placeholder.svg?height=100&width=100",
//           },
//         ],
//       },
//       {
//         id: "PER-002",
//         date: "20 de junio de 2025",
//         timeRange: "14:00 - 17:00",
//         reason: "Trámites personales urgentes",
//         status: "pendiente",
//         approver: "María González Rodríguez",
//         submittedDate: "12 de junio de 2025",
//         employeeComments:
//           "<p>Necesito realizar <em>trámites bancarios urgentes</em> que solo se pueden hacer en horario laboral.</p><h3>Detalles:</h3><ol><li>Firma de documentos hipotecarios</li><li>Gestión de crédito personal</li><li>Actualización de datos bancarios</li></ol><p><strong>Es un tema relacionado con la hipoteca de mi vivienda.</strong></p>",
//       },
//       {
//         id: "PER-003",
//         date: "8 de junio de 2025",
//         timeRange: "10:00 - 11:00",
//         reason: "Reunión familiar",
//         status: "rechazada",
//         approver: "María González Rodríguez",
//         submittedDate: "5 de junio de 2025",
//         responseDate: "6 de junio de 2025",
//         comments:
//           "No se puede aprobar debido a la carga de trabajo del equipo en esas fechas. Sugiero reprogramar para la siguiente semana.",
//         employeeComments:
//           "<p>Reunión familiar importante por <strong>celebración de aniversario</strong> de mis padres.</p><p><em>Es una fecha muy especial para la familia.</em></p>",
//       },
//       {
//         id: "PER-004",
//         date: "25 de junio de 2025",
//         timeRange: "08:00 - 10:00",
//         reason: "Cita médica dental",
//         status: "pendiente",
//         approver: "María González Rodríguez",
//         submittedDate: "13 de junio de 2025",
//         employeeComments:
//           "<p><strong>Cita de emergencia dental</strong> que no se puede reprogramar.</p><ul><li>Dolor intenso</li><li>Tratamiento de conducto</li></ul>",
//       },
//       {
//         id: "PER-005",
//         date: "30 de junio de 2025",
//         timeRange: "15:00 - 17:00",
//         reason: "Graduación familiar",
//         status: "aprobada",
//         approver: "María González Rodríguez",
//         submittedDate: "14 de junio de 2025",
//         responseDate: "15 de junio de 2025",
//         comments: "Aprobado. Felicitaciones por el logro familiar.",
//         employeeComments:
//           "<h3>Graduación universitaria</h3><p><strong>Graduación de mi hijo</strong> de la universidad, evento muy importante para la familia.</p><p><em>Hemos esperado este momento por años.</em></p>",
//       },
//       {
//         id: "PER-006",
//         date: "2 de julio de 2025",
//         timeRange: "10:00 - 14:00",
//         reason: "Trámites legales",
//         status: "aprobada",
//         approver: "María González Rodríguez",
//         submittedDate: "16 de junio de 2025",
//         responseDate: "17 de junio de 2025",
//         comments: "Aprobado. Presenta los documentos correspondientes.",
//         employeeComments:
//           "<p>Necesito firmar <strong>documentos importantes</strong> en la notaría.</p><ol><li>Escritura de propiedad</li><li>Poder notarial</li><li>Testamento</li></ol>",
//       },
//       {
//         id: "PER-007",
//         date: "5 de julio de 2025",
//         timeRange: "09:00 - 11:00",
//         reason: "Consulta médica",
//         status: "pendiente",
//         approver: "María González Rodríguez",
//         submittedDate: "18 de junio de 2025",
//         employeeComments:
//           "<p><strong>Control médico rutinario</strong> que no se puede reprogramar.</p><p><em>Chequeo anual obligatorio.</em></p>",
//       },
//       {
//         id: "PER-008",
//         date: "10 de julio de 2025",
//         timeRange: "13:00 - 17:00",
//         reason: "Asuntos personales",
//         status: "rechazada",
//         approver: "María González Rodríguez",
//         submittedDate: "20 de junio de 2025",
//         responseDate: "21 de junio de 2025",
//         comments: "No se puede aprobar en esas fechas debido a la carga de trabajo.",
//         employeeComments:
//           "<p>Necesito atender <em>asuntos personales urgentes</em>.</p><ul><li>Gestiones administrativas</li><li>Citas importantes</li></ul>",
//       },
//     ]

//     // Datos de ejemplo para vacaciones
//     const vacationRequests: VacationRequest[] = [
//       {
//         id: "VAC-001",
//         period: "1 - 15 de julio de 2025",
//         startDate: "1 de julio de 2025",
//         endDate: "15 de julio de 2025",
//         days: 15,
//         workDays: 11,
//         status: "aprobada",
//         approver: "María González Rodríguez",
//         submittedDate: "1 de junio de 2025",
//         responseDate: "3 de junio de 2025",
//         comments: "Aprobado. Disfruta tus vacaciones. Recuerda coordinar la entrega de pendientes antes de tu salida.",
//         employeeComments:
//           "<h3>Viaje familiar planificado</h3><p>Solicito estas fechas para <strong>viajar con mi familia</strong>. Hemos planificado este viaje desde hace varios meses.</p><ul><li>Boletos ya comprados</li><li>Hotel reservado</li><li>Actividades programadas</li></ul><p><em>Es muy importante para nosotros.</em></p>",
//       },
//       {
//         id: "VAC-002",
//         period: "20 - 27 de agosto de 2025",
//         startDate: "20 de agosto de 2025",
//         endDate: "27 de agosto de 2025",
//         days: 8,
//         workDays: 6,
//         status: "pendiente",
//         approver: "María González Rodríguez",
//         submittedDate: "10 de junio de 2025",
//         employeeComments:
//           "<p>Necesito estos días para <strong>descanso personal</strong> y para atender algunos asuntos familiares pendientes.</p><h3>Motivos:</h3><ol><li>Descanso mental</li><li>Tiempo con la familia</li><li>Asuntos personales</li></ol>",
//       },
//       {
//         id: "VAC-003",
//         period: "5 - 12 de septiembre de 2025",
//         startDate: "5 de septiembre de 2025",
//         endDate: "12 de septiembre de 2025",
//         days: 8,
//         workDays: 6,
//         status: "rechazada",
//         approver: "María González Rodríguez",
//         submittedDate: "15 de junio de 2025",
//         responseDate: "16 de junio de 2025",
//         comments: "No se puede aprobar debido a que coincide con el cierre de trimestre. Sugiero reprogramar.",
//         employeeComments:
//           "<p>Solicito estas fechas para un <em>viaje familiar</em> que ya está planificado.</p><p><strong>Nota:</strong> Las reservas ya están hechas.</p>",
//       },
//       {
//         id: "VAC-004",
//         period: "10 - 17 de octubre de 2025",
//         startDate: "10 de octubre de 2025",
//         endDate: "17 de octubre de 2025",
//         days: 8,
//         workDays: 6,
//         status: "pendiente",
//         approver: "María González Rodríguez",
//         submittedDate: "18 de junio de 2025",
//         employeeComments:
//           "<h3>Vacaciones familiares</h3><p><strong>Programadas con anticipación</strong> para celebrar aniversario de bodas.</p><ul><li>Viaje romántico</li><li>Celebración especial</li></ul>",
//       },
//       {
//         id: "VAC-005",
//         period: "1 - 8 de diciembre de 2025",
//         startDate: "1 de diciembre de 2025",
//         endDate: "8 de diciembre de 2025",
//         days: 8,
//         workDays: 6,
//         status: "aprobada",
//         approver: "María González Rodríguez",
//         submittedDate: "20 de junio de 2025",
//         responseDate: "22 de junio de 2025",
//         comments: "Aprobado para las fechas navideñas. Coordina con el equipo.",
//         employeeComments:
//           "<p>Solicito estas fechas para las <strong>festividades navideñas</strong> con mi familia.</p><p><em>Tradición familiar muy importante.</em></p>",
//       },
//     ]

//     return type === "permits" ? permitRequests : vacationRequests
//   })
//const [requests, setRequests] = useState<Request[]>([]);

  // Función para filtrar las solicitudes
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Filtro por palabra clave
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const searchableText = [
          request.id,
          type === "permits" ? (request as PermitRequest).reason : (request as VacationRequest).period,
          request.approver,
          request.employeeComments || "",
          request.comments || "",
        ]
          .join(" ")
          .toLowerCase()

        if (!searchableText.includes(keyword)) {
          return false
        }
      }

      // Filtro por estado
      if (filters.status && filters.status !== "all" && request.status !== filters.status) {
        return false
      }

      // Filtro por fecha de solicitud
      if (filters.startDate || filters.endDate) {
        const requestDate = new Date(request.submittedDate)

        if (filters.startDate && requestDate < filters.startDate) {
          return false
        }

        if (filters.endDate && requestDate > filters.endDate) {
          return false
        }
      }

      return true
    })
  }, [requests, filters, type])

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = filteredRequests.slice(startIndex, endIndex)

  // Reset página cuando cambian los filtros
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleRowClick = (request: any) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

 const handleDeleteRequest = (requestId: string) => {
  setRequests(prev => prev.filter(req => req.id !== requestId))
  setShowDetailsModal(false)
  onRequestDeleted?.()
}

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  // Función para renderizar contenido HTML formateado
  const renderFormattedContent = (htmlContent: string) => {
    if (!htmlContent || htmlContent.trim() === "") return null

    return (
      <div
        className="formatted-content text-sm"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ direction: "ltr", textAlign: "left" }}
      />
    )
  }

  // Función para obtener texto plano de HTML (para vista móvil compacta)
  const getPlainText = (htmlContent: string) => {
    if (!htmlContent) return ""
    const div = document.createElement("div")
    div.innerHTML = htmlContent
    return div.textContent || div.innerText || ""
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="text-blue-900">
            {type === "permits" ? "Solicitudes de Permisos" : "Solicitudes de Vacaciones"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No hay solicitudes registradas</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="text-blue-900">
            {type === "permits" ? "Solicitudes de Permisos Realizadas" : "Solicitudes de Vacaciones Realizadas"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Filtros */}
          <TableFilters onFiltersChange={handleFiltersChange} type={type} />

          {/* Información de resultados */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
            <span>
              {filteredRequests.length === requests.length
                ? `${filteredRequests.length} solicitudes`
                : `${filteredRequests.length} de ${requests.length} solicitudes`}
            </span>
            <div className="flex items-center gap-2">
              <span>Mostrar:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span>por página</span>
            </div>
          </div>

          {/* Contenido */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No se encontraron solicitudes con los filtros aplicados</p>
            </div>
          ) : (
            <>
              {/* Vista Desktop - Tabla */}
              <div className="hidden lg:block">
                <div className="w-full overflow-hidden">
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {type === "permits" ? "Fecha/Horario" : "Período"}
                        </th>
                        <th className="w-2/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {type === "permits" ? "Motivo y Comentarios" : "Días y Comentarios"}
                        </th>
                        <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aprobador
                        </th>
                        <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Solicitud
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(request)}
                        >
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {type === "permits"
                                ? (request as PermitRequest).date
                                : (request as VacationRequest).period}
                            </div>
                            {type === "permits" && (
                              <div className="text-sm text-gray-500 truncate">
                                {(request as PermitRequest).timeRange}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">
                              {type === "permits" && (
                                <div className="font-medium mb-1 truncate">{(request as PermitRequest).reason}</div>
                              )}

                              {type === "vacations" && (
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {(request as VacationRequest).days} días totales
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {(request as VacationRequest).workDays} laborables
                                  </span>
                                </div>
                              )}

                              {request.employeeComments && (
                                <div className="relative">
                                  <div className="comment-container">
                                    <div className="comment-content">
                                      {renderFormattedContent(request.employeeComments)}
                                    </div>
                                    <div className="comment-gradient"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <RequestStatusBadge status={request.status} />
                            {request.responseDate && (
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                Respondido: {request.responseDate}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 truncate">{request.approver}</div>
                            <div className="text-sm text-gray-500">Supervisor</div>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-500 truncate">{request.submittedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vista Mobile - Tarjetas */}
              <div className="lg:hidden space-y-4">
                {currentRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                    onClick={() => handleRowClick(request)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header con ID y Estado */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-blue-900">{request.id}</span>
                          </div>
                          <RequestStatusBadge status={request.status} />
                        </div>

                        {/* Información Principal */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {type === "permits"
                                  ? (request as PermitRequest).date
                                  : (request as VacationRequest).period}
                              </div>
                              {type === "permits" && (
                                <div className="text-xs text-gray-500">{(request as PermitRequest).timeRange}</div>
                              )}
                            </div>
                          </div>

                          {type === "permits" && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {(request as PermitRequest).reason}
                              </div>
                              {request.employeeComments && (
                                <div className="bg-gray-50 p-2 rounded text-xs">
                                  {renderFormattedContent(request.employeeComments)}
                                </div>
                              )}
                            </div>
                          )}

                          {type === "vacations" && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Días:</span>
                                <span className="font-medium">
                                  {(request as VacationRequest).days} total / {(request as VacationRequest).workDays}{" "}
                                  laborables
                                </span>
                              </div>
                              {request.employeeComments && (
                                <div className="bg-gray-50 p-2 rounded text-xs">
                                  {renderFormattedContent(request.employeeComments)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Supervisor y Fecha */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{request.approver}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{request.submittedDate}</span>
                          </div>
                        </div>

                        {/* Fecha de Respuesta */}
                        {request.responseDate && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <strong>Respondido:</strong> {request.responseDate}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t bg-gray-50 px-4 py-3 rounded-b-lg">
              <div className="text-sm text-gray-700 order-2 sm:order-1">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredRequests.length)} de {filteredRequests.length}{" "}
                solicitudes
              </div>
              <div className="flex items-center space-x-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNumber)}
                      className="px-3 py-1"
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RequestDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        request={selectedRequest}
        type={type}
        onDelete={handleDeleteRequest}
      />

      <style jsx>{`
        .formatted-content {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
        }
        .formatted-content h2 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0.25rem 0;
          line-height: 1.3;
          color: #1f2937;
        }
        .formatted-content h3 {
          font-size: 0.8125rem;
          font-weight: 600;
          margin: 0.25rem 0;
          line-height: 1.3;
          color: #1f2937;
        }
        .formatted-content ul, .formatted-content ol {
          margin: 0.25rem 0;
          padding-left: 1rem;
        }
        .formatted-content li {
          margin: 0.125rem 0;
          color: #374151;
          font-size: 0.75rem;
        }
        .formatted-content p {
          margin: 0.25rem 0;
          color: #374151;
          line-height: 1.4;
          font-size: 0.75rem;
        }
        .formatted-content strong {
          font-weight: 600;
          color: #1f2937;
        }
        .formatted-content em {
          font-style: italic;
        }
        .formatted-content u {
          text-decoration: underline;
        }
        .formatted-content * {
          direction: ltr !important;
          unicode-bidi: normal !important;
        }

        /* Contenedor de comentarios con degradado */
        .comment-container {
          position: relative;
          max-height: 3.5rem; /* ~56px para aproximadamente 3 líneas */
          overflow: hidden;
        }

        .comment-content {
          position: relative;
          z-index: 1;
        }

        .comment-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1.25rem; /* 20px */
          background: linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 1) 100%);
          pointer-events: none;
          z-index: 2;
        }

        /* Efecto hover en la fila */
        tr:hover .comment-container {
          background-color: rgba(59, 130, 246, 0.02);
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }

        tr:hover .comment-gradient {
          background: linear-gradient(to bottom, transparent 0%, rgba(239, 246, 255, 0.8) 50%, rgba(239, 246, 255, 1) 100%);
        }

        /* Tabla con layout fijo para evitar scroll horizontal */
        table {
          table-layout: fixed;
          width: 100%;
        }

        /* Truncar texto largo en celdas específicas */
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Asegurar que el contenido no se desborde */
        td {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      `}</style>
    </>
  )
}
