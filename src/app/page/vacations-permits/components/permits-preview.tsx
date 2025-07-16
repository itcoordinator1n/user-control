"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, FileText, Send } from "lucide-react"
import { useSession } from "next-auth/react";

interface PermitPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: {
    date?: Date
    startTime: string
    endTime: string
    reason: string
    comments: string
    files: File[]
  }
  onSubmitSuccess?: () => void
}

export function PermitPreview({ open, onOpenChange, data, onSubmitSuccess }: PermitPreviewProps) {
  const { data: session, status } = useSession()
  console.log("Hora de inicio", data.startTime)
  const supervisor = {
    name: "María González Rodríguez",
    position: "Gerente de Recursos Humanos",
    department: "Administración",
  }

  const getFileThumbnail = (file: File) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      return (
        <img
          src={url || "/placeholder.svg"}
          alt={file.name}
          className="w-16 h-16 object-cover rounded border"
          onLoad={() => URL.revokeObjectURL(url)}
        />
      )
    }
    return (
      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
    )
  }

  const handleSubmit = async () => {
    try {
      if (status !== "authenticated") {
        throw new Error("No estás autenticado")
      }

      // 1. Extraer YYYY-MM-DD de la fecha
      const datePart = data?.date?.toISOString().split("T")[0]  // p.ej. "2025-06-17"

      // 2. Construir strings ISO‑8601
      const startDateTime = `${datePart} ${data.startTime}:00`  // "2025-06-17 09:00:00"
      const endDateTime = `${datePart} ${data.endTime}:00`    // "2025-06-17 16:00:00"

      // 3. Montar FormData
      const formData = new FormData()
      if (data.files?.length) {
        formData.append("documento", data.files[0])
      }
      formData.append("startDateTime", startDateTime)
      formData.append("endDateTime", endDateTime)
      formData.append("reason", data.reason)
      formData.append("comment", data.comments)

      // 4. Llamada al endpoint con token desde session
      const token = session.user.accessToken
      const res = await fetch("http://localhost:3000/api/permissions/request-permission", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // NO Content-Type: lo gestiona automáticamente FormData
        },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        console.error("Error al enviar solicitud:", err)
        return
      }

      console.log("Solicitud enviada con éxito")
      onOpenChange(false)
      onSubmitSuccess?.()

    } catch (error: any) {
      console.error("handleSubmit error:", error.message || error)
    }
    console.log("Enviando solicitud de permiso:", data)
    onOpenChange(false)
    onSubmitSuccess?.()
  }

  // Función para limpiar y mostrar el contenido HTML
  const renderFormattedContent = (htmlContent: string) => {
    if (!htmlContent || htmlContent.trim() === "") return null

    return (
      <div
        className="formatted-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ direction: "ltr", textAlign: "left" }}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">Vista Previa - Solicitud de Permiso</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Solicitante */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5" />
                Información de la Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha del Permiso</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      {data.date
                        ? data.date.toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        : "No seleccionada"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Horario</p>
                  <div className="flex items-center mt-1">
                    <Clock className="mr-2 h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      {data.startTime || "00:00"} - {data.endTime || "00:00"}
                    </span>
                  </div>
                </div>
              </div>

              {data.reason && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Motivo del Permiso</p>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-sm font-medium">{data.reason}</p>
                  </div>
                </div>
              )}

              {data.comments && data.comments.trim() !== "" && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Comentarios Detallados</p>
                  <div className="bg-gray-50 p-3 rounded border">{renderFormattedContent(data.comments)}</div>
                </div>
              )}

              {data.files.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-3">Documentos Adjuntos</p>
                  <div className="grid grid-cols-4 gap-3">
                    {data.files.map((file, index) => (
                      <div key={index} className="text-center">
                        {getFileThumbnail(file)}
                        <p className="text-xs mt-1 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Supervisor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Send className="mr-2 h-5 w-5" />
                Será Enviado a
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{supervisor.name}</h3>
                  <p className="text-sm text-gray-600">{supervisor.position}</p>
                  <Badge variant="secondary" className="mt-1">
                    {supervisor.department}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado de la Solicitud */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-800">Esta solicitud será enviada para aprobación</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Recibirás una notificación cuando sea revisada por tu supervisor.
              </p>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Editar Solicitud
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2 h-4 w-4" />
              Enviar Solicitud
            </Button>
          </div>
        </div>

        <style jsx>{`
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
      </DialogContent>
    </Dialog>
  )
}
