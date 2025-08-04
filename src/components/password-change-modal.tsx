"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Eye, EyeOff, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PasswordChangeModalProps {
  isOpen: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PasswordChangeModal({ isOpen, setOpen }: PasswordChangeModalProps) {
  const { data: session, update } = useSession()
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("La contraseña debe tener al menos 8 caracteres")
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Debe contener al menos una letra minúscula")
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Debe contener al menos una letra mayúscula")
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Debe contener al menos un número")
    }
    if (!/(?=.*[@$!%*?&_.])/.test(password)) {
      errors.push("Debe contener al menos un carácter especial (@$!%*?&_.)")
    }

    return errors
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")

    if (field === "newPassword") {
      const errors = validatePassword(value)
      setValidationErrors(errors)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validaciones
    const passwordErrors = validatePassword(formData.newPassword)
    if (passwordErrors.length > 0) {
      setValidationErrors(passwordErrors)
      setIsLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("https://infarma.duckdns.org/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          // NO Content-Type: lo gestiona automáticamente FormData
        },
        body:JSON.stringify({ newPassword:formData.newPassword })
      })

      if (!res.ok) {
        const err = await res.json()
        console.error("Error al enviar solicitud:", err)
        return
      }


      setOpen(false)
      // Actualizar la sesión localmente para quitar el flag de cambio obligatorio
      // await update({
      //   ...session,
      //   user: {
      //     ...session?.user,
      //   },
      // })


    } catch (error) {
      console.error("❌ Error en simulación:", error)
      setError("Error inesperado en la simulación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">Cambio de Contraseña Requerido</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Por seguridad, debes cambiar tu contraseña antes de continuar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {validationErrors.length > 0 && (
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-xs text-red-600">
                    • {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || validationErrors.length > 0}>
            {isLoading ? "Cambiando contraseña..." : "Cambiar Contraseña"}
          </Button>
        </form>

        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            <strong>Requisitos de la contraseña:</strong>
          </p>
          <ul className="mt-1 text-xs text-blue-700">
            <li>• Mínimo 8 caracteres</li>
            <li>• Al menos una letra mayúscula y minúscula</li>
            <li>• Al menos un número</li>
            <li>• Al menos un carácter especial (@$!%*?&)</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
