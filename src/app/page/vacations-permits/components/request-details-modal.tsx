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
import { useSession } from "next-auth/react"

interface RequestDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: any
  type: "permits" | "vacations"
  onDelete?: (requestId: string) => void
}

  interface UserProfile {
    id: number;
    name: string;
    position: string;
    creationDate: string;
    area: string;
    country: string;
    supervisorName:string;
    supervisorArea:string;
    supervisorPosition:string;
  }
export function RequestDetailsModal({ open, onOpenChange, request, type, onDelete }: RequestDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { data: session, status } = useSession();
    const [error, setError] = useState<string | null>(null);
      const [profile, setProfile] = useState<UserProfile | null>(null);


      console.log("El request que le llega al jefe",request)
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

  if (!request) return null

  const generatePDF = () => {
    // En una implementación real, aquí se generaría el PDF
    console.log("Generando PDF para:", request.id)

    // Simulamos la descarga
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(getPDFContent()))
    element.setAttribute("download", `${request.id}_solicitud.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

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
;<style jsx>{`
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
