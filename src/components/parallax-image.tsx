"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"

interface ParallaxImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  parallaxIntensity?: number
}

export function ParallaxImage({ src, alt, width, height, className = "", parallaxIntensity = 10 }: ParallaxImageProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const { left, top, width, height } = ref.current.getBoundingClientRect()

    // Calculate mouse position relative to the element
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5

    // Set position with the intensity factor
    setPosition({
      x: x * parallaxIntensity,
      y: y * parallaxIntensity,
    })
  }

  const handleMouseLeave = () => {
    // Reset position when mouse leaves
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: "100%",
          height: "100%",
        }}
      >
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  )
}

