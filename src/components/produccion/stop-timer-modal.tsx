"use client";

import { useState } from "react";
import { CheckCircle2, Play, AlertTriangle, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type StopAction = "TRABAJO_TERMINADO" | "CONTINUAR" | "INTERRUPCION";

interface StopTimerModalProps {
  open: boolean;
  actividadNombre: string;
  onClose: () => void;
  onConfirm: (action: StopAction, observaciones: string) => Promise<void>;
}

const OPTIONS: {
  action: StopAction;
  label: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  activeClass: string;
}[] = [
  {
    action: "TRABAJO_TERMINADO",
    label: "Trabajo Terminado",
    description: "La actividad ha sido completada.",
    icon: <CheckCircle2 className="h-6 w-6" />,
    colorClass: "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
    activeClass: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/30",
  },
  {
    action: "CONTINUAR",
    label: "Continuar Cronómetro",
    description: "Cancela la pausa, el reloj sigue corriendo.",
    icon: <Play className="h-6 w-6" />,
    colorClass: "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    activeClass: "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/30",
  },
  {
    action: "INTERRUPCION",
    label: "Interrupción",
    description: "Detiene el reloj e inicia un cronómetro de interrupción.",
    icon: <AlertTriangle className="h-6 w-6" />,
    colorClass: "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
    activeClass: "bg-amber-50 dark:bg-amber-900/30 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/30",
  },
];

export function StopTimerModal({
  open,
  actividadNombre,
  onClose,
  onConfirm,
}: StopTimerModalProps) {
  const [selected, setSelected] = useState<StopAction | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    if (selected === "CONTINUAR") {
      onClose();
      return;
    }
    if (selected === "INTERRUPCION" && !observaciones.trim()) return;

    setLoading(true);
    try {
      await onConfirm(selected, observaciones.trim());
      // reset
      setSelected(null);
      setObservaciones("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelected(null);
    setObservaciones("");
    onClose();
  };

  const needsComment = selected === "INTERRUPCION";
  const canConfirm =
    selected !== null &&
    (selected !== "INTERRUPCION" || observaciones.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-base">Detener Cronómetro</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {actividadNombre}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {OPTIONS.map((opt) => {
            const isActive = selected === opt.action;
            return (
              <button
                key={opt.action}
                onClick={() => setSelected(opt.action)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  isActive ? opt.activeClass : `${opt.colorClass} hover:bg-muted/40`
                }`}
              >
                <span className={opt.colorClass}>{opt.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Comentario — requerido para interrupción, opcional para terminado */}
          {selected && selected !== "CONTINUAR" && (
            <div className="space-y-1.5 pt-1">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {needsComment ? "Motivo de la interrupción *" : "Observaciones (opcional)"}
              </Label>
              <Textarea
                autoFocus
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder={
                  needsComment
                    ? "Ej: Falta de material, espera de equipo..."
                    : "Observaciones adicionales..."
                }
                className="resize-none text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={
              selected === "TRABAJO_TERMINADO"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : selected === "INTERRUPCION"
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {selected === "CONTINUAR"
              ? "Continuar"
              : selected === "TRABAJO_TERMINADO"
              ? "Finalizar"
              : "Confirmar Interrupción"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
