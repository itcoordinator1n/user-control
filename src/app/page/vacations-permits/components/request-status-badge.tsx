"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle } from "lucide-react"

interface RequestStatusBadgeProps {
  status: "pendiente" | "aprobada" | "rechazada"
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const statusConfig = {
    pendiente: {
      label: "Pendiente",
      variant: "secondary" as const,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
    },
    aprobada: {
      label: "Aprobada",
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    rechazada: {
      label: "Rechazada",
      variant: "secondary" as const,
      className: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
    },
  }

  // Fallback para estados desconocidos o nulos
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status || "Pendiente",
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Clock,
  }

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  )
}
