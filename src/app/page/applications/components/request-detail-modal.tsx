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
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {selectedRequest.type === "vacation" ? (
                  <Calendar className="h-5 w-5 text-primary" />
                ) : (
                  <Clock className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Detalle de Solicitud — {selectedRequest.id}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
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
            <Card className="overflow-hidden border-border/50 shadow-sm">
              <CardHeader className="bg-muted/50 pb-3 border-b border-border/50">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Información del Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{selectedRequest.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.position}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Departamento</p>
                      <p className="text-sm font-semibold text-foreground">{selectedRequest.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Solicitud</p>
                      <p className="text-sm font-semibold text-foreground">{selectedRequest.submittedDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/50 shadow-sm">
              <CardHeader className="bg-muted/50 pb-3 border-b border-border/50">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Detalles de la Ausencia
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isVacationRequest(selectedRequest) ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Período Seleccionado</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{selectedRequest.period}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Desde</p>
                        <p className="text-sm font-semibold text-foreground">{selectedRequest.startDate}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Hasta</p>
                        <p className="text-sm font-semibold text-foreground">{selectedRequest.endDate}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-primary" />
                        <div>
                          <p className="text-xs text-primary font-medium">Fecha</p>
                          <p className="text-sm font-bold text-foreground">{(selectedRequest as any).date}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg flex items-center gap-3">
                        <Clock className="h-6 w-6 text-primary" />
                        <div>
                          <p className="text-xs text-primary font-medium">Horario</p>
                          <p className="text-sm font-bold text-foreground">{(selectedRequest as any).timeRange}</p>
                        </div>
                      </div>
                    </div>
                    {(selectedRequest as any).reason && (
                      <div className="p-4 bg-muted/30 border border-border/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Motivo / Justificación</p>
                        <p className="text-sm font-medium text-foreground">{(selectedRequest as any).reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedRequest.employeeComments && (
              <Card className="overflow-hidden border-border/50 shadow-sm">
                <CardHeader className="bg-muted/50 pb-3 border-b border-border/50">
                  <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Comentarios Adicionales
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div 
                    className="text-sm text-foreground bg-amber-500/10 p-4 border border-amber-500/20 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: selectedRequest.employeeComments }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="overflow-hidden border-border/50 shadow-sm">
              <CardHeader className="bg-muted/50 pb-3 border-b border-border/50">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Estado de Gestión</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                {selectedRequest.responseDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Procesado el</span>
                    <span className="text-sm font-medium text-foreground">{selectedRequest.responseDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedRequest.status === "Pendiente" && (
              <Card className="border-primary/20 overflow-hidden shadow-sm">
                <CardHeader className="bg-primary/5 pb-3 border-b border-primary/10">
                  <CardTitle className="text-xs font-semibold uppercase text-primary tracking-wider">Resolver Solicitud</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Comentarios del Supervisor</Label>
                    <Textarea
                      value={supervisorComments}
                      onChange={(e) => onCommentsChange(e.target.value)}
                      placeholder="Escribe aquí tus observaciones..."
                      rows={4}
                      className="text-sm resize-none bg-background"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={() => onApprove("Aprobada")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600/90 dark:hover:bg-emerald-600 shadow-sm"
                      disabled={waitStatus === "loading"}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobar
                    </Button>
                    <Button
                      onClick={() => onApprove("Rechazada")}
                      className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
                      disabled={waitStatus === "loading" || !supervisorComments.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Rechazar
                    </Button>
                    {!supervisorComments.trim() && (
                      <p className="text-[10px] text-center text-muted-foreground italic">Requerido para rechazar</p>
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
