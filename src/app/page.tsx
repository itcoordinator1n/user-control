import Link from "next/link"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 z-0">
            <Image
              src="/Hero.png"
              alt="Hero Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/40" />
          </div>
          <div className="container relative z-10 py-20 md:py-28 lg:py-36">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Quienes somos
                </h1>
                <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
                Laboratorio hondureño con más de 75 años de trayectoria en la industria farmacéutica. Infarma ha aportado salud y bienestar a todas aquellas personas que han preferido nuestros productos en toda la región.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="gap-2">
                    Explorar Productos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg">
                    Saber más
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Carousel */}
        <section className="py-12 bg-muted/50">
          <div className="container">
            <div className="flex flex-col items-center text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Nuestros Productos Destacados
              </h2>
              <p className="mt-4 max-w-[700px] text-muted-foreground">
                Descubre nuestra gama de productos farmacéuticos de venta libre, diseñados para ayudarte a sentirte
                mejor cada día.
              </p>
            </div>

            <div className="relative">
              <div className="flex overflow-x-auto gap-6 pb-4 snap-x">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Card key={item} className="min-w-[280px] max-w-[280px] snap-center">
                    <div className="p-4 space-y-4">
                      <div className="aspect-square relative rounded-md overflow-hidden">
                        <Image
                          src={`/placeholder.svg?height=280&width=280&text=Producto ${item}`}
                          alt={`Producto ${item}`}
                          fill
                          className="object-cover transition-all hover:scale-105"
                        />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Producto {item}</h3>
                        <p className="text-sm text-muted-foreground">
                          Alivio rápido y efectivo para tus necesidades diarias.
                        </p>
                        <div className="flex items-center gap-1">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                            ))}
                          <span className="text-xs text-muted-foreground ml-1">(24)</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" size="sm">
                        Ver detalles
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-background shadow-md hidden md:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full bg-background shadow-md hidden md:flex"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features and Benefits */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="flex flex-col items-center text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Características y Beneficios
              </h2>
              <p className="mt-4 max-w-[700px] text-muted-foreground">
                Nuestros productos están diseñados pensando en tu bienestar, con características que marcan la
                diferencia.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Eficacia Comprobada",
                  description: "Productos con resultados respaldados por estudios clínicos y años de investigación.",
                  icon: (
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
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
                        className="h-6 w-6"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                  ),
                },
                {
                  title: "Materiales de Calidad",
                  description: "Utilizamos solo Materiales de la más alta calidad, seleccionados cuidadosamente.",
                  icon: (
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
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
                        className="h-6 w-6"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  ),
                },
                {
                  title: "Alivio Rápido",
                  description: "Formulados para proporcionar un alivio rápido y efectivo cuando más lo necesitas.",
                  icon: (
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
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
                        className="h-6 w-6"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                  ),
                },
                {
                  title: "Seguridad Garantizada",
                  description: "Todos nuestros productos pasan por rigurosos controles de calidad y seguridad.",
                  icon: (
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
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
                        className="h-6 w-6"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                  ),
                },
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
                  {feature.icon}
                  <h3 className="mt-4 font-semibold text-xl">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  <Link href="#" className="mt-4 text-sm font-medium text-primary hover:underline">
                    Saber más
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="flex flex-col items-center text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Cómo Funciona</h2>
              <p className="mt-4 max-w-[700px] text-muted-foreground">
                Un proceso simple para obtener los productos que necesitas, cuando los necesitas.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Elige tu producto",
                  description:
                    "Navega por nuestra amplia gama de productos y selecciona los que mejor se adapten a tus necesidades.",
                },
                {
                  step: "2",
                  title: "Compra en línea",
                  description: "Realiza tu pedido de forma segura a través de nuestra plataforma de compra en línea.",
                },
                {
                  step: "3",
                  title: "Entrega rápida",
                  description: "Recibe tus productos directamente en tu domicilio con nuestra entrega rápida y segura.",
                },
              ].map((step, index) => (
                <div key={index} className="relative flex flex-col items-center text-center p-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-xl">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-[2px] bg-border">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 border-t-2 border-r-2 border-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
          */}
        {/* Testimonials */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="flex flex-col items-center text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Lo que dicen nuestros clientes
              </h2>
              <p className="mt-4 max-w-[700px] text-muted-foreground">
                Miles de personas confían en nuestros productos para su bienestar diario.
              </p>
            </div>

            <Tabs defaultValue="tab1" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
                <TabsTrigger value="tab1">Testimonios</TabsTrigger>
                <TabsTrigger value="tab2">Reseñas</TabsTrigger>
                <TabsTrigger value="tab3">Historias</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      name: "María García",
                      role: "Cliente desde 2020",
                      content:
                        "Los productos de FarmaSalud han sido una parte esencial de mi botiquín familiar. La calidad y eficacia son incomparables.",
                      rating: 5,
                    },
                    {
                      name: "Carlos Rodríguez",
                      role: "Cliente desde 2019",
                      content:
                        "Después de probar varias marcas, finalmente encontré FarmaSalud. Sus productos son efectivos y a un precio razonable.",
                      rating: 5,
                    },
                    {
                      name: "Laura Martínez",
                      role: "Cliente desde 2021",
                      content:
                        "La entrega rápida y el servicio al cliente excepcional hacen que comprar en FarmaSalud sea una experiencia agradable.",
                      rating: 4,
                    },
                  ].map((testimonial, index) => (
                    <div key={index} className="flex flex-col p-6 bg-card rounded-lg border">
                      <div className="flex items-center gap-1 mb-4">
                        {Array(testimonial.rating)
                          .fill(0)
                          .map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                        {Array(5 - testimonial.rating)
                          .fill(0)
                          .map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-muted-foreground" />
                          ))}
                      </div>
                      <p className="flex-1 text-muted-foreground">{testimonial.content}</p>
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="tab2">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Más reseñas de clientes próximamente.</p>
                </div>
              </TabsContent>
              <TabsContent value="tab3">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Historias de éxito de nuestros clientes próximamente.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Únete a Miles de Clientes Felices
              </h2>
              <p className="mt-4 text-primary-foreground/80 md:text-xl">
                Comienza a cuidar tu salud con nuestros productos farmacéuticos de venta libre de alta calidad.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary">
                  Registrarse Ahora
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
                >
                  Contactar con Ventas
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 md:py-16 bg-muted/50">
          <div className="container">
            <div className="flex flex-col items-center text-center max-w-xl mx-auto">
              <h3 className="text-2xl font-bold tracking-tighter">Mantente Informado</h3>
              <p className="mt-2 text-muted-foreground">
                Suscríbete a nuestro boletín para recibir consejos de salud, novedades y ofertas exclusivas.
              </p>
              <div className="mt-6 w-full">
                <form className="flex flex-col sm:flex-row gap-2">
                  <Input type="email" placeholder="Tu correo electrónico" className="flex-1" />
                  <Button type="submit">Suscribirse</Button>
                </form>
                <p className="mt-2 text-xs text-muted-foreground">
                  Al suscribirte, aceptas nuestra{" "}
                  <Link href="#" className="underline underline-offset-2">
                    Política de Privacidad
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo2.JPG"
                  alt="Infarma Logo"
                  width={150}
                  height={40}
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Productos</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Analgésicos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Antiinflamatorios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Vitaminas y Suplementos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Cuidado Digestivo
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Cuidado Respiratorio
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Sobre Nosotros
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Nuestros Valores
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Responsabilidad Social
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Carreras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Envíos y Devoluciones
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Ayuda
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FarmaSalud. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Abrir chat</span>
        </Button>
      </div>
    </div>
  )
}

