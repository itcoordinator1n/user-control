"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
} from "lucide-react"
import { RequestStatusBadge } from "./request-status-badge"
import { useEffect, useState } from "react"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { useSession } from "next-auth/react"

interface RequestDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: any
  type: "permits" | "vacations"
  onDelete?: (requestId: string) => void
}


export type VacationRequest = {
  employeeName: string;
  date: string; // ISO string
  process: string;
  area: string;
  daysRequested: number;
  startDate: string; // ISO
  endDate: string; // ISO
  notes?: string;
  signatures: {
    applicantName: string;
    applicantPngUrl: string; // URL pública o protegida por tu API que devuelva image/png
    managerName: string;
    managerPngUrl?: string; // opcional si firma después
    showManagerLineLabel?: string; // p.ej. "Firma del jefe Inmediato y/o Gerente del Proceso"
  };
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


async function fetchImageBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar la imagen: ${url}`);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}


// Formateo rápido de fechas (DD/MM/YYYY)
function fDMY(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
export function RequestDetailsModal({ open, onOpenChange, request, type, onDelete }: RequestDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);


  console.log("El request que le llega al jefe", request)
  useEffect(() => {
    // Asegúrate de que el token esté disponible
    if (session?.user?.accessToken) {
      fetch("https://infarma.duckdns.org/api/profile/profile_info", {
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
        .then((data: UserProfile) => {
          console.log("Informacion del perfil", data)
          setProfile(data);
        })
        .catch((err: Error) => setError(err.message));
    }
  }, [session]);

  const [loading, setLoading] = useState(false);
  if (!request) return null


  // Simula el ID/params. En producción, pásalo por props o estado.
  const requestId = "123";


const generatePDF = async () => { 
  console.log("ESTE ES EL PDF A DESCARGAR")
  setError(null);
  setLoading(true);

  try {
    // ===== Helpers internos =====
    const mm = (n: number) => (n * 72) / 25.4 // milímetros → puntos

    const downloadBlob = (blob: Blob, filename: string) => {
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(link.href)
      link.remove()
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

    const loadImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })

    const dataURLToUint8Array = (dataURL: string) => {
      const base64 = dataURL.split(",")[1]
      const bin = atob(base64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return bytes
    }

    // Quita fondo blanco del PNG
    const pngWithoutWhiteBg = async (url: string, threshold = 245) => {
      const img = await loadImage(url)
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) throw new Error("Canvas no disponible")
      ctx.drawImage(img, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2], a = d[i+3]
        if (a !== 0 && r >= threshold && g >= threshold && b >= threshold) d[i+3] = 0
      }
      ctx.putImageData(imageData, 0, 0)
      return dataURLToUint8Array(canvas.toDataURL("image/png"))
    }

    // ===== 1) Datos =====
    const data = {
      employeeName: profile?.name || "",
      date: request.submittedDate || "",
      process: "Indefinido",
      area: profile?.area || "",
      daysRequested: request.days,
      startDate: request.startDate || "",
      endDate: request.endDate || "",
      notes: request.employeeComments || "",
      signatures: {
        applicantName: profile?.name || "",
        applicantPngUrl: "https://infarma.duckdns.org/uploads/cc3fc14a-ab7f-4a5e-b9da-4e0286818507.png",
        managerName: profile?.supervisorArea || "",
        // managerPngUrl: "https://tu-api/firma-jefe.png",
        showManagerLineLabel: "Firma del jefe inmediato y/o Gerente del proceso",
      }
    }

    // ===== 2) PDF =====
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Estilos y layout suaves
    const MARGIN_X = mm(18)
    const MARGIN_TOP = mm(22)
    const MARGIN_BOTTOM = mm(18)
    const GAP_BEFORE_SIGNATURES = mm(25)

    const COLOR_TEXT = rgb(0.10, 0.10, 0.10)
    const COLOR_LABEL = rgb(0.35, 0.35, 0.35)   // etiquetas
    const COLOR_MUTED = rgb(0.45, 0.45, 0.45)   // meta/pie
    const COLOR_LINE  = rgb(0.70, 0.70, 0.70)   // líneas más sutiles

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const SIZE_TITLE = 18
    const SIZE_H1 = 14
    const SIZE_LABEL = 11
    const SIZE_TEXT = 11
    const SIZE_META = 9

    let cursorY = height - MARGIN_TOP

    // —— helpers de dibujo —— //
    const hr = (yGap = 8) => {
      page.drawLine({
        start: { x: MARGIN_X, y: cursorY },
        end: { x: width - MARGIN_X, y: cursorY },
        thickness: 0.4,               // más delgado
        color: COLOR_LINE,
      })
      cursorY -= yGap
    }

    const sectionTitle = (txt: string, gap = 6) => {
      page.drawText(txt, { x: MARGIN_X, y: cursorY, size: SIZE_H1, font: fontBold, color: COLOR_TEXT })
      cursorY -= SIZE_H1 + gap
    }

    // fila 1 columna (etiqueta regular, valor regular)
    const row = (label: string, value = "") => {
      const y = cursorY
      page.drawText(label, { x: MARGIN_X, y, size: SIZE_LABEL, font: fontRegular, color: COLOR_LABEL })
      const labelW = fontRegular.widthOfTextAtSize(label, SIZE_LABEL)
      const xValue = MARGIN_X + labelW + 6
      if (value) page.drawText(value, { x: xValue, y, size: SIZE_TEXT, font: fontRegular, color: COLOR_TEXT })
      // línea suave debajo del valor (un poco más abajo para no "subrayar" el texto)
      page.drawLine({
        start: { x: xValue - 2, y: y - 4 },
        end:   { x: width - MARGIN_X, y: y - 4 },
        thickness: 0.4,
        color: COLOR_LINE,
      })
      cursorY -= 16
    }

    // fila 2 columnas
    const row2 = (l1: string, v1 = "", l2: string, v2 = "") => {
      const colGap = mm(8)
      const usableW = width - MARGIN_X * 2
      const colW = (usableW - colGap) / 2

      // Izquierda
      {
        const x = MARGIN_X, y = cursorY
        page.drawText(l1, { x, y, size: SIZE_LABEL, font: fontRegular, color: COLOR_LABEL })
        const labelW = fontRegular.widthOfTextAtSize(l1, SIZE_LABEL)
        const vx = x + labelW + 6
        if (v1) page.drawText(v1, { x: vx, y, size: SIZE_TEXT, font: fontRegular, color: COLOR_TEXT })
        page.drawLine({
          start: { x: vx - 2, y: y - 4 },
          end:   { x: x + colW, y: y - 4 },
          thickness: 0.4,
          color: COLOR_LINE,
        })
      }

      // Derecha
      {
        const x = MARGIN_X + colW + colGap, y = cursorY
        page.drawText(l2, { x, y, size: SIZE_LABEL, font: fontRegular, color: COLOR_LABEL })
        const labelW = fontRegular.widthOfTextAtSize(l2, SIZE_LABEL)
        const vx = x + labelW + 6
        if (v2) page.drawText(v2, { x: vx, y, size: SIZE_TEXT, font: fontRegular, color: COLOR_TEXT })
        page.drawLine({
          start: { x: vx - 2, y: y - 4 },
          end:   { x: x + colW, y: y - 4 },
          thickness: 0.4,
          color: COLOR_LINE,
        })
      }

      cursorY -= 16
    }

    const paragraphBox = (label: string, text: string, boxHeight = mm(40)) => {
      page.drawText(label, { x: MARGIN_X, y: cursorY, size: SIZE_LABEL, font: fontRegular, color: COLOR_LABEL })
      cursorY -= 10
      const boxX = MARGIN_X, boxY = cursorY - boxHeight, boxW = width - MARGIN_X * 2
      page.drawRectangle({
        x: boxX, y: boxY, width: boxW, height: boxHeight,
        borderColor: COLOR_LINE, borderWidth: 0.6
      })
      if (text) {
        const pad = 6
        const lines = wrapText(text, boxW - pad * 2, 10.5, fontRegular)
        let ty = boxY + boxHeight - pad - 10
        for (const ln of lines) {
          page.drawText(ln, { x: boxX + pad, y: ty, size: 10.5, font: fontRegular, color: COLOR_TEXT })
          ty -= 12
          if (ty < boxY + pad) break
        }
      }
      cursorY = boxY - 16
    }

    const signatureBlock = async () => {
      const lineW = mm(65)
      const signY = cursorY

      // Solicitante
      page.drawLine({ start: { x: MARGIN_X, y: signY }, end: { x: MARGIN_X + lineW, y: signY }, thickness: 0.4, color: COLOR_LINE })
      page.drawText("Firma del Solicitante", { x: MARGIN_X + 6, y: signY - 14, size: SIZE_META, font: fontRegular, color: COLOR_MUTED })
      if (data.signatures.applicantPngUrl) {
        try {
          const bytes = await pngWithoutWhiteBg(data.signatures.applicantPngUrl, 245)
          const img = await pdfDoc.embedPng(bytes)
          const dims = img.scale(0.22)
          page.drawImage(img, {
            x: MARGIN_X + (lineW - dims.width) / 2,
            y: signY + 4,
            width: dims.width,
            height: dims.height,
          })
        } catch (e) {
          console.warn("No se pudo incrustar firma del solicitante", e);
        }
      }

      // Jefe/Gerente
      // const rightX = width - MARGIN_X - lineW
      // page.drawLine({ start: { x: rightX, y: signY }, end: { x: rightX + lineW, y: signY }, thickness: 0.4, color: COLOR_LINE })
      // page.drawText(data.signatures.showManagerLineLabel || "Firma del jefe inmediato y/o Gerente del proceso", {
      //   x: rightX + 6, y: signY - 14, size: SIZE_META, font: fontRegular, color: COLOR_MUTED
      // })
      // if ((data as any).signatures.managerPngUrl) {
      //   try {
      //     const bytes = await pngWithoutWhiteBg((data as any).signatures.managerPngUrl, 245)
      //     const img = await pdfDoc.embedPng(bytes)
      //     const dims = img.scale(0.22)
      //     page.drawImage(img, {
      //       x: rightX + (lineW - dims.width) / 2,
      //       y: signY + 4,
      //       width: dims.width,
      //       height: dims.height,
      //     })
      //   } catch (e) {
      //     console.warn("No se pudo incrustar firma del jefe/gerente", e);
      //   }
      // }

      cursorY -= 40
    }

    // ===== Encabezado =====
    page.drawText("INFARMA", { x: MARGIN_X, y: cursorY, size: SIZE_TITLE, font: fontBold, color: COLOR_TEXT })
    const metaRightX = width - MARGIN_X - 160
    page.drawText("Código: RO-RH-049", { x: metaRightX, y: cursorY, size: SIZE_META, font: fontRegular, color: COLOR_MUTED })
    cursorY -= 14
    page.drawText("Versión: 06", { x: metaRightX, y: cursorY, size: SIZE_META, font: fontRegular, color: COLOR_MUTED })
    cursorY -= 18
    hr(14)

    // Título + Fecha
    page.drawText("Solicitud de Vacaciones", { x: MARGIN_X, y: cursorY, size: 16, font: fontBold, color: COLOR_TEXT })
    const fechaStr = data.date || ""
    page.drawText(`Fecha de Solicitud: ${fechaStr}`, {
      x: width - MARGIN_X - fontRegular.widthOfTextAtSize(`Fecha de Solicitud: ${fechaStr}`, 11),
      y: cursorY,
      size: 11,
      font: fontRegular,
      color: COLOR_MUTED, // más suave
    })
    cursorY -= 22

    // ===== Datos del empleado =====
    sectionTitle("Datos del Empleado")
    row("Nombre del empleado:", data.employeeName)
    row2("Proceso:", data.process, "Área:", data.area)

    // ===== Detalle de la Solicitud =====
    sectionTitle("Detalle de la Solicitud")
    {
      const frase1 = "A través de la presente solicito"
      const diasTxt = `${data.daysRequested ?? ""}`
      const frase2 = "días de vacaciones."
      page.drawText(frase1, { x: MARGIN_X, y: cursorY, size: SIZE_TEXT, font: fontRegular, color: COLOR_TEXT })
      const off1 = MARGIN_X + fontRegular.widthOfTextAtSize(frase1, SIZE_TEXT) + 6
      page.drawText(diasTxt, { x: off1, y: cursorY, size: SIZE_TEXT, font: fontBold, color: COLOR_TEXT }) // se mantiene solo este en negrita
      const off2 = off1 + fontBold.widthOfTextAtSize(diasTxt, SIZE_TEXT) + 6
      page.drawText(frase2, { x: off2, y: cursorY, size: SIZE_TEXT, font: fontRegular, color: COLOR_TEXT })
      cursorY -= 16
    }
    row2("Fecha de inicio:", data.startDate, "Fecha de término:", data.endDate)

    // ===== Observaciones =====
    sectionTitle("Observaciones", 2)
    paragraphBox("Comentarios del empleado:", data.notes ?? "", mm(40))

    // Espacio grande antes de firmas
    cursorY -= GAP_BEFORE_SIGNATURES

    // ===== Firmas =====
    await signatureBlock()

    // ===== Pie =====
    cursorY = MARGIN_BOTTOM
    hr(8)
    const gen = `Documento generado automáticamente — ${new Date().toLocaleDateString("es-HN")}`
    page.drawText(gen, { x: MARGIN_X, y: cursorY, size: SIZE_META, font: fontRegular, color: COLOR_MUTED })
    const pageNum = "Página 1 de 1"
    page.drawText(pageNum, {
      x: width - MARGIN_X - fontRegular.widthOfTextAtSize(pageNum, SIZE_META),
      y: cursorY,
      size: SIZE_META,
      font: fontRegular,
      color: COLOR_MUTED,
    })

    // ===== Guardar =====
    const pdfBytes: Uint8Array = await pdfDoc.save(); 
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    downloadBlob(blob, `Solicitud_vacaciones_${(data.employeeName || "empleado").replace(/\s+/g, "_")}.pdf`);

  } catch (err: any) {
    setError(err?.message || "Error al generar PDF");
  } finally {
    setLoading(false);
  }
};

  const handleDelete = () => {
    if (onDelete) {
      onDelete(request.id)
      setShowDeleteConfirm(false)
    }
  }

  const getPDFContent = () => {
    const company = "EMPRESA XYZ S.A.C."
    const department = "DEPARTAMENTO DE RECURSOS HUMANOS"

    let content = `
${company}
${department}
${"=".repeat(50)}

SOLICITUD DE ${type === "permits" ? "PERMISO" : "VACACIONES"}
Número de Solicitud: ${request.id}

INFORMACIÓN DEL EMPLEADO:
- Nombre: ${profile?.name}
- Cargo: ${profile?.position}
- Departamento: ${profile?.area}
- Fecha de Solicitud: ${request.submittedDate}

DETALLES DE LA SOLICITUD:
`

    if (type === "permits") {
      content += `
- Fecha del Permiso: ${request.date}
- Horario: ${request.timeRange}
- Motivo: ${request.reason}
- Comentarios del Empleado: ${request.employeeComments || "Sin comentarios adicionales"}
`
      if (request.attachments && request.attachments.length > 0) {
        content += `
DOCUMENTOS ADJUNTOS:
${request.attachments.map((file: any, index: number) => `${index + 1}. ${file.name}`).join("\n")}
`
      }
    } else {
      content += `
- Período de Vacaciones: ${request.period}
- Fecha de Inicio: ${request.startDate}
- Fecha de Fin: ${request.endDate}
- Días Totales: ${request.days}
- Días Laborables: ${request.workDays}
- Comentarios del Empleado: ${request.employeeComments || "Sin comentarios adicionales"}
`
    }

    content += `
INFORMACIÓN DEL SUPERVISOR:
- Nombre: ${request.approver}
- Cargo: Gerente de Recursos Humanos
- Departamento: Administración

ESTADO DE LA SOLICITUD: ${request.status.toUpperCase()}
`

    if (request.responseDate) {
      content += `Fecha de Respuesta: ${request.responseDate}\n`
    }

    if (request.comments) {
      content += `
COMENTARIOS DEL SUPERVISOR:
${request.comments}
`
    }

    content += `
${"=".repeat(50)}
Documento generado automáticamente
Fecha de generación: ${new Date().toLocaleDateString("es-ES")}
`

    return content
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900 flex items-center justify-between">
            <div className="flex items-center">
              <Building className="mr-2 h-6 w-6" />
              Detalles de {type === "permits" ? "Permiso" : "Vacaciones"} - {request.id}
            </div>
            {request.status === "pendiente" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Empleado */}
          <Card>
            <CardHeader className="pb-3 bg-gray-50">
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5" />
                Información del Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Empleado</p>
                  <p className="font-semibold">{profile?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cargo</p>
                  <p className="font-semibold">{profile?.position}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Departamento</p>
                  <p className="font-semibold">{profile?.area}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha de Solicitud</p>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                    <span className="font-semibold">{request.submittedDate}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado y Información de la Solicitud */}
          <Card>
            <CardHeader className="pb-3 bg-blue-50">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Estado de la Solicitud</CardTitle>
                <RequestStatusBadge status={request.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {type === "permits" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha del Permiso</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{request.date}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Horario</p>
                    <div className="flex items-center mt-1">
                      <Clock className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{request.timeRange}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-600 mb-2">Motivo del Permiso</p>
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm">{request.reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {type === "vacations" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha de Inicio</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="mr-2 h-4 w-4 text-green-600" />
                      <span className="font-semibold">{request.startDate}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha de Fin</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="mr-2 h-4 w-4 text-red-600" />
                      <span className="font-semibold">{request.endDate}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-900">{request.days}</div>
                          <div className="text-sm text-blue-700">Días Totales</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-900">{request.workDays}</div>
                          <div className="text-sm text-blue-700">Días Laborables</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {request.responseDate && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha de Respuesta</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="mr-2 h-4 w-4 text-green-600" />
                      <span className="font-semibold">{request.responseDate}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comentarios del Empleado */}
          {request.employeeComments && (
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
                    dangerouslySetInnerHTML={{ __html: request.employeeComments }}
                    style={{ direction: "ltr", textAlign: "left" }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Archivos Adjuntos */}
          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Documentos Adjuntos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a target="_blank" href={request.attachments[0].url} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {request.attachments.map((file: any, index: number) => (
                    <div key={index} className="text-center p-3 border rounded-lg">
                      <div className="flex justify-center mb-2">
                        {file.type.startsWith("image/") ? (
                          <img
                            src={request.attachments[0].url || "/placeholder.svg"}
                            alt={file.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs truncate" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                  ))}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Información del Supervisor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5" />
                Supervisor Asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{request.approver}</h3>
                  <p className="text-sm text-gray-600">{profile?.supervisorName}</p>
                  <Badge variant="secondary" className="mt-1">
                    {profile?.supervisorArea}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comentarios del Supervisor */}
          {request.comments && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Comentarios del Supervisor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-900">{request.comments}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cerrar
            </Button>
            <Button onClick={generatePDF} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
; <style jsx>{`
  .formatted-content {
    direction: ltr !important;
    text-align: left !important;
    unicode-bidi: normal !important;
  }
  .formatted-content h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.5rem 0;
    line-height: 1.4;
    color: #1f2937;
  }
  .formatted-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0.5rem 0;
    line-height: 1.4;
    color: #1f2937;
  }
  .formatted-content ul, .formatted-content ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  .formatted-content li {
    margin: 0.25rem 0;
    color: #374151;
  }
  .formatted-content p {
    margin: 0.5rem 0;
    color: #374151;
    line-height: 1.5;
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
`}</style>
