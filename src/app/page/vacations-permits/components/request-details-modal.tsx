"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  Download,
  FileText,
  ImageIcon,
  Building,
  Trash2,
  AlertTriangle,
  Printer,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { RequestStatusBadge } from "./request-status-badge"
import { WaitModal } from "./wait-modal"
import { useEffect, useState } from "react"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useSession } from "next-auth/react"

interface RequestDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: any
  type: "permits" | "vacations"
  onDelete?: (requestId: string) => void
  /** Si es true, muestra botones Aprobar/Rechazar para solicitudes pendientes */
  canApprove?: boolean
  onApproved?: (requestId: string) => void
  onRejected?: (requestId: string) => void
}

interface UserProfile {
  id: number;
  name: string;
  position: string;
  creationDate: string;
  area: string;
  country: string;
  supervisorName: string;
  supervisorArea: string;
  supervisorPosition: string;
}

/**
 * Parsea un string de fecha en múltiples formatos a Date (sin componente de hora).
 * Soporta: "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD HH:mm:ss", "DD/MM/YYYY"
 */
function parseDateOnly(s: string): Date {
  if (!s) return new Date(NaN)
  // ISO o "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const part = s.split("T")[0].split(" ")[0]  // "YYYY-MM-DD"
    const [y, m, d] = part.split("-")
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  // "DD/MM/YYYY"
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/")
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  return new Date(s)
}

