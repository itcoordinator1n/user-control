"use client"

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Smartphone, Check, X } from "lucide-react"

interface SignaturePadProps {
  strokeWidth?: number
  strokeColor?: string
  backgroundColor?: string
  onSignatureChange?: (hasSignature: boolean, dataURL?: string) => void
  // legacy props — kept for compatibility, ignored in new design
  width?: number
  height?: number
}export default function SignaturePad({
  strokeWidth = 2,
  strokeColor = "currentColor", // Let it adapt or we can force a color
  backgroundColor = "transparent",
  onSignatureChange,
}: SignaturePadProps) {
  // Desktop/Mobile inline canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [hasSignature, setHasSignature] = useState(false)

  // Init canvas — sized to container width
  useLayoutEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!canvas || !container) return

    const w = container.offsetWidth
    const h = 180
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Resolve CSS variable for stroke color if needed, or use a fixed color
    // A blue-ish or text-foreground color is good.
    ctx.strokeStyle = "#2563eb" // primary blue
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.imageSmoothingEnabled = true
    
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, w, h)
    }
  }, [strokeWidth, backgroundColor])

  // ─── coordinate helper ────────────────────────────────────────────────────
  const getCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
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
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
    },
    []
  )

  // ─── Drawing ──────────────────────────────────────────────────────
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const coords = getCoords(e, canvas)
      if (!coords) return
      setIsDrawing(true)
      setLastPoint(coords)
      setHasSignature(true)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.fillStyle = "#2563eb"
      ctx.beginPath()
      ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2)
      ctx.fill()
    },
    [getCoords, strokeWidth]
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !lastPoint) return
      const canvas = canvasRef.current
      if (!canvas) return
      const coords = getCoords(e, canvas)
      if (!coords) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      setLastPoint(coords)
    },
    [isDrawing, lastPoint, getCoords]
  )

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      const canvas = canvasRef.current
      if (canvas) {
        const dataURL = canvas.toDataURL("image/png")
        onSignatureChange?.(true, dataURL)
      }
    }
    setIsDrawing(false)
    setLastPoint(null)
  }, [isDrawing, onSignatureChange])

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    setHasSignature(false)
    onSignatureChange?.(false)
  }, [backgroundColor, onSignatureChange])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Firma del solicitante <span className="text-red-500">*</span>
        </span>
        {hasSignature && (
          <Button type="button" variant="ghost" size="sm" onClick={clearSignature} className="text-xs h-7 px-2 hover:bg-muted text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-3 h-3 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative border border-border/50 rounded-lg overflow-hidden bg-card shadow-sm w-full transition-colors focus-within:ring-2 focus-within:ring-ring"
      >
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair touch-none w-full"
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
            <span className="text-muted-foreground text-sm opacity-50">Firme aquí</span>
          </div>
        )}
      </div>

      {!hasSignature && (
        <p className="text-xs text-orange-600 dark:text-orange-500">
          Debe completar su firma antes de enviar.
        </p>
      )}
    </div>
  )
}


// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSignaturePad() {
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [hasSignature, setHasSignature] = useState(false)

  const handleSignatureChange = useCallback((hasSig: boolean, dataURL?: string) => {
    setHasSignature(hasSig)
    setSignatureData(dataURL || null)
  }, [])

  return { signatureData, hasSignature, handleSignatureChange }
}
