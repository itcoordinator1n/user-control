"use client"

import type React from "react"

import { useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Download } from "lucide-react"

interface SignaturePadProps {
  width?: number
  height?: number
  strokeWidth?: number
  strokeColor?: string
  backgroundColor?: string
  onSignatureChange?: (hasSignature: boolean, dataURL?: string) => void
}

export default function SignaturePad({
  width = 400,
  height = 150,
  strokeWidth = 2,
  strokeColor = "#000000",
  backgroundColor = "transparent",
  onSignatureChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Configurar canvas al montar
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configuración optimizada para calidad
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.imageSmoothingEnabled = true

    // Fondo transparente para PDF
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }
  }, [strokeColor, strokeWidth, backgroundColor, width, height])

  // Obtener coordenadas normalizadas
  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number

    if ("touches" in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  // Dibujar línea suave entre puntos
  const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }, [])

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const coords = getCoordinates(e)
      if (!coords) return

      setIsDrawing(true)
      setLastPoint(coords)
      setHasSignature(true)

      // Dibujar punto inicial
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.beginPath()
      ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2)
      ctx.fill()
    },
    [getCoordinates, strokeWidth],
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !lastPoint) return
      e.preventDefault()

      const coords = getCoordinates(e)
      if (!coords) return

      drawLine(lastPoint, coords)
      setLastPoint(coords)
    },
    [isDrawing, lastPoint, getCoordinates, drawLine],
  )

  const stopDrawing = useCallback(() => {
    if (isDrawing && hasSignature) {
      const canvas = canvasRef.current
      if (canvas && onSignatureChange) {
        const dataURL = canvas.toDataURL("image/png")
        onSignatureChange(true, dataURL)
      }
    }
    setIsDrawing(false)
    setLastPoint(null)
  }, [isDrawing, hasSignature, onSignatureChange])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // Restaurar fondo si no es transparente
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    setHasSignature(false)
    setIsDrawing(false)
    setLastPoint(null)

    if (onSignatureChange) {
      onSignatureChange(false)
    }
  }, [width, height, backgroundColor, onSignatureChange])

  const getSignatureData = useCallback(
    (format: "png" | "jpeg" = "png") => {
      const canvas = canvasRef.current
      if (!canvas || !hasSignature) return null

      return canvas.toDataURL(`image/${format}`)
    },
    [hasSignature],
  )

  const downloadSignature = useCallback(() => {
    const dataURL = getSignatureData()
    if (!dataURL) return

    const link = document.createElement("a")
    link.download = `firma-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }, [getSignatureData])

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block cursor-crosshair touch-none"
          style={{ width: "screen", height: "auto", maxWidth: `${width}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm">Firme aquí</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={!hasSignature}
          className="flex items-center gap-1 bg-transparent"
        >
          <RotateCcw className="w-4 h-4" />
          Limpiar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadSignature}
          disabled={!hasSignature}
          className="flex items-center gap-1 bg-transparent"
        >
          <Download className="w-4 h-4" />
          Descargar
        </Button>
      </div>
    </div>
  )
}

// Hook personalizado para usar el componente
export function useSignaturePad() {
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [hasSignature, setHasSignature] = useState(false)

  const handleSignatureChange = useCallback((hasSig: boolean, dataURL?: string) => {
    setHasSignature(hasSig)
    setSignatureData(dataURL || null)
  }, [])

  return {
    signatureData,
    hasSignature,
    handleSignatureChange,
  }
}
