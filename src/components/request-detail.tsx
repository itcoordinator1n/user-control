"use client";

import { useState } from "react";
import { Calendar, Check, Download, FileText, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSession } from "next-auth/react";

interface RequestDetailProps {
  request: any;
  onClose: () => void;
}

export default function RequestDetail({
  request,
  onClose,
}: RequestDetailProps) {
  const { data: session, status } = useSession();
  const [feedback, setFeedback] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = () => {
    // Here you would handle the approval logic
    setShowApproveDialog(false);
    onClose();
  };

  const handleRequest = async (option: string) => {
    setShowApproveDialog(false);
    onClose();
    var handleResponse = false;
    if (option === "approve") {
      handleResponse = true;
    }

    try {
      const ddata = {
        decision: handleResponse,
        comentario: feedback,
      };
      const response = await fetch(
        `http://137.184.62.130:3000/api/requests/request-detail/${request.idSolicitud}/handle-request`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          body: JSON.stringify(ddata),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar solicitud");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  };

  const handleReject = () => {
    // Here you would handle the rejection logic
    setShowRejectDialog(false);
    onClose();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Detalle de Solicitud</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              ID: {request.idSolicitud}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Profile */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={""} alt={request.nombreSolicitante} />
              <AvatarFallback>
                {getInitials(request.nombreSolicitante)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{request.nombreSolicitante}</h3>
              <p className="text-sm text-muted-foreground">{request.puesto}</p>
              <p className="text-xs text-muted-foreground">
                {request.nombreArea}
              </p>
            </div>
          </div>

          {/* Request Details */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Detalles de la Solicitud
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Tipo:</div>
              <div>
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
              </div>

              <div className="text-muted-foreground">Fecha de Envío:</div>
              <div>{formatDate(request.fechaEnvio)}</div>

              <div className="text-muted-foreground">Fecha de Inicio:</div>
              <div>{formatDate(request.fechaInicio)}</div>

              <div className="text-muted-foreground">Fecha de Fin:</div>
              <div>{formatDate(request.fechaFin)}</div>

              <div className="text-muted-foreground">Estado:</div>
              <div>
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  {request.estado}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium mb-2">Descripción</h3>
            <p className="text-sm bg-muted/30 p-3 rounded-lg">
              {request.descripcion}
            </p>
          </div>

          {/* Attachments */}
          {request.archivo && (
            <div>
              <h3 className="text-sm font-medium mb-2">Archivos Adjuntos</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.archivo}</span>
                  </div>
                  <Button variant="ghost" size="icon" title="Descargar archivo">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div>
            <h3 className="text-sm font-medium mb-2">
              Comentarios para el Empleado
            </h3>
            <Textarea
              placeholder="Añada comentarios o retroalimentación para el empleado..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowRejectDialog(true)}
          >
            <X className="mr-2 h-4 w-4" />
            Rechazar
          </Button>
          <Button className="w-full" onClick={() => setShowApproveDialog(true)}>
            <Check className="mr-2 h-4 w-4" />
            Aprobar
          </Button>
        </CardFooter>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Aprobación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea aprobar la solicitud de{" "}
              {request.nombreSolicitante}?
              {feedback ? (
                <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                  <p className="font-medium">Comentarios:</p>
                  <p>{feedback}</p>
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRequest("approve")}>
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Rechazo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea rechazar la solicitud de{" "}
              {request.nombreSolicitante}?
              {feedback ? (
                <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                  <p className="font-medium">Motivo del rechazo:</p>
                  <p>{feedback}</p>
                </div>
              ) : (
                <p className="mt-2 text-red-500">
                  Se recomienda proporcionar un motivo para el rechazo.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRequest("decline")}
              className="bg-destructive hover:bg-destructive/90"
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

// Helper function to get initials from name
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