/** Cuenta días laborables (lun–vie) entre dos fechas inclusive */
function countWorkDays(startStr: string, endStr: string): number {
  const start = parseDateOnly(startStr)
  const end   = parseDateOnly(endStr)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Cuenta días totales entre dos fechas inclusive */
function countTotalDays(startStr: string, endStr: string): number {
  const start = parseDateOnly(startStr)
  const end   = parseDateOnly(endStr)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

/** Extrae solo la parte de fecha de "YYYY-MM-DD HH:mm:ss" o ISO y la formatea a "DD/MM/YYYY" */
function formatDatePart(dt?: string): string {
  if (!dt) return "—"
  const datePart = dt.split("T")[0].split(" ")[0]   // "YYYY-MM-DD"
  const [y, m, d] = datePart.split("-")
  if (!y || !m || !d) return dt
  return `${d}/${m}/${y}`
}

/** Extrae solo la parte de hora de "YYYY-MM-DD HH:mm:ss" o ISO → "HH:mm" */
function formatTimePart(dt?: string): string {
  if (!dt) return "—"
  const timePart = dt.includes("T") ? dt.split("T")[1] : dt.split(" ")[1]
  if (!timePart) return "—"
  return timePart.slice(0, 5)   // "HH:mm"
}

export function RequestDetailsModal({
  open, onOpenChange, request, type, onDelete,
  canApprove = false, onApproved, onRejected,
}: RequestDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Flujo aprobar / rechazar
  const [actionMode, setActionMode] = useState<null | "approve" | "reject">(null)
  const [approverComment, setApproverComment] = useState("")
  const [actionStatus, setActionStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [actionError, setActionError] = useState("")

  const resetAction = () => {
    setActionMode(null)
    setApproverComment("")
    setActionError("")
    setActionStatus("idle")
  }

  /** Extrae el número puro del ID (ej. "PER-42" → "42") */
  const numericId = (id: string) => id.replace(/^[A-Z]+-/i, "")

  const handleApprove = async () => {
    if (!session?.user?.accessToken || !request) return
    setActionStatus("loading")
    setActionError("")
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/permissions/${numericId(request.id)}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ approverComment: approverComment.trim() || undefined }),
        }
      )
      if (res.status === 403) { setActionError("No tienes permiso para aprobar esta solicitud."); setActionStatus("error"); return }
      if (res.status === 409) { setActionError("Esta solicitud ya fue procesada anteriormente."); setActionStatus("error"); return }
      if (!res.ok) { setActionError("Error al aprobar. Intenta de nuevo."); setActionStatus("error"); return }
      setActionStatus("success")
    } catch {
      setActionError("Error de conexión. Intenta de nuevo.")
      setActionStatus("error")
    }
  }

  const handleReject = async () => {
    if (!session?.user?.accessToken || !request) return
    if (!approverComment.trim()) { setActionError("El motivo del rechazo es obligatorio."); return }
    setActionStatus("loading")
    setActionError("")
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/permissions/${numericId(request.id)}/reject`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ approverComment: approverComment.trim() }),
        }
      )
      if (res.status === 403) { setActionError("No tienes permiso para rechazar esta solicitud."); setActionStatus("error"); return }
      if (res.status === 409) { setActionError("Esta solicitud ya fue procesada anteriormente."); setActionStatus("error"); return }
      if (!res.ok) { setActionError("Error al rechazar. Intenta de nuevo."); setActionStatus("error"); return }
      setActionStatus("success")
    } catch {
      setActionError("Error de conexión. Intenta de nuevo.")
      setActionStatus("error")
    }
  }

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/profile_info`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al obtener el perfil");
          return res.json();
        })
        .then((data: UserProfile) => {
          setProfile(data);
        })
        .catch((err: Error) => setError(err.message));
    }
  }, [session]);

  const handleDelete = () => {
    if (onDelete && request) {
      onDelete(request.id)
      setShowDeleteConfirm(false)
    }
  }

  const generatePDF = async () => {
    if (!request) return;
    setError(null);
    setLoading(true);

    try {
      const mm = (n: number) => (n * 72) / 25.4
      const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      const wrapText = (text: string, maxWidth: number, size: number, font: any) => {
        const words = (text ?? "").toString().split(/\s+/)
        const lines: string[] = []
        let line = ""
        for (const w of words) {
          const test = line ? `${line} ${w}` : w
          if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test
          else { if (line) lines.push(line); line = w }
        }
        if (line) lines.push(line)
        return lines
      }

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();

      const MARGIN_X = mm(18)
      const MARGIN_TOP = mm(22)
      const COLOR_TEXT = rgb(0.10, 0.10, 0.10)
      const COLOR_LABEL = rgb(0.35, 0.35, 0.35)
      const COLOR_MUTED = rgb(0.45, 0.45, 0.45)
      const COLOR_LINE  = rgb(0.70, 0.70, 0.70)

      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let cursorY = height - MARGIN_TOP

      page.drawText("INFARMA", { x: MARGIN_X, y: cursorY, size: 18, font: fontBold, color: COLOR_TEXT })
      cursorY -= 20
      const pdfTitle = type === "vacations"
        ? "Solicitud de Vacaciones"
        : request.tipo === "incapacidad" ? "Solicitud de Incapacidad Médica"
        : request.tipo === "duelo" ? "Solicitud de Permiso por Duelo"
        : "Solicitud de Permiso Laboral"
      page.drawText(pdfTitle, { x: MARGIN_X, y: cursorY, size: 14, font: fontBold, color: COLOR_TEXT })
      cursorY -= 20

      page.drawText(`ID: ${request.id}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
      cursorY -= 15
      page.drawText(`Fecha Solicitud: ${request.submittedDate}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
      cursorY -= 30

      page.drawText("Datos del Empleado", { x: MARGIN_X, y: cursorY, size: 12, font: fontBold, color: COLOR_TEXT })
      cursorY -= 15
      page.drawText(`Nombre: ${profile?.name || ""}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
      cursorY -= 15
      page.drawText(`Área: ${profile?.area || ""}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
      cursorY -= 30

      page.drawText("Detalles", { x: MARGIN_X, y: cursorY, size: 12, font: fontBold, color: COLOR_TEXT })
      cursorY -= 15

      if (type === "permits") {
        const tipoLabel =
          request.tipo === "incapacidad" ? "Incapacidad Médica"
          : request.tipo === "duelo" ? "Permiso por Duelo"
          : "Permiso Laboral"
        page.drawText(`Tipo: ${tipoLabel}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
        cursorY -= 15

        if (request.tipo === "permiso") {
          const fechaDisplay = request.startDateTime ? formatDatePart(request.startDateTime) : request.date
          const horaDisplay = request.startDateTime && request.endDateTime
            ? `${formatTimePart(request.startDateTime)} - ${formatTimePart(request.endDateTime)}`
            : request.timeRange
          page.drawText(`Fecha: ${fechaDisplay}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
          cursorY -= 15
          page.drawText(`Horario: ${horaDisplay}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
          cursorY -= 15
          if (request.compensatorio) {
            page.drawText("Tipo compensatorio: Sí (horas trabajadas fuera de horario)", { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
            cursorY -= 15
          }
        } else {
          const periodoLabel = request.tipo === "incapacidad" ? "Período de incapacidad" : "Período de ausencia"
          const rangoDisplay = request.startDateTime && request.endDateTime
            ? `${formatDatePart(request.startDateTime)} - ${formatDatePart(request.endDateTime)}`
            : request.date
          page.drawText(`${periodoLabel}: ${rangoDisplay}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
          cursorY -= 15
        }

        if (request.reason) {
          page.drawText(`Motivo: ${request.reason}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
          cursorY -= 15
        }
      } else {
        page.drawText(`Período: ${request.period}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
        cursorY -= 15
        const pdfStart = request.startDateTime ?? request.start_datetime ?? request.startDate ?? request.start_date
        const pdfEnd   = request.endDateTime   ?? request.end_datetime   ?? request.endDate   ?? request.end_date
        const pdfIsSingleDay = pdfStart && pdfEnd &&
          parseDateOnly(pdfStart).getTime() === parseDateOnly(pdfEnd).getTime()
        const pdfMultiplier = request.halfDay && pdfIsSingleDay ? 0.5 : 1
        const pdfTotal = pdfStart && pdfEnd
          ? countTotalDays(pdfStart, pdfEnd) * pdfMultiplier
          : (request.days ?? 0)
        const pdfWork  = pdfStart && pdfEnd
          ? countWorkDays(pdfStart, pdfEnd) * pdfMultiplier
          : (request.workDays ?? 0)
        const halfDayLabel = request.halfDay && pdfIsSingleDay ? " — Medio día" : ""
        page.drawText(`Días: ${pdfTotal} total (${pdfWork} laborables)${halfDayLabel}`, { x: MARGIN_X, y: cursorY, size: 11, font: fontRegular, color: COLOR_TEXT })
        cursorY -= 15
      }
      cursorY -= 15

      if (request.employeeComments) {
        page.drawText("Comentarios:", { x: MARGIN_X, y: cursorY, size: 12, font: fontBold, color: COLOR_TEXT })
        cursorY -= 15
        const cleanComments = request.employeeComments.replace(/<[^>]*>?/gm, '')
        const lines = wrapText(cleanComments, width - MARGIN_X * 2, 10, fontRegular)
        for (const line of lines) {
          page.drawText(line, { x: MARGIN_X, y: cursorY, size: 10, font: fontRegular, color: COLOR_TEXT })
          cursorY -= 12
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      downloadBlob(blob, `Solicitud_${request.id}.pdf`);
    } catch (err: any) {
      console.error(err)
      setError("Error al generar PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {!request ? (
          <div className="p-8 text-center text-gray-500">Cargando detalles...</div>
        ) : (
          <>
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between pr-8">
                <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                  <Building className="h-6 w-6 text-blue-600" />
                  Detalle de Solicitud {request.id}
                </DialogTitle>
                <RequestStatusBadge status={request.status} />
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-sm font-semibold uppercase text-gray-500">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Fecha de solicitud — siempre visible */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Fecha Solicitud</p>
                        <p className="font-medium">{request.submittedDate}</p>
                      </div>

                      {/* Tipo con badges — solo permisos */}
                      {type === "permits" && (
                        <div>
                          <p className="text-xs text-gray-500">Tipo</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {request.tipo === "incapacidad" ? (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Incapacidad</Badge>
                            ) : request.tipo === "duelo" ? (
                              <Badge className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100">Duelo</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">Permiso</Badge>
                            )}
                            {request.compensatorio && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Compensatorio</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── PERMISO: fecha + rango de horas ── */}
                    {type === "permits" && request.tipo === "permiso" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Fecha del permiso</p>
                          <div className="flex items-center gap-2 text-blue-700 font-medium mt-1">
                            <Calendar className="h-4 w-4 shrink-0" />
                            {request.startDateTime
                              ? formatDatePart(request.startDateTime)
                              : request.date}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Horario</p>
                          <div className="flex items-center gap-2 text-blue-700 font-medium mt-1">
                            <Clock className="h-4 w-4 shrink-0" />
                            {request.startDateTime && request.endDateTime
                              ? `${formatTimePart(request.startDateTime)} - ${formatTimePart(request.endDateTime)}`
                              : request.timeRange}
                          </div>
                        </div>
                        {request.compensatorio && (
                          <div className="sm:col-span-2">
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-800">
                              <span>⏱</span>
                              <span className="font-medium">Tiempo compensatorio</span>
                              <span className="text-amber-600 text-xs">— horas trabajadas fuera de horario</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── INCAPACIDAD: rango de fechas ── */}
                    {type === "permits" && request.tipo === "incapacidad" && (
                      <div>
                        <p className="text-xs text-gray-500">Período de incapacidad</p>
                        <div className="flex items-center gap-2 text-orange-700 font-medium mt-1">
                          <Calendar className="h-4 w-4 shrink-0 text-orange-500" />
                          {request.startDateTime && request.endDateTime
                            ? `${formatDatePart(request.startDateTime)} → ${formatDatePart(request.endDateTime)}`
                            : request.date}
                        </div>
                      </div>
                    )}

                    {/* ── DUELO: rango de fechas + banner ── */}
                    {type === "permits" && request.tipo === "duelo" && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Período de ausencia</p>
                          <div className="flex items-center gap-2 text-gray-700 font-medium mt-1">
                            <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
                            {request.startDateTime && request.endDateTime
                              ? `${formatDatePart(request.startDateTime)} → ${formatDatePart(request.endDateTime)}`
                              : request.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600">
                          <span>🕊️</span>
                          <span>Permiso por duelo familiar</span>
                        </div>
                      </div>
                    )}

                    {/* ── VACACIONES: período + días ── */}
                    {type === "vacations" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Período</p>
                            <div className="flex items-center gap-2 text-blue-700 font-medium mt-1">
                              <Calendar className="h-4 w-4 shrink-0" />
                              {request.period}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Días</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                            {(() => {
                              const startStr: string | undefined =
                                request.startDateTime ?? request.start_datetime ??
                                request.startDate     ?? request.start_date
                              const endStr: string | undefined =
                                request.endDateTime ?? request.end_datetime ??
                                request.endDate     ?? request.end_date
                              const isSingleDay = startStr && endStr &&
                                parseDateOnly(startStr).getTime() === parseDateOnly(endStr).getTime()
                              const multiplier = request.halfDay && isSingleDay ? 0.5 : 1
                              const total = startStr && endStr
                                ? countTotalDays(startStr, endStr) * multiplier
                                : (request.days ?? 0)
                              const work = startStr && endStr
                                ? countWorkDays(startStr, endStr) * multiplier
                                : (request.workDays ?? 0)
                              return (
                                <>
                                  {request.halfDay && isSingleDay && (
                                    <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-xs font-medium">
                                      ½ día
                                    </span>
                                  )}
                                  {!(request.halfDay && isSingleDay) && (
                                    <span className="font-medium">{total} totales</span>
                                  )}
                                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                                    {work} laborables
                                  </span>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gray-50 pb-3">
                    <CardTitle className="text-sm font-semibold uppercase text-gray-500">
                      {type === "permits" ? "Motivo y Comentarios" : "Comentarios"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {type === "permits" && request.reason && (
                      <div>
                        <p className="text-xs text-gray-500">Motivo</p>
                        <p className="font-medium">{request.reason}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Comentarios del empleado</p>
                      <div className="formatted-content bg-blue-50/50 p-4 rounded-lg border border-blue-100 min-h-[60px] mt-1">
                        {request.employeeComments ? (
                          <div dangerouslySetInnerHTML={{ __html: request.employeeComments }} />
                        ) : (
                          <p className="text-gray-400 italic">Sin comentarios</p>
                        )}
                      </div>
                    </div>

                    {/* Adjuntos para incapacidad / duelo */}
                    {type === "permits" && (request.tipo === "incapacidad" || request.tipo === "duelo") && request.attachments?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">
                          {request.tipo === "incapacidad" ? "Comprobante médico" : "Documento de respaldo"}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {request.attachments.map((att: { name: string; type: string; url: string }, i: number) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              {att.type?.startsWith("image/") ? (
                                <ImageIcon className="h-4 w-4 shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate max-w-[180px]">{att.name}</span>
                              <Download className="h-3 w-3 shrink-0 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="bg-blue-50 pb-3">
                    <CardTitle className="text-sm font-semibold uppercase text-gray-500">Estado y Aprobación</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Supervisor</p>
                      <p className="font-medium">{request.approver}</p>
                    </div>
                    {request.responseDate && (
                      <div>
                        <p className="text-xs text-gray-500">Fecha Respuesta</p>
                        <p className="font-medium">{request.responseDate}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Comentarios Supervisor</p>
                      <p className="text-sm italic">{request.comments || "Pendiente"}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full flex gap-2" onClick={generatePDF} disabled={loading}>
                    <Printer className="h-4 w-4" /> {loading ? "Generando..." : "Descargar PDF"}
                  </Button>

                  {/* ── Aprobar / Rechazar (supervisor) ── */}
                  {canApprove && request.status === "pendiente" && (
                    <div className="pt-4 border-t space-y-2">
                      {actionMode === null && (
                        <>
                          <Button
                            className="w-full flex gap-2 bg-green-600 hover:bg-green-700"
                            onClick={() => setActionMode("approve")}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Aprobar
                          </Button>
                          <Button
                            variant="destructive"
                            className="w-full flex gap-2"
                            onClick={() => setActionMode("reject")}
                          >
                            <XCircle className="h-4 w-4" /> Rechazar
                          </Button>
                        </>
                      )}

                      {actionMode === "approve" && (
                        <div className="space-y-2 bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-xs font-medium text-green-800">Aprobar solicitud</p>
                          <Textarea
                            placeholder="Comentario para el empleado (opcional)"
                            value={approverComment}
                            onChange={e => setApproverComment(e.target.value)}
                            rows={3}
                            className="text-sm resize-none"
                          />
                          {actionError && <p className="text-xs text-red-600">{actionError}</p>}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={resetAction} disabled={actionStatus === "loading"}>
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={handleApprove}
                              disabled={actionStatus === "loading"}
                            >
                              {actionStatus === "loading" ? "Procesando..." : "Confirmar"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {actionMode === "reject" && (
                        <div className="space-y-2 bg-red-50 p-3 rounded-lg border border-red-100">
                          <p className="text-xs font-medium text-red-800">Rechazar solicitud</p>
                          <Textarea
                            placeholder="Motivo del rechazo (obligatorio)"
                            value={approverComment}
                            onChange={e => { setApproverComment(e.target.value); setActionError("") }}
                            rows={3}
                            className="text-sm resize-none"
                          />
                          {actionError && <p className="text-xs text-red-600">{actionError}</p>}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={resetAction} disabled={actionStatus === "loading"}>
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={handleReject}
                              disabled={actionStatus === "loading" || !approverComment.trim()}
                            >
                              {actionStatus === "loading" ? "Procesando..." : "Confirmar"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Anular (empleado dueño) ── */}
                  {!canApprove && request.status === "pendiente" && (
                    <div className="pt-4 border-t">
                      {!showDeleteConfirm ? (
                        <Button variant="destructive" className="w-full flex gap-2" onClick={() => setShowDeleteConfirm(true)}>
                          <Trash2 className="h-4 w-4" /> Anular Solicitud
                        </Button>
                      ) : (
                        <div className="space-y-2 bg-red-50 p-3 rounded-lg border border-red-100">
                          <p className="text-xs text-red-800 text-center font-medium">¿Confirmas la anulación?</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>No</Button>
                            <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete}>Sí</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
      <style jsx>{`
        .formatted-content {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
        }
        .formatted-content * {
          direction: ltr !important;
          unicode-bidi: normal !important;
        }
      `}</style>
    </Dialog>
    <WaitModal
      isOpen={actionStatus !== "idle"}
      status={actionStatus === "idle" ? "loading" : actionStatus}
      title={
        actionStatus === "loading"
          ? (actionMode === "approve" ? "Aprobando solicitud..." : "Rechazando solicitud...")
          : actionStatus === "success"
          ? (actionMode === "approve" ? "¡Solicitud aprobada!" : "Solicitud rechazada")
          : (actionMode === "approve" ? "Error al aprobar" : "Error al rechazar")
      }
      message={
        actionStatus === "loading"
          ? "Estamos procesando tu acción..."
          : actionStatus === "success"
          ? (actionMode === "approve"
              ? "La solicitud fue aprobada exitosamente."
              : "La solicitud fue rechazada.")
          : undefined
      }
      errorMessage={actionError}
      onClose={() => {
        if (actionStatus === "success") {
          if (actionMode === "approve") onApproved?.(request?.id)
          else if (actionMode === "reject") onRejected?.(request?.id)
          onOpenChange(false)
        }
        setActionStatus("idle")
      }}
      autoCloseMs={actionStatus === "success" ? 2000 : undefined}
    />
    </>
  )
}
