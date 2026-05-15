"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import {
  ArrowRight,
  ShieldCheck,
  Award,
  Microscope,
  Stethoscope,
  Quote,
  Activity,
  HeartPulse,
  Users,
  BarChart3,
  Ticket,
  ClipboardList,
  Factory,
  User,
  Sparkles,
  Clock,
  Globe,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"

// Quick access cards based on permissions
type QuickAccessCard = {
  label: string
  description: string
  href: string
  icon: React.ElementType
  color: string
  requiredPerms: string[]
  requirePlatform?: string
}

const QUICK_ACCESS: QuickAccessCard[] = [
  {
    label: "Mi Perfil",
    description: "Historial de marcaje y asistencia",
    href: "/page/profile",
    icon: User,
    color: "from-blue-500 to-blue-600",
    requiredPerms: ["USER:READ", "EMPLOYEE:PROFILE"],
  },
  {
    label: "Solicitudes",
    description: "Gestiona permisos y vacaciones",
    href: "/page/applications",
    icon: ClipboardList,
    color: "from-violet-500 to-violet-600",
    requiredPerms: ["RRHH:APPLICATIONS_MANAGE", "BOSS:APPLICATIONS"],
    requirePlatform: "permisos",
  },
  {
    label: "Permisos",
    description: "Ver y solicitar permisos laborales",
    href: "/page/vacations-permits",
    icon: HeartPulse,
    color: "from-pink-500 to-pink-600",
    requiredPerms: ["RRHH:PERMITS_VIEW", "EMPLOYEE:PERMITS"],
    requirePlatform: "permisos",
  },
  {
    label: "Métricas",
    description: "Panel de estadísticas y asistencia",
    href: "/page/dashboard",
    icon: BarChart3,
    color: "from-emerald-500 to-emerald-600",
    requiredPerms: ["METRICS:GENERAL", "RRHH:ADMIN", "RRHH:DASHBOARD", "dashboard:all:view"],
    requirePlatform: "permisos",
  },
  {
    label: "Soporte IT",
    description: "Tickets y solicitudes técnicas",
    href: "/page/tickets",
    icon: Ticket,
    color: "from-amber-500 to-amber-600",
    requiredPerms: ["TICKET:READ", "TICKET:CREATE", "TICKET:TECH", "TICKET:MGMT", "TICKET:ADMIN"],
    requirePlatform: "tickets",
  },
  {
    label: "Administración",
    description: "Usuarios, roles y permisos",
    href: "/page/admin",
    icon: Users,
    color: "from-slate-600 to-slate-700",
    requiredPerms: ["USER:READ", "ROLE:VIEW", "ADMIN:VIEW"],
    requirePlatform: "admin",
  },
  {
    label: "Producción",
    description: "Control de tiempos y actividades",
    href: "/page/produccion/control-tiempos",
    icon: Factory,
    color: "from-orange-500 to-orange-600",
    requiredPerms: ["PROD:REGISTER", "PROD:VIEW", "PROD:ADMIN", "PRODUCCION:TIEMPOS"],
    requirePlatform: "produccion",
  },
]

const STATS = [
  { label: "Años de trayectoria", value: "75+", icon: Clock },
  { label: "Empleados activos", value: "140+", icon: Users },
  { label: "Países de distribución", value: "5+", icon: Globe },
  { label: "Productos en catálogo", value: "200+", icon: Sparkles },
]

