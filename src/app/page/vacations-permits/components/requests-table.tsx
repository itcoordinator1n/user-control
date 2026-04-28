"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, FileText, Calendar, Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { RequestStatusBadge } from "./request-status-badge"
import { RequestDetailsModal } from "./request-details-modal"
import { TableFilters, type FilterState } from "./table-filters"
import {  useSession } from "next-auth/react";

interface PermitRequest {
  id: string
  tipo: "permiso" | "incapacidad" | "duelo"
  compensatorio: boolean
  date: string
  timeRange: string
  startDateTime?: string   // ISO o "YYYY-MM-DD HH:mm:ss" — para rango completo
  endDateTime?: string
  reason: string
  status: "pendiente" | "aprobada" | "rechazada"
  approver: string
  submittedDate: string
  responseDate?: string
  comments?: string
  employeeComments?: string
  employeeName?: string
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
  halfDay?: boolean
  status: "pendiente" | "aprobada" | "rechazada"
  approver: string
  submittedDate: string
  responseDate?: string
  comments?: string
  employeeComments?: string
  startDate: string
  endDate: string
  startDateTime?: string
  endDateTime?: string
}

function parseDateOnly(s: string): Date {
  if (!s) return new Date(NaN)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const part = s.split("T")[0].split(" ")[0]
    const [y, m, d] = part.split("-")
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/")
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  return new Date(NaN)
}

function calcVacDays(req: VacationRequest): { total: number; work: number } {
  const startStr = req.startDateTime ? req.startDateTime : req.startDate
  const endStr   = req.endDateTime ? req.endDateTime : req.endDate
  const start = parseDateOnly(startStr)
  const end   = parseDateOnly(endStr)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { total: req.days ? req.days : 0, work: req.workDays ? req.workDays : 0 }
  }
  const isSingleDay = start.getTime() === end.getTime()
  const multiplier  = req.halfDay && isSingleDay ? 0.5 : 1
  const totalFull   = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  let workFull = 0
  const cur = new Date(start)
  while (cur <= end) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) workFull++
    cur.setDate(cur.getDate() + 1)
  }
  return { total: totalFull * multiplier, work: workFull * multiplier }
}
type Request = PermitRequest | VacationRequest;

function VacationDaysInfo({ request }: { request: VacationRequest }) {
  const { total, work } = calcVacDays(request)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {request.halfDay && (
        <span className="bg-purple-100 text-purple-700 border border-purple-200 text-xs px-1.5 py-0.5 rounded font-medium">
          ½ día
        </span>
      )}
      {!request.halfDay && (
        <span className="text-sm font-medium text-foreground">{total} días</span>
      )}
      <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded font-medium border border-primary/20">
        {work} lab.
      </span>
    </div>
  )
}

function VacationDaysInfoMobile({ request }: { request: VacationRequest }) {
  const { total, work } = calcVacDays(request)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Días:</span>
        <div className="flex items-center gap-1.5">
          {request.halfDay && (
            <span className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 text-[10px] px-1.5 py-0.5 rounded font-medium">
              ½ día
            </span>
          )}
          <span className="font-medium text-foreground">{total} total / {work} laborables</span>
        </div>
      </div>
    </div>
  )
}

interface RequestsTableProps {
  type: "permits" | "vacations"
  onRequestDeleted?: () => void
  /** Muestra botones Aprobar/Rechazar en el modal de detalle */
  canApprove?: boolean
  /** "supervisor": usa endpoint get-all-request-to-me y muestra columna Empleado */
  mode?: "employee" | "supervisor"
}

