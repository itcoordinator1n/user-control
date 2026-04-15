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
}

export default function SignaturePad({
  strokeWidth = 2,
  strokeColor = "#1e3a8a",
  backgroundColor = "white",
  onSignatureChange,
}: SignaturePadProps) {
  // Desktop canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desktopContainerRef = useRef<HTMLDivElement>(null)

  // Fullscreen canvas (mobile)
  const fsCanvasRef = useRef<HTMLCanvasElement>(null)
  const fsContainerRef = useRef<HTMLDivElement>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [hasSignature, setHasSignature] = useState(false)
  const [previewDataURL, setPreviewDataURL] = useState<string | null>(null)

  // Mobile fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPortrait, setIsPortrait] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [fsIsDrawing, setFsIsDrawing] = useState(false)
  const [fsLastPoint, setFsLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [fsHasSignature, setFsHasSignature] = useState(false)

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  // Orientation detection
  useEffect(() => {
    const check = () => setIsPortrait(window.matchMedia("(orientation: portrait)").matches)
    check()
    window.addEventListener("resize", check)
    window.addEventListener("orientationchange", check)
    return () => {
      window.removeEventListener("resize", check)
      window.removeEventListener("orientationchange", check)
    }
  }, [])

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isFullscreen])

  // Init desktop canvas — sized to container width
  useLayoutEffect(() => {
    const container = desktopContainerRef.current
    const canvas = canvasRef.current
    if (!canvas || !container) return

    const w = container.offsetWidth
    const h = 180
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.imageSmoothingEnabled = true
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, w, h)
  }, [strokeColor, strokeWidth, backgroundColor])

  // Init fullscreen canvas when landscape modal opens
  useLayoutEffect(() => {
    if (!isFullscreen || isPortrait) return

    const timer = setTimeout(() => {
      const container = fsContainerRef.current
      const canvas = fsCanvasRef.current
      if (!canvas || !container) return

      const w = container.offsetWidth
      const h = container.offsetHeight
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth + 1        // slightly thicker for finger
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.imageSmoothingEnabled = true
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, w, h)

      setFsHasSignature(false)
    }, 80)

    return () => clearTimeout(timer)
  }, [isFullscreen, isPortrait, strokeColor, strokeWidth, backgroundColor])

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

  // ─── Desktop drawing ──────────────────────────────────────────────────────
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const coords = getCoords(e, canvas)
      if (!coords) return
      setIsDrawing(true)
      setLastPoint(coords)
      setHasSignature(true)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.fillStyle = strokeColor
      ctx.beginPath()
      ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2)
      ctx.fill()
    },
    [getCoords, strokeColor, strokeWidth]
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !lastPoint) return
      e.preventDefault()
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
        setPreviewDataURL(dataURL)
        onSignatureChange?.(true, dataURL)
      }
    }
    setIsDrawing(false)
    setLastPoint(null)
  }, [isDrawing, onSignatureChange])

  const clearDesktop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setPreviewDataURL(null)
    onSignatureChange?.(false)
  }, [backgroundColor, onSignatureChange])

  // ─── Fullscreen drawing ───────────────────────────────────────────────────
  const fsStartDrawing = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const canvas = fsCanvasRef.current
      if (!canvas) return
      const coords = getCoords(e, canvas)
      if (!coords) return
      setFsIsDrawing(true)
      setFsLastPoint(coords)
      setFsHasSignature(true)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.fillStyle = strokeColor
      ctx.beginPath()
      ctx.arc(coords.x, coords.y, strokeWidth, 0, Math.PI * 2)
      ctx.fill()
    },
    [getCoords, strokeColor, strokeWidth]
  )

  const fsDraw = useCallback(
    (e: React.TouchEvent) => {
      if (!fsIsDrawing || !fsLastPoint) return
      e.preventDefault()
      const canvas = fsCanvasRef.current
      if (!canvas) return
      const coords = getCoords(e, canvas)
      if (!coords) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.beginPath()
      ctx.moveTo(fsLastPoint.x, fsLastPoint.y)
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      setFsLastPoint(coords)
    },
    [fsIsDrawing, fsLastPoint, getCoords]
  )

  const fsStopDrawing = useCallback(() => {
    setFsIsDrawing(false)
    setFsLastPoint(null)
  }, [])

  const fsClear = useCallback(() => {
    const canvas = fsCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setFsHasSignature(false)
  }, [backgroundColor])

  const fsAccept = useCallback(() => {
    const canvas = fsCanvasRef.current
    if (!canvas || !fsHasSignature) return
    const dataURL = canvas.toDataURL("image/png")
    setPreviewDataURL(dataURL)
    setHasSignature(true)
    onSignatureChange?.(true, dataURL)
    setIsFullscreen(false)
  }, [fsHasSignature, onSignatureChange])

  const openFullscreen = () => {
    setIsFullscreen(true)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Firma del solicitante <span className="text-red-500">*</span>
          </span>
          {hasSignature && !isMobile && (
            <Button type="button" variant="ghost" size="sm" onClick={clearDesktop} className="text-xs h-7 px-2">
              <RotateCcw className="w-3 h-3 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        {/* Mobile: tap area → fullscreen */}
        {isMobile ? (
          <div
            className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-pointer h-32 flex items-center justify-center active:bg-gray-50 transition-colors"
            onClick={openFullscreen}
          >
            {previewDataURL ? (
              <>
                <img src={previewDataURL} alt="Firma capturada" className="max-h-28 max-w-full object-contain px-2" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearDesktop() }}
                  className="absolute top-2 right-2 bg-gray-100 rounded-full p-1"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 pointer-events-none select-none">
                <Smartphone className="w-7 h-7" />
                <span className="text-sm">Toca para firmar</span>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: inline canvas */
          <div
            ref={desktopContainerRef}
            className="relative border border-gray-300 rounded-lg overflow-hidden bg-white w-full"
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
                <span className="text-gray-400 text-sm">Firme aquí</span>
              </div>
            )}
          </div>
        )}

        {!hasSignature && (
          <p className="text-xs text-orange-600">
            {isMobile ? "Toca el recuadro para abrir el modo de firma." : "Debe completar su firma antes de enviar."}
          </p>
        )}
      </div>

      {/* ── Fullscreen modal (mobile only) ── */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black">
          {isPortrait ? (
            /* Portrait — rotation hint */
            <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-white">
              <div
                className="text-7xl select-none"
                style={{ animation: "spin 2s linear infinite", display: "inline-block" }}
              >
                ↻
              </div>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
              <p className="text-2xl font-semibold text-center">Gira tu teléfono</p>
              <p className="text-sm text-gray-300 text-center leading-relaxed">
                Rota el dispositivo a modo horizontal para firmar cómodamente.
              </p>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="mt-6 flex items-center gap-2 text-gray-400 border border-gray-600 rounded-md px-4 py-2 text-sm"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          ) : (
            /* Landscape — canvas */
            <div className="flex flex-col h-full">
              {/* Header bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900 shrink-0">
                <span className="text-white text-sm font-medium">Firme con su dedo</span>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={fsClear}
                    disabled={!fsHasSignature}
                    className="flex items-center gap-1 text-gray-300 disabled:opacity-40 text-sm px-3 py-1 rounded border border-gray-600"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    className="text-gray-400 border border-gray-600 rounded px-3 py-1 text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={fsAccept}
                    disabled={!fsHasSignature}
                    className="flex items-center gap-1 bg-green-600 text-white rounded px-3 py-1.5 text-sm font-medium disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" /> Aceptar
                  </button>
                </div>
              </div>

              {/* Canvas area */}
              <div ref={fsContainerRef} className="flex-1 relative bg-white">
                <canvas
                  ref={fsCanvasRef}
                  className="absolute inset-0 w-full h-full touch-none"
                  style={{ cursor: "crosshair" }}
                  onTouchStart={fsStartDrawing}
                  onTouchMove={fsDraw}
                  onTouchEnd={fsStopDrawing}
                />
                {!fsHasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-gray-300 text-xl select-none">← Firme aquí →</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
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
