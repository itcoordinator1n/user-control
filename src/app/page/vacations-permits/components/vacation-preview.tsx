"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Send, Clock } from "lucide-react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import SignaturePad, { useSignaturePad } from "@/components/signature-pad"

interface VacationPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: {
    startDate?: Date | null
    endDate?: Date | null
    comments: string
    halfDay?: boolean
  }
  onSubmitSuccess?: () => void
}
interface UserProfile {
    id: number;
    name: string;
    position: string;
    creationDate: string;
    area: string;
    country: string;
    supervisorName: string;
    supervisorArea:string;
    supervisorPosition:string;
  }

export function VacationPreview({ open, onOpenChange, data, onSubmitSuccess }: VacationPreviewProps) {
    const { signatureData, hasSignature, handleSignatureChange } = useSignaturePad()

  const handleSubm = () => {
    if (hasSignature && signatureData) {
      console.log("Firma capturada en base64:", signatureData)
      // Aquí puedes enviar la firma a tu backend o guardarla en la BD
    } else {
      alert("Debe firmar antes de enviar.")
    }
  }
  const supervisor = {
    name: "María González Rodríguez",
    position: "Gerente de Recursos Humanos",
    department: "Administración",
  }
  const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession()
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
  
  const calculateDays = () => {
    if (!data.startDate || !data.endDate) return { total: 0, workdays: 0 }

    const totalDays = (Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)* (data.halfDay && data.startDate?.getTime() == data.endDate?.getTime()?0.5:1);
    const workdays = (Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)* (data.halfDay && data.startDate?.getTime() == data.endDate?.getTime()?0.5:1);
    //const workdays = (Math.max(0, totalDays - Math.floor(totalDays / 7) * 2))* (data.halfDay && data.startDate?.getTime() == data.endDate?.getTime()?0.5:1);

    return { total: totalDays, workdays }
  }

  const { total, workdays } = calculateDays()

const handleSubmit = async () => {
        const dataURL = signatureData; // "data:image/png;base64,...."
        if (!dataURL) return;

        // (opcional) seguir descargando localmente
        // const link = document.createElement("a");
        // link.download = `firma-${Date.now()}.png`;
        // link.href = dataURL;
        // link.click();

        try {
          const token = session?.user.accessToken;

          // const payload = {
          //   fechaInicio: data?.startDate?.toISOString().split("T")[0],
          //   fechaFin: data?.endDate?.toISOString().split("T")[0],
          //   comentario: data?.comments ?? "",
          // };
          const payload = {
            fechaInicio: data?.startDate?.toISOString().split('T')[0],
            fechaFin: data?.endDate?.toISOString().split('T')[0],
            comentario: data.comments,
            halfDay: data.halfDay 
          }
          // 1) convertir dataURL -> Blob (respeta el mime de la dataURL)
          const blob = await (await fetch(dataURL)).blob();

          // 2) armar FormData (NO pongas Content-Type manualmente)

          const form = new FormData();
          form.append("firma", blob, `firma-${Date.now()}.png`);
          // puedes enviar los campos sueltos...
          form.append("fechaInicio", payload.fechaInicio || "");
          form.append("fechaFin", payload.fechaFin || "");
          form.append("comentario", payload.comentario);
          form.append("halfDay", payload.halfDay ? "true" : "false");
          // ...o todo en un solo campo "payload":
          // form.append("payload", JSON.stringify(payload));

          const res = await fetch(
            "https://infarma.duckdns.org/api/permissions/request-vacations",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`, // NO Content-Type aquí
              },
              body: form,
              credentials: "include",
            }
          );

          const result = await res.json();
          if (!res.ok) {
            console.error("Error al enviar la solicitud:", result?.error || result);
            return;
          }

          console.log("Solicitud enviada:", result);
          onOpenChange(false);
          onSubmitSuccess?.();
        } catch (err) {
          console.error("Error inesperado:", err);
        }
      };

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
          <DialogTitle className="text-xl font-bold text-blue-900">Vista Previa - Solicitud de Vacaciones</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de las Vacaciones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Período de Vacaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fecha de Inicio</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="mr-2 h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {data.startDate
                        ? data.startDate.toLocaleDateString("es-ES", {
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
                  <p className="text-sm font-medium text-gray-600">Fecha de Fin</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="mr-2 h-4 w-4 text-red-600" />
                    <span className="font-medium">
                      {data.endDate
                        ? data.endDate.toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "No seleccionada"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumen de Días */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{total}</div>
                    <div className="text-sm text-blue-700">Días Totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{workdays}</div>
                    <div className="text-sm text-blue-700">Días Laborables</div>
                  </div>
                </div>
              </div>

              {data.comments && data.comments.trim() !== "" && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Comentarios Adicionales</p>
                  <div className="bg-gray-50 p-3 rounded border">{renderFormattedContent(data.comments)}</div>
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
                  <h3 className="font-semibold text-gray-900">{profile?.supervisorName}</h3>
                  <p className="text-sm text-gray-600">{profile?.supervisorPosition}</p>
                  <Badge variant="secondary" className="mt-1">
                    {profile?.supervisorArea}
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
                Para completar el envio de tu solicitud, debes proporcionar tu firma.
              </p>
            </CardContent>
          </Card>

          <SignaturePad
        width={500}
        height={200}
        strokeWidth={3}
        strokeColor="#1e3a8a"
        backgroundColor="white"
        onSignatureChange={handleSignatureChange}
      />

      

          {/* Recordatorios Importantes */}
          {/*
            <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Recordatorios Importantes</span>
                </div>
                <ul className="text-xs text-amber-700 space-y-1 ml-6">
                  <li>• Las vacaciones deben solicitarse con 2 semanas de anticipación</li>
                  <li>• Período mínimo: 5 días consecutivos</li>
                  <li>• Período máximo: 15 días consecutivos</li>
                  <li>• Los días no utilizados no se acumulan para el siguiente año</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          */}

          

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Editar Solicitud
            </Button>
            <Button disabled={!hasSignature} onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">
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