export function RequestsTable({ type, onRequestDeleted, canApprove = false, mode = "employee" }: RequestsTableProps) {
  const isSupervisor = mode === "supervisor"
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
  // Filtros con debounce para no disparar fetch en cada tecla del keyword
  const [debouncedFilters, setDebouncedFilters] = useState(filters)
  const [requests, setRequests] = useState<(PermitRequest | VacationRequest)[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const token = session && session.user ? session.user.accessToken : undefined

  // Debounce: aplica los filtros 400 ms después del último cambio
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 400)
    return () => clearTimeout(t)
  }, [filters])

  // Fetch server-side: paginación + filtros + orden desc
  useEffect(() => {
    if (status !== "authenticated" || !token) return

    const params = new URLSearchParams()
    params.set("type", type)
    params.set("page", currentPage.toString())
    params.set("limit", itemsPerPage.toString())
    params.set("sortOrder", "desc")
    if (debouncedFilters.status && debouncedFilters.status !== "all")
      params.set("status", debouncedFilters.status)
    if (debouncedFilters.keyword)
      params.set("keyword", debouncedFilters.keyword)
    if (debouncedFilters.startDate)
      params.set("startDate", debouncedFilters.startDate.toISOString().split("T")[0])
    if (debouncedFilters.endDate)
      params.set("endDate", debouncedFilters.endDate.toISOString().split("T")[0])

    const endpoint = isSupervisor ? "get-all-request-to-me" : "get-all-requests"
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Error al cargar solicitudes")
        return res.json()
      })
      .then((json: any) => {
        // Soporta formato nuevo { data, total } y formato anterior { permits, vacations }
        const rawData = json.data ? json.data : (type === "permits" ? json.permits : json.vacations);
        let data = rawData ? rawData : []
        if (!Array.isArray(data)) {
          data = []
        }
        const total: number = json.total ? json.total : (data.length ? data.length : 0)
        setRequests(data)
        setTotalCount(total)
      })
      .catch(err => console.error("Error fetching requests:", err))
  }, [session, type, status, token, currentPage, itemsPerPage, debouncedFilters, isSupervisor])

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  // El servidor ya devuelve solo la página solicitada
  const currentRequests = (Array.isArray(requests) ? requests : []).filter(Boolean)

  // Hay algún filtro activo (para distinguir "sin datos" de "sin resultados")
  const hasActiveFilters =
    filters.keyword !== "" ||
    filters.status !== "all" ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined

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
  setTotalCount(prev => Math.max(0, prev - 1))
  setShowDetailsModal(false)
  if (onRequestDeleted) {
    onRequestDeleted()
  }
}

 const handleRequestProcessed = (requestId: string, newStatus: "aprobada" | "rechazada") => {
  setRequests(prev =>
    prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
  )
  setShowDetailsModal(false)
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

  return (
    <>
      <Card className="border-0 sm:border border-border/50 shadow-none sm:shadow-sm overflow-hidden bg-card text-card-foreground">
        <CardHeader className="bg-muted/50 border-b border-border/50 pb-4">
          <CardTitle className="text-foreground">
            {isSupervisor
              ? (type === "permits" ? "Solicitudes de Permisos Recibidas" : "Solicitudes de Vacaciones Recibidas")
              : totalCount === 0
                ? (type === "permits" ? "Solicitudes de Permisos" : "Solicitudes de Vacaciones")
                : (type === "permits" ? "Solicitudes de Permisos Realizadas" : "Solicitudes de Vacaciones Realizadas")
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {totalCount === 0 && currentRequests.length === 0 && !hasActiveFilters ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay solicitudes registradas</p>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <TableFilters onFiltersChange={handleFiltersChange} type={type} />

              {/* Información de resultados */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-muted-foreground">
                <span>{totalCount} solicitudes</span>
                <div className="flex items-center gap-2">
                  <span>Mostrar:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20 bg-background border-border">
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
              {currentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No se encontraron solicitudes con los filtros aplicados</p>
                </div>
              ) : (
                <>
                  {/* Vista Desktop - Tabla */}
                  <div className="hidden lg:block">
                    <div className="w-full overflow-hidden">
                      <table className="w-full table-fixed">
                        <colgroup>
                          {(type === "permits" 
                            ? [
                                "15%", // Fecha/Horario
                                "10%", // Tipo
                                isSupervisor ? "26%" : "31%", // Motivo
                                "13%", // Estado
                                isSupervisor ? "22%" : "16%", // Empleado/Aprobador
                                "14%"  // Fecha Solicitud
                              ]
                            : [
                                "18%", // Período
                                isSupervisor ? "28%" : "34%", // Días/Comentarios
                                "14%", // Estado
                                isSupervisor ? "22%" : "18%", // Empleado/Aprobador
                                "18%"  // Fecha Solicitud
                              ]
                          ).map((width, idx) => (
                            <col key={idx} style={{ width }} />
                          ))}
                        </colgroup>
                        <thead className="bg-muted/50 border-b border-border/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                              {type === "permits" ? "Fecha / Horario" : "Período"}
                            </th>
                            {type === "permits" && (
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Tipo
                              </th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                              {type === "permits" ? "Motivo / Comentarios" : "Días / Comentarios"}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {isSupervisor ? "Empleado" : "Aprobador"}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                              Fecha Solicitud
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border/50">
                          {currentRequests.map((request) => (
                            <tr
                              key={request.id}
                              className="hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => handleRowClick(request)}
                            >
                              <td className="px-4 py-4">
                                <div className="text-sm font-bold text-foreground truncate">
                                  {type === "permits"
                                    ? (request as PermitRequest).date
                                    : (request as VacationRequest).period}
                                </div>
                                {type === "permits" && (
                                  <div className="text-sm text-muted-foreground truncate">
                                    {(request as PermitRequest).timeRange}
                                  </div>
                                )}
                              </td>

                              {type === "permits" && (
                                <td className="px-4 py-4">
                                  <div className="flex flex-col gap-1">
                                    {(request as PermitRequest).tipo === "incapacidad" ? (
                                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 text-xs w-fit dark:text-amber-500 font-medium">
                                        Incapacidad
                                      </Badge>
                                    ) : (request as PermitRequest).tipo === "duelo" ? (
                                      <Badge variant="outline" className="bg-slate-500/10 text-slate-700 border-slate-500/20 hover:bg-slate-500/20 text-xs w-fit dark:text-slate-300 font-medium">
                                        Duelo
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-xs w-fit font-medium">
                                        Permiso
                                      </Badge>
                                    )}
                                    {(request as PermitRequest).compensatorio && (
                                      <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20 text-xs w-fit dark:text-purple-400 font-medium">
                                        Compensatorio
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              )}

                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                  {type === "permits" && (
                                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                                      {(request as PermitRequest).reason}
                                    </p>
                                  )}

                                  {type === "vacations" && (
                                    <VacationDaysInfo request={request as VacationRequest} />
                                  )}

                                  {request.employeeComments && (
                                    <div className="comment-container rounded-md bg-muted/30 px-3 py-2 border border-border/50 text-foreground">
                                      <div className="comment-content">
                                        {renderFormattedContent(request.employeeComments)}
                                      </div>
                                      <div className="comment-gradient"></div>
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <RequestStatusBadge status={request.status} />
                                {request.responseDate && (
                                  <div className="text-xs text-muted-foreground mt-1 truncate">
                                    Respondido: {request.responseDate}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-4">
                                {isSupervisor ? (
                                  <div className="text-sm text-foreground truncate font-medium">
                                    {(request as PermitRequest).employeeName ?? "—"}
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-sm text-foreground truncate font-medium">{request.approver}</div>
                                    <div className="text-sm text-muted-foreground">Supervisor</div>
                                  </>
                                )}
                              </td>

                              <td className="px-4 py-4 text-sm text-muted-foreground truncate">{request.submittedDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="lg:hidden space-y-4">
                    {currentRequests.map((request) => (
                      <Card
                        key={request.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors border-l-4 border-l-primary bg-card text-card-foreground border-border/50"
                        onClick={() => handleRowClick(request)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header con ID y Estado */}
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-primary">{request.id}</span>
                                {type === "permits" && (
                                  <>
                                    {(request as PermitRequest).tipo === "incapacidad" ? (
                                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 text-[10px] px-1.5 dark:text-amber-500 font-medium">
                                        Incapacidad
                                      </Badge>
                                    ) : (request as PermitRequest).tipo === "duelo" ? (
                                      <Badge variant="outline" className="bg-slate-500/10 text-slate-700 border-slate-500/20 hover:bg-slate-500/20 text-[10px] px-1.5 dark:text-slate-300 font-medium">
                                        Duelo
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-[10px] px-1.5 font-medium">
                                        Permiso
                                      </Badge>
                                    )}
                                    {(request as PermitRequest).compensatorio && (
                                      <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20 text-[10px] px-1.5 dark:text-purple-400 font-medium">
                                        Compensatorio
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                              <RequestStatusBadge status={request.status} />
                            </div>

                            {/* Información Principal */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-foreground">
                                    {type === "permits"
                                      ? (request as PermitRequest).date
                                      : (request as VacationRequest).period}
                                  </div>
                                  {type === "permits" && (
                                    <div className="text-xs text-muted-foreground">{(request as PermitRequest).timeRange}</div>
                                  )}
                                </div>
                              </div>

                              {type === "permits" && (
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-foreground">
                                    {(request as PermitRequest).reason}
                                  </div>
                                  {request.employeeComments && (
                                    <div className="bg-muted/30 border border-border/50 p-2 rounded text-xs text-foreground">
                                      {renderFormattedContent(request.employeeComments)}
                                    </div>
                                  )}
                                </div>
                              )}

                              {type === "vacations" && (
                                <VacationDaysInfoMobile request={request as VacationRequest} />
                              )}
                            </div>

                            {/* Supervisor / Empleado y Fecha */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>
                                  {isSupervisor
                                    ? (request as PermitRequest).employeeName ?? "—"
                                    : request.approver}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{request.submittedDate}</span>
                              </div>
                            </div>

                            {/* Fecha de Respuesta */}
                            {request.responseDate && (
                              <div className="text-xs text-foreground bg-muted/50 p-2 rounded border border-border/50">
                                <strong className="text-muted-foreground font-medium">Respondido:</strong> {request.responseDate}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50 bg-muted/30 px-4 py-3 rounded-b-lg mt-0">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1 font-medium">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} solicitudes
                  </div>
                  <div className="flex items-center space-x-2 order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 transition-all bg-background border-border"
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
            </>
          )}
        </CardContent>
      </Card>

      <RequestDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        request={selectedRequest}
        type={type}
        onDelete={handleDeleteRequest}
        canApprove={canApprove}
        onApproved={id => handleRequestProcessed(id, "aprobada")}
        onRejected={id => handleRequestProcessed(id, "rechazada")}
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
          color: inherit;
        }
        .formatted-content h3 {
          font-size: 0.8125rem;
          font-weight: 600;
          margin: 0.25rem 0;
          line-height: 1.3;
          color: inherit;
        }
        .formatted-content ul, .formatted-content ol {
          margin: 0.25rem 0;
          padding-left: 1rem;
        }
        .formatted-content li {
          margin: 0.125rem 0;
          color: inherit;
          opacity: 0.9;
          font-size: 0.75rem;
        }
        .formatted-content p {
          margin: 0.25rem 0;
          color: inherit;
          opacity: 0.9;
          line-height: 1.4;
          font-size: 0.75rem;
        }
        .formatted-content strong {
          font-weight: 600;
          color: inherit;
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

        /* Contenedor de comentarios con degradado inteligente para modo claro y oscuro */
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
          background: linear-gradient(to bottom, transparent 0%, var(--card, hsl(0,0%,100%)) 100%);
          pointer-events: none;
          z-index: 2;
        }

        :global(.dark) .comment-gradient {
          background: linear-gradient(to bottom, transparent 0%, rgba(15, 23, 42, 0.9) 100%);
        }

        /* Efecto hover en la fila */
        tr:hover .comment-container {
          background-color: var(--muted, rgba(255, 255, 255, 0.05));
          border-radius: 4px;
        }

        tr:hover .comment-gradient {
          background: linear-gradient(to bottom, transparent 0%, var(--muted, rgba(255, 255, 255, 0.05)) 100%);
        }

        :global(.dark) tr:hover .comment-gradient {
          background: linear-gradient(to bottom, transparent 0%, rgba(30, 41, 59, 0.9) 100%);
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
