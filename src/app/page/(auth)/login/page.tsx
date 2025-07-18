import LoginForm from "@/components/login-form"
import Background from "@/components/background"
import Logo from "@/components/logo"

export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#0367A6] to-[#3B8DBF] p-4">
      <Background />
      <div className="z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="overflow-hidden rounded-xl bg-white/10 p-6 backdrop-blur-lg sm:p-8">
          <LoginForm />
        </div>
        <div className="mt-6 text-center text-xs text-[#F2F2F2]">
          © {new Date().getFullYear()} INFARMA. Todos los derechos reservados.
        </div>
      </div>
    </main>
  )
}

