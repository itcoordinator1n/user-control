"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, FileText, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { WaitModal } from "./wait-modal";

interface PermitPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    tipo: "permiso" | "incapacidad" | "duelo";
    esCompensatorio?: boolean;
    date?: Date;
    startTime?: string;
    endTime?: string;
    incapacidadStartDate?: Date;
    incapacidadEndDate?: Date;
    reason: string;
    comments: string;
    files: File[];
  };
  onSubmitSuccess?: () => void;
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
export function PermitPreview({
  open,
  onOpenChange,
  data,
  onSubmitSuccess,
}: PermitPreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<
    "loading" | "success" | "error"
  >("success");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: session, status } = useSession();
  console.log("Hora de inicio", data.startTime);
  const supervisor = {
    name: "María González Rodríguez",
    position: "Gerente de Recursos Humanos",
    department: "Administración",
  };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Asegúrate de que el token esté disponible
    if (session?.user?.accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/profile_info`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Error al obtener el perfil");
          }
          return res.json();
        })
        .then((data: UserProfile) => {
          console.log("Informacion del perfil", data);
          setProfile(data);
        })
        .catch((err: Error) => setError(err.message));
    }
  }, [session]);
  const getFileThumbnail = (file: File) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      return (
        <img
          src={url || ""}
          alt={file.name}
          className="w-16 h-16 object-cover rounded border"
          onLoad={() => URL.revokeObjectURL(url)}
        />
      );
    }
    return (
      <div className="w-16 h-16 bg-muted rounded-md border border-border/50 flex items-center justify-center">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  };

  const handleSubmit = async () => {
    setModalStatus("loading");
    setIsModalOpen(true);
    setErrorMessage("");
    try {
      if (status !== "authenticated") {
        throw new Error("No estás autenticado");
      }
      setModalStatus("loading");
      setIsModalOpen(true);
      setErrorMessage("");

      // 1. Construir startDateTime / endDateTime según tipo
      let startDateTime: string;
      let endDateTime: string;

      if (data.tipo === "incapacidad" || data.tipo === "duelo") {
        const start = data.incapacidadStartDate!.toISOString().split("T")[0];
        const end = data.incapacidadEndDate!.toISOString().split("T")[0];
        startDateTime = `${start} 00:00:00`;
        endDateTime = `${end} 23:59:59`;
      } else {
        const datePart = data.date!.toISOString().split("T")[0];
        startDateTime = `${datePart} ${data.startTime}:00`;
        endDateTime = `${datePart} ${data.endTime}:00`;
      }

      // 2. Montar FormData
      const formData = new FormData();
      formData.append("tipo", data.tipo);
      formData.append("bool_compensatorio", data.esCompensatorio ? "true" : "false");
      if ((data.tipo === "incapacidad" || data.tipo === "duelo") && data.files?.length) {
        formData.append("documento", data.files[0]);
      }
      formData.append("startDateTime", startDateTime);
      formData.append("endDateTime", endDateTime);
      formData.append("reason", data.reason);
      formData.append("comment", data.comments);

      // 4. Llamada al endpoint con token desde session
      const token = session?.user?.accessToken;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/permissions/request-permission`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // NO Content-Type: lo gestiona automáticamente FormData
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setModalStatus("error");
        console.error("Error al enviar solicitud:", err);
        return;
      }

      console.log("Solicitud enviada con éxito");
      setModalStatus("success");
      onOpenChange(false);
      onSubmitSuccess?.();
    } catch (error: any) {
      setModalStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido"
      );
    }
    console.log("Enviando solicitud de permiso:", data);
    onOpenChange(false);
    onSubmitSuccess?.();
  };

  // Función para limpiar y mostrar el contenido HTML
  const renderFormattedContent = (htmlContent: string) => {
    if (!htmlContent || htmlContent.trim() === "") return null;

    return (
      <div
        className="formatted-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ direction: "ltr", textAlign: "left" }}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="text-primary">Vista Previa —</span>{" "}
            {data.tipo === "incapacidad"
              ? "Incapacidad Médica"
              : data.tipo === "duelo"
              ? "Permiso por Duelo"
              : "Solicitud de Permiso"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Solicitante */}
          <Card className="border-border/50 shadow-sm overflow-hidden bg-card text-card-foreground">
            <CardHeader className="pb-3 bg-muted/50 border-b border-border/50">
              <CardTitle className="text-lg flex items-center text-foreground">
                <User className="mr-2 h-5 w-5 text-primary" />
                Información de la Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {data.tipo === "permiso" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha del Permiso</p>
                    <div className="flex items-center mt-1 text-foreground">
                      <Calendar className="mr-2 h-4 w-4 text-primary" />
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
                    <p className="text-sm font-medium text-muted-foreground">Horario</p>
                    <div className="flex items-center mt-1 text-foreground">
                      <Clock className="mr-2 h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {data.startTime || "00:00"} - {data.endTime || "00:00"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {data.tipo === "duelo" ? "Período de ausencia" : "Período de incapacidad"}
                  </p>
                  <div className="flex items-center mt-1 gap-2 text-foreground">
                    <Calendar className={`h-4 w-4 shrink-0 ${data.tipo === "duelo" ? "text-muted-foreground" : "text-amber-500"}`} />
                    <span className="font-medium">
                      {data.incapacidadStartDate?.toLocaleDateString("es-ES", {
                        day: "2-digit", month: "long", year: "numeric",
                      }) ?? "—"}
                      {" → "}
                      {data.incapacidadEndDate?.toLocaleDateString("es-ES", {
                        day: "2-digit", month: "long", year: "numeric",
                      }) ?? "—"}
                    </span>
                  </div>
                  {data.tipo === "duelo" && (
                    <div className="flex items-center gap-2 mt-3 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm text-muted-foreground">
                      <span>🕊️</span>
                      <span>Permiso por duelo familiar</span>
                    </div>
                  )}
                </div>
              )}

              {data.tipo === "permiso" && data.esCompensatorio && (
                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-md px-3 py-2 text-sm text-purple-700 dark:text-purple-400">
                  <span>⏱</span>
                  <span className="font-medium">Tiempo compensatorio</span>
                  <span className="text-purple-600/80 dark:text-purple-400/80 text-xs">— horas trabajadas fuera de horario</span>
                </div>
              )}

              {data.reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Motivo del Permiso
                  </p>
                  <div className="bg-muted/30 p-3 rounded-md border border-border/50">
                    <p className="text-sm font-medium text-foreground">{data.reason}</p>
                  </div>
                </div>
              )}

              {data.comments && data.comments.trim() !== "" && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Comentarios Detallados
                  </p>
                  <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-foreground">
                    {renderFormattedContent(data.comments)}
                  </div>
                </div>
              )}

              {data.files.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {data.tipo === "incapacidad"
                      ? "Comprobante médico"
                      : data.tipo === "duelo"
                      ? "Documento de respaldo"
                      : "Documentos Adjuntos"}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {data.files.map((file, index) => (
                      <div key={index} className="text-center">
                        {getFileThumbnail(file)}
                        <p className="text-xs mt-1 truncate text-muted-foreground" title={file.name}>
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
          <Card className="border-border/50 shadow-sm overflow-hidden bg-card text-card-foreground">
            <CardHeader className="pb-3 bg-muted/50 border-b border-border/50">
              <CardTitle className="text-lg flex items-center text-foreground">
                <Send className="mr-2 h-5 w-5 text-primary" />
                Será Enviado a
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {profile?.supervisorName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.supervisorPosition}
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {profile?.supervisorArea}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado de la Solicitud */}
          <Card className="border-amber-500/20 bg-amber-500/10 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-500">
                  Esta solicitud será enviada para aprobación
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Recibirás una notificación cuando sea revisada por tu
                supervisor.
              </p>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Editar Solicitud
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={modalStatus === "loading"}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
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
            color: inherit;
          }
          .formatted-content h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin: 0.5rem 0;
            line-height: 1.4;
            color: inherit;
          }
          .formatted-content ul,
          .formatted-content ol {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
          }
          .formatted-content li {
            margin: 0.25rem 0;
            color: inherit;
            opacity: 0.9;
          }
          .formatted-content p {
            margin: 0.5rem 0;
            color: inherit;
            opacity: 0.9;
            line-height: 1.5;
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
        `}</style>
      </DialogContent>
      <WaitModal
        isOpen={isModalOpen}
        status={modalStatus}
        title={
          modalStatus === "loading"
            ? "Enviando permiso..."
            : modalStatus === "success"
            ? "¡Permiso enviado!"
            : "Error al enviar"
        }
        message={
          modalStatus === "loading"
            ? "Estamos procesando tu información..."
            : modalStatus === "success"
            ? "Tu permiso ha sido enviado exitosamente"
            : undefined
        }
        errorMessage={errorMessage}
        onClose={() => setIsModalOpen(false)}
        autoCloseMs={modalStatus === "success" ? 3000 : undefined}
      />
    </Dialog>
  );
}
