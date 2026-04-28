"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Download,
  MessageSquare,
  User,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { 
  Request, 
  isVacationRequest, 
  isPermitRequest 
} from "./types";
import { generatePDF } from "./pdf-utils";

const TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  "vacation-halfday": "Vacaciones — ½ Día",
  permiso: "Permiso",
  incapacidad: "Incapacidad",
  duelo: "Duelo",
  compensatorio: "Compensatorio",
};

interface RequestDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: Request | null;
  supervisorComments: string;
  onCommentsChange: (val: string) => void;
  onApprove: (status: string) => void;
  waitStatus: "idle" | "loading" | "success" | "error";
  getStatusBadge: (status: string) => React.ReactNode;
}

export function RequestDetailModal({
  isOpen,
  onOpenChange,
  selectedRequest,
  supervisorComments,
  onCommentsChange,
  onApprove,
  waitStatus,
  getStatusBadge,
}: RequestDetailModalProps) {
  if (!selectedRequest) return null;

  const getSubtype = (r: Request): string => {
    if (r.type === "vacation") return (r as any).halfDay ? "vacation-halfday" : "vacation";
    const perm = r as any;
    if (perm.compensatorio) return "compensatorio";
    return perm.tipo ?? "permiso";
  };

  const subtype = getSubtype(selectedRequest);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (waitStatus !== "idle") return;
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                {selectedRequest.type === "vacation" ? (
                  <Calendar className="h-5 w-5 text-blue-600" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-blue-900">
                  Detalle de Solicitud — {selectedRequest.id}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {TYPE_LABELS[subtype] || selectedRequest.type}
                  </Badge>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generatePDF(selectedRequest)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Descargar PDF</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  Información del Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{selectedRequest.employeeName}</p>
                    <p className="text-sm text-gray-500">{selectedRequest.position}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Departamento</p>
                      <p className="text-sm font-semibold">{selectedRequest.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Fecha de Solicitud</p>
                      <p className="text-sm font-semibold">{selectedRequest.submittedDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  Detalles de la Ausencia
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isVacationRequest(selectedRequest) ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 font-medium">Período Seleccionado</p>
                        <p className="text-sm font-bold text-green-900">{selectedRequest.period}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Desde</p>
                        <p className="text-sm font-semibold">{selectedRequest.startDate}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Hasta</p>
                        <p className="text-sm font-semibold">{selectedRequest.endDate}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Fecha</p>
                          <p className="text-sm font-bold text-blue-900">{(selectedRequest as any).date}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                        <Clock className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Horario</p>
                          <p className="text-sm font-bold text-blue-900">{(selectedRequest as any).timeRange}</p>
                        </div>
                      </div>
                    </div>
                    {(selectedRequest as any).reason && (
                      <div className="p-4 bg-gray-50 border rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Motivo / Justificación</p>
                        <p className="text-sm font-medium">{(selectedRequest as any).reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedRequest.employeeComments && (
              <Card>
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Comentarios Adicionales
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div 
                    className="text-sm text-gray-700 bg-amber-50/30 p-4 border border-amber-100 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: selectedRequest.employeeComments }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Estado de Gestión</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Estado</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                {selectedRequest.responseDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Procesado el</span>
                    <span className="text-sm font-medium">{selectedRequest.responseDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedRequest.status === "Pendiente" && (
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50/50 pb-3">
                  <CardTitle className="text-xs font-semibold uppercase text-blue-700 tracking-wider">Resolver Solicitud</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Comentarios del Supervisor</Label>
                    <Textarea
                      value={supervisorComments}
                      onChange={(e) => onCommentsChange(e.target.value)}
                      placeholder="Escribe aquí tus observaciones..."
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={() => onApprove("Aprobada")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={waitStatus === "loading"}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobar
                    </Button>
                    <Button
                      onClick={() => onApprove("Rechazada")}
                      variant="destructive"
                      className="w-full"
                      disabled={waitStatus === "loading" || !supervisorComments.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Rechazar
                    </Button>
                    {!supervisorComments.trim() && (
                      <p className="text-[10px] text-center text-gray-400 italic">Requerido para rechazar</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Cerrar Panel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
