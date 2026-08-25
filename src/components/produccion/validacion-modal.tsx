"use client";

import { useState } from "react";
import { ShieldCheck, Undo2, Loader2, MessageSquare, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type ValidacionMode = "finalizar" | "validar" | "rechazar";

interface ValidacionModalProps {
  open: boolean;
  mode: ValidacionMode;
  /** Identificación del control, ej: "Lote 2401 / OP 8890" */
  referencia?: string;
  onClose: () => void;
  /** El comentario va vacío cuando es opcional y no se escribió nada. */
  onConfirm: (comentario: string) => Promise<void>;
}

const COPY: Record<ValidacionMode, {
  title: string;
  description: string;
  commentLabel: string;
  commentRequired: boolean;
  placeholder: string;
  confirmLabel: string;
  confirmClass: string;
  icon: React.ReactNode;
}> = {
  finalizar: {
    title: "Finalizar Registro de Horas",
    description: "El registro se cerrará y pasará a la cola de revisión del Jefe de Producción. Ya no podrá editar actividades ni tiempos.",
    commentLabel: "Observaciones (opcional)",
    commentRequired: false,
    placeholder: "Observaciones generales del registro...",
    confirmLabel: "Finalizar y Enviar a Revisión",
    confirmClass: "bg-blue-600 hover:bg-blue-700 text-white",
    icon: <Save className="h-5 w-5" />,
  },
  validar: {
    title: "Validar Control de Tiempos",
    description: "Confirma que revisó los tiempos registrados. Con esto el reporte queda concluido y no admite más cambios.",
    commentLabel: "Comentario de la revisión (opcional)",
    commentRequired: false,
    placeholder: "Comentarios de la revisión...",
    confirmLabel: "Validar y Concluir",
    confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  rechazar: {
    title: "Devolver a Corrección",
    description: "El reporte volverá al encargado de área para que corrija los tiempos registrados.",
    commentLabel: "Motivo de la devolución *",
    commentRequired: true,
    placeholder: "Ej: Faltan tiempos de envasado del turno de la tarde...",
    confirmLabel: "Devolver a Corrección",
    confirmClass: "bg-amber-500 hover:bg-amber-600 text-white",
    icon: <Undo2 className="h-5 w-5" />,
  },
};

export function ValidacionModal({
  open,
  mode,
  referencia,
  onClose,
  onConfirm,
}: ValidacionModalProps) {
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[mode];
  const canConfirm = !copy.commentRequired || comentario.trim().length > 0;

  const reset = () => {
    setComentario("");
    setError(null);
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(comentario.trim());
      reset();
    } catch (e) {
      // El backend responde 422 con un mensaje accionable cuando la transición
      // de estado no corresponde; lo mostramos aquí en vez de cerrar el modal.
      setError(e instanceof Error ? e.message : "No se pudo completar la acción");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <span className={mode === "rechazar" ? "text-amber-600" : "text-emerald-600"}>
              {copy.icon}
            </span>
            {copy.title}
          </DialogTitle>
          {referencia && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{referencia}</p>
          )}
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-sm text-muted-foreground">{copy.description}</p>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              {copy.commentLabel}
            </Label>
            <Textarea
              autoFocus
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={copy.placeholder}
              className="resize-none text-sm"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || loading} className={copy.confirmClass}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {copy.confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
