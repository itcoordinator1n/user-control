"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ParallaxImage } from "./parallax-image"

// Sample product data
const products = [
  {
    id: 1,
    name: "AlivioRápido",
    description: "Analgésico de acción rápida para dolores leves y moderados",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 2,
    name: "DormiPax",
    description: "Ayuda natural para conciliar el sueño y mejorar su calidad",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 3,
    name: "RespiClear",
    description: "Descongestionante nasal para alergias y resfriados",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 4,
    name: "DigestiCalm",
    description: "Alivio para problemas digestivos y acidez estomacal",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 5,
    name: "VitaPlus",
    description: "Complejo multivitamínico para reforzar el sistema inmune",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 6,
    name: "ArticuFlex",
    description: "Suplemento para la salud articular y movilidad",
    image: "/placeholder.svg?height=300&width=300",
  },
]

export function ProductCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const productsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  }

  // Get the number of products to show based on screen width
  const getProductsToShow = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return productsPerView.mobile
      if (window.innerWidth < 1024) return productsPerView.tablet
      return productsPerView.desktop
    }
    return productsPerView.desktop
  }

  const [productsToShow, setProductsToShow] = useState(productsPerView.desktop)

  useEffect(() => {
    const handleResize = () => {
      setProductsToShow(getProductsToShow())
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, []) // Removed getProductsToShow as a dependency

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        nextSlide()
      }, 5000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying]) // Removed currentIndex and productsToShow as dependencies

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + productsToShow >= products.length ? 0 : prevIndex + 1))
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? Math.max(0, products.length - productsToShow) : prevIndex - 1))
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + productsToShow)

  // If we don't have enough products to fill the view, add from the beginning
  if (visibleProducts.length < productsToShow) {
    const remaining = productsToShow - visibleProducts.length
    visibleProducts.push(...products.slice(0, remaining))
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
            transform: `translateX(-${currentIndex * (100 / productsToShow)}%)`,
            width: `${(products.length / productsToShow) * 100}%`,
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="px-4" style={{ width: `${(100 / products.length) * productsToShow}%` }}>
              <div className="bg-background rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square relative mb-4">
                  <ParallaxImage
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="rounded-md overflow-hidden"
                    parallaxIntensity={15}
                  />
                </div>
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-muted-foreground text-sm">{product.description}</p>
                <Button variant="link" className="mt-2 h-8 p-0 text-primary">
                  Ver detalles
                </Button>
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
        {Array.from({ length: Math.ceil(products.length / productsToShow) }).map((_, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className={`h-2 w-2 p-0 rounded-full ${
              Math.floor(currentIndex / productsToShow) === index ? "bg-primary" : "bg-muted"
            }`}
            onClick={() => setCurrentIndex(index * productsToShow)}
          >
            <span className="sr-only">Ir a diapositiva {index + 1}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