export default function Home() {
  const { data: session } = useSession()
  const user = session?.user as any

  const accessibleCards = useMemo(() => {
    if (!user) return []
    const userPlatforms: string[] = user.platforms || []
    const userPerms: string[] = user.permissions || []

    return QUICK_ACCESS.filter((card) => {
      if (card.requirePlatform && !userPlatforms.includes(card.requirePlatform)) return false
      return card.requiredPerms.some((p) => userPerms.includes(p))
    })
  }, [user])

  const isLoggedIn = !!session

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex-1">

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden min-h-[92vh] flex items-center">
          {/* Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero_pharma_lab.png"
              alt="Infarma Laboratorio"
              fill
              className="object-cover scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-blue-950/80 to-slate-900/70" />
            {/* Decorative orbs */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container relative z-10 py-20">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              {/* Left: Branding */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300 backdrop-blur-md">
                  <Activity className="h-4 w-4" />
                  Más de 75 años de trayectoria
                </div>

                <div className="space-y-4">
                  <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-none">
                    Salud y{" "}
                    <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                      Bienestar
                    </span>
                    <br />
                    <span className="text-3xl sm:text-4xl md:text-5xl font-semibold text-blue-200/80">
                      Para Toda la Región
                    </span>
                  </h1>
                  <p className="max-w-lg text-lg text-slate-300 leading-relaxed">
                    Laboratorio hondureño comprometido con brindar productos de calidad que permiten aliviar y mejorar la salud de todas las personas.
                  </p>
                </div>

                {!isLoggedIn && (
                  <div className="flex flex-wrap gap-3">
                    <Link href="/page/login">
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-xl shadow-blue-900/30 px-7">
                        Ingresar al Sistema
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="bg-transparent text-white border-white/30 hover:bg-white/10 transition-colors">
                      Conocer Más
                    </Button>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  {STATS.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm text-center">
                      <s.icon className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-[11px] text-slate-400 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Quick Access Panel (if logged in) */}
              {isLoggedIn && accessibleCards.length > 0 && (
                <div className="lg:pl-8">
                  <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-lg font-bold text-blue-300">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm leading-tight">
                          Bienvenido, {user?.name?.split(" ")[0]}
                        </p>
                        <p className="text-slate-400 text-xs">{user?.area?.name || "Infarma"}</p>
                      </div>
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                      Acceso Rápido
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {accessibleCards.slice(0, 6).map((card) => (
                        <Link key={card.href} href={card.href}>
                          <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer">
                            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                              <card.icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-semibold truncate">{card.label}</p>
                              <p className="text-slate-400 text-[10px] truncate leading-tight">{card.description}</p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 group-hover:text-white group-hover:translate-x-0.5 transition-all ml-auto" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Right: Login CTA (if not logged in) */}
              {!isLoggedIn && (
                <div className="lg:pl-8 hidden lg:block">
                  <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold">Portal Corporativo</p>
                        <p className="text-slate-400 text-sm">Acceso seguro para colaboradores</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {["Gestión de Recursos Humanos", "Control de Asistencia", "Tickets de Soporte IT", "Panel de Métricas"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <Link href="/page/login" className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2">
                        Acceder al sistema
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── NUESTRA HISTORIA ─── */}
        <section className="py-24 bg-white">
          <div className="container">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="relative aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl group">
                <Image src="/pharma_history.png" alt="Instalaciones de Infarma" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="rounded-2xl bg-white/90 backdrop-blur-md p-4 border border-white/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Fundado en</p>
                    <p className="text-2xl font-bold text-slate-900">1948</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-2">Quiénes somos</p>
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900">Nuestra Historia</h2>
                  <div className="mt-3 h-1 w-16 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" />
                </div>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Iniciando con la visión de su fundador el Dr. Miguel Andonie Fernández Q.P.D., el esfuerzo de Infarma ha sido y será brindar productos de calidad que permitan aliviar y mejorar la salud de todas las personas.
                </p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Somos una gran industria por contar con talento humano de calidad que trabaja día con día para poner a disposición productos farmacéuticos con los más altos estándares.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {[
                    { icon: Microscope, label: "Innovación Continua", desc: "Tecnología de vanguardia" },
                    { icon: ShieldCheck, label: "Calidad Certificada", desc: "ISO 9001:2015" },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="h-11 w-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── MISIÓN & VISIÓN ─── */}
        <section className="py-20 bg-slate-50">
          <div className="container">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-2">Propósito</p>
              <h2 className="text-4xl font-bold text-slate-900">Misión y Visión</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {[
                {
                  icon: Award,
                  title: "Nuestra Misión",
                  text: "Fabricamos y comercializamos productos farmacéuticos y alimenticios elegidos por su efectividad, accesibilidad y confianza en nuestras marcas.",
                  gradient: "from-blue-500 to-blue-600",
                  bg: "bg-blue-50 hover:bg-blue-600",
                },
                {
                  icon: HeartPulse,
                  title: "Nuestra Visión",
                  text: "Ser el referente del consumidor en el cuidado y bienestar de la salud en toda la región centroamericana.",
                  gradient: "from-violet-500 to-violet-600",
                  bg: "bg-violet-50 hover:bg-violet-600",
                },
              ].map((card) => (
                <div key={card.title} className={`group relative rounded-3xl ${card.bg} p-8 hover:text-white transition-all duration-300 shadow-sm hover:shadow-2xl`}>
                  <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-slate-900 group-hover:text-white">{card.title}</h3>
                  <p className="text-slate-600 group-hover:text-white/90 text-lg leading-relaxed">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── QUOTE DEL FUNDADOR ─── */}
        <section className="py-28 relative bg-slate-950 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
          </div>
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <Quote className="h-16 w-16 text-blue-500/30 mx-auto" />
              <blockquote className="text-2xl md:text-3xl font-medium text-white/90 leading-relaxed italic">
                "Ojalá nazca pronto esa NUEVA HONDURAS que está en el corazón de cada hondureño del pueblo, de ese hondureño que no defiende posiciones ni canonjías."
              </blockquote>
              <div>
                <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Dr. Miguel Andonie Fernández</p>
                <p className="text-slate-500 mt-1">Fundador · 1921 – 2013</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CALIDAD & FARMACOVIGILANCIA ─── */}
        <section className="py-24 bg-white">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 items-start">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  ISO 9001:2015
                </div>
                <h2 className="text-4xl font-bold tracking-tight text-slate-900">Política de Calidad</h2>
                <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                <p className="text-slate-600 leading-relaxed text-lg">
                  En Infarma, nos enfocamos en el desarrollo, fabricación y crecimiento comercial basado en la sostenibilidad del negocio a través del cumplimiento de los requisitos y la mejora continua del Sistema de Gestión de Calidad Integral.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {["Efectividad", "Seguridad", "Accesibilidad"].map((v) => (
                    <div key={v} className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl p-8 border border-slate-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3.5 bg-red-100 text-red-600 rounded-2xl">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Farmacovigilancia</h3>
                    <p className="text-sm text-slate-500">Sistema de reporte de efectos adversos</p>
                  </div>
                </div>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  La ciencia y las actividades relacionadas con la detección, evaluación, comprensión y prevención de los efectos adversos o cualquier otro problema relacionado con los medicamentos.
                </p>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 rounded-xl gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Reportar Efecto Adverso
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-950 text-slate-400">
        <div className="container py-14">
          <div className="grid gap-10 md:grid-cols-3 mb-10">
            <div className="space-y-4">
              <span className="font-bold text-white text-3xl">infarma</span>
              <p className="text-sm leading-relaxed max-w-xs">
                Laboratorio hondureño con más de 75 años de trayectoria en la industria farmacéutica.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li><span className="text-white font-medium">Dirección: </span>Colonia El Prado, Tegucigalpa</li>
                <li><span className="text-white font-medium">Teléfono: </span>(504) 2225-1272</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Legal & Corporativo</h4>
              <ul className="space-y-3 text-sm">
                {["Farmacovigilancia", "Sistema de Gestión de Calidad", "Blog «Las Mejores Medicinas»"].map((item) => (
                  <li key={item}><Link href="#" className="hover:text-white transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} Infarma Honduras. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
