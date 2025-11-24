"use client"

import { useEffect, useRef } from "react"
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WaitModalProps {
  isOpen: boolean
  status: "loading" | "success" | "error"
  title?: string
  message?: string
  errorMessage?: string
  onClose?: () => void
  autoCloseMs?: number
  showCloseButton?: boolean
}

export function WaitModal({
  isOpen,
  status,
  title = "Procesando",
  message = "Por favor espera...",
  errorMessage,
  onClose,
  autoCloseMs,
  showCloseButton = true,
}: WaitModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Auto-close on success if autoCloseMs is provided
  useEffect(() => {
    if (status === "success" && autoCloseMs && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseMs)
      return () => clearTimeout(timer)
    }
  }, [status, autoCloseMs, onClose])

  // Handle ESC key to close (except when loading)
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "loading" && onClose) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, status, onClose])

  // Focus trap - focus close button when modal opens
  useEffect(() => {
    if (isOpen && status !== "loading" && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isOpen, status])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const getStatusConfig = () => {
    switch (status) {
      case "loading":
        return {
          icon: <Loader2 className="h-16 w-16 animate-spin text-primary" />,
          title: title || "Procesando",
          message: message || "Por favor espera...",
          showClose: false,
        }
      case "success":
        return {
          icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
          title: title || "¡Éxito!",
          message: message || "La operación se completó correctamente",
          showClose: true,
        }
      case "error":
        return {
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: title || "Error",
          message: errorMessage || message || "Ocurrió un error. Por favor intenta de nuevo.",
          showClose: true,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={(e) => {
        // Close on overlay click (except when loading)
        if (e.target === e.currentTarget && status !== "loading" && onClose) {
          onClose()
        }
      }}
    >
      <div
        className={cn(
          "relative w-full max-w-md rounded-lg bg-card shadow-2xl border border-border",
          "transform transition-all duration-300 ease-out",
          "animate-in fade-in-0 zoom-in-95",
        )}
      >
        {/* Close button */}
        {config.showClose && showCloseButton && onClose && (
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content */}
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {/* Icon */}
          <div className="mb-6">{config.icon}</div>

          {/* Title */}
          <h2 id="modal-title" className="text-2xl font-semibold text-card-foreground mb-3">
            {config.title}
          </h2>

          {/* Message */}
          <p id="modal-description" className="text-muted-foreground text-balance max-w-sm">
            {config.message}
          </p>

          {/* Close button (visible on success/error) */}
          {config.showClose && showCloseButton && onClose && (
            <button
              onClick={onClose}
              className={cn(
                "mt-8 px-6 py-2.5 rounded-lg font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                status === "success"
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
