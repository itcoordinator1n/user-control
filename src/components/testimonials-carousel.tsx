"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    name: "María García",
    role: "Paciente crónico",
    quote:
      "Los productos de PharmaCare han mejorado significativamente mi calidad de vida. El servicio al cliente es excepcional y los envíos siempre llegan a tiempo.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 5,
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    role: "Deportista",
    quote:
      "Como atleta, necesito productos de calidad para mantener mi salud. PharmaCare ofrece exactamente lo que necesito con ingredientes de primera calidad.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4,
  },
  {
    id: 3,
    name: "Laura Martínez",
    role: "Madre de familia",
    quote:
      "Confío en PharmaCare para toda mi familia. Sus productos son seguros, efectivos y siempre tienen lo que necesitamos para mantenernos saludables.",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 5,
  },
]

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        nextSlide()
      }, 6000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={i < rating ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-4 w-4 ${i < rating ? "text-primary" : "text-muted-foreground"}`}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))
  }

  return (
    <div className="relative">
      <div className="flex justify-between absolute top-1/2 left-0 right-0 -mt-4 px-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={nextSlide}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Siguiente</span>
        </Button>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${testimonials.length * 100}%`,
          }}
        >
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="px-4" style={{ width: `${100 / testimonials.length}%` }}>
              <div className="bg-muted rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={80}
                      height={80}
                      className="rounded-full object-cover h-full w-full"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold">{testimonial.name}</h3>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <div className="flex mt-1">{renderStars(testimonial.rating)}</div>
                  </div>
                </div>
                <blockquote className="italic text-muted-foreground">"{testimonial.quote}"</blockquote>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-6 gap-2">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={togglePlayPause}>
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
          <span className="sr-only">{isPlaying ? "Pausar" : "Reproducir"}</span>
        </Button>
        {testimonials.map((_, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className={`h-2 w-2 p-0 rounded-full ${currentIndex === index ? "bg-primary" : "bg-muted"}`}
            onClick={() => setCurrentIndex(index)}
          >
            <span className="sr-only">Ir a testimonio {index + 1}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

