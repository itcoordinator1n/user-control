import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  ShieldCheck,
  Award,
  Microscope,
  Stethoscope,
  Quote,
  Activity,
  HeartPulse
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero_pharma_lab.png"
              alt="Infarma Laboratorio"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-primary/40 backdrop-blur-sm" />
          </div>
          <div className="container relative z-10 py-24 md:py-32 lg:py-40 text-white">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center rounded-full border border-blue-200/30 bg-blue-900/30 px-3 py-1 text-sm font-medium backdrop-blur-md">
                  <Activity className="mr-2 h-4 w-4" />
                  Más de 75 años de trayectoria
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl/tight">
                  Salud y Bienestar <br /> <span className="text-blue-300">Para Toda la Región</span>
                </h1>
                <p className="max-w-[600px] text-lg text-blue-50/90 md:text-xl">
                  Laboratorio hondureño comprometido con brindar productos de calidad que permiten aliviar y mejorar la salud de todas las personas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/page/login">
                    <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-xl shadow-blue-900/20">
                      Ingresar al Sistema
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white/10 transition-colors">
                    Conocer Nuestros Productos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quienes Somos Section */}
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="relative aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/pharma_history.png"
                  alt="Instalaciones de Infarma"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Nuestra Historia</h2>
                  <div className="mt-2 h-1 w-20 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Iniciando con la visión de su fundador el Dr. Miguel Andonie Fernández Q.P.D., el esfuerzo de Infarma ha sido y será brindar productos de calidad que permitan aliviar y mejorar la salud de todas las personas que lo necesiten.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Somos una gran industria por contar con talento humano de calidad que trabaja día con día para poner a la disposición productos farmacéuticos con los más altos estándares destinados a aportar bienestar.
                </p>
                <div className="pt-4 grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600">
                      <Microscope className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Innovación Continua</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Calidad Certificada</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mision y Vision */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Mision */}
              <div className="group relative rounded-3xl bg-blue-50 p-8 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="mb-4 text-2xl font-bold">Nuestra Misión</h3>
                <p className="text-gray-600 group-hover:text-blue-50 text-lg leading-relaxed">
                  Fabricamos y comercializamos productos farmacéuticos y alimenticios elegidos por su efectividad, accesibilidad y confianza en nuestras marcas.
                </p>
              </div>
              
              {/* Vision */}
              <div className="group relative rounded-3xl bg-blue-50 p-8 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-primary group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                  <HeartPulse className="h-8 w-8" />
                </div>
                <h3 className="mb-4 text-2xl font-bold">Nuestra Visión</h3>
                <p className="text-gray-600 group-hover:text-blue-50 text-lg leading-relaxed">
                  Ser el referente del consumidor en el cuidado y bienestar de la salud en toda la región.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Legado y Fundador */}
        <section className="py-24 relative bg-gray-900 overflow-hidden">
          <div className="absolute inset-0 bg-blue-900/20" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <Quote className="h-16 w-16 text-blue-500/50 mx-auto" />
              <blockquote className="text-2xl md:text-3xl font-medium text-white leading-relaxed italic">
                "Ojalá nazca pronto esa NUEVA HONDURAS que está en el corazón de cada hondureño del pueblo, de ese hondureño que no defiende posiciones ni canonjías. Ruego a Dios que se cumpla esta pequeña esperanza, así sea."
              </blockquote>
              <div className="pt-6">
                <p className="text-xl font-bold text-blue-400">Dr. Miguel Andonie Fernández</p>
                <p className="text-gray-400 mt-1">Fundador (1921 - 2013)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Politica de Calidad y Farmacovigilancia */}
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  ISO 9001:2015
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Política de Calidad</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  En Infarma, nos enfocamos en el desarrollo, fabricación y crecimiento comercial basado en la sostenibilidad del negocio a través del cumplimiento de los requisitos y la mejora continua del Sistema de Gestión de Calidad Integral, garantizando la calidad de nuestros productos.
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Farmacovigilancia</h3>
                </div>
                <p className="text-gray-600 mb-8">
                  La ciencia y las actividades relacionadas con la detección, evaluación, comprensión y prevención de los efectos adversos o cualquier otro problema relacionado con los medicamentos.
                </p>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium">
                  Reportar Efecto Adverso
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Oficial */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <span className="font-bold text-primary text-3xl">infarma</span>
              <p className="text-gray-500 max-w-xs text-sm leading-relaxed">
                Laboratorio hondureño con más de 75 años de trayectoria en la industria farmacéutica, aportando salud y bienestar.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Contacto</h4>
              <ul className="space-y-3 text-gray-600 text-sm">
                <li className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Dirección:</span> Colonia El Prado, Tegucigalpa, Honduras
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Teléfono:</span> (504) 2225-1272
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Legal & Corporativo</h4>
              <ul className="space-y-3 text-gray-600 text-sm">
                <li><Link href="#" className="hover:text-primary transition-colors">Farmacovigilancia</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Sistema de Gestión de Calidad</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog &quot;Las Mejores Medicinas&quot;</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Infarma Honduras. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
