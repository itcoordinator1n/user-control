"use client"

import type React from "react"
import {jwtDecode} from "jwt-decode";
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Lock, User } from "lucide-react"


import { z } from "zod"
import { useForm } from "react-hook-form"
import { loginSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { signIn, useSession } from "next-auth/react";



type UserRole = {
  id: number;
  name: string;
};

type TokenPayload = {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  country: string;
  area: {
    name: string;
    color: string;
  };
  roles: UserRole[];
  permissions: string[];
  isActive: boolean;
};
export default function LoginForm() {

  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)


    // Simulación de error (para demostrar la animación de error)
    if (formData.username !== "admin" || formData.password !== "password") {
      setError("Usuario o contraseña incorrectos")
      setIsLoading(false)
      return
    }

    // Éxito
    setIsLoading(false)
    alert("Inicio de sesión exitoso")
  }

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user: "",
      password: "",
    },
  });


  async function onSubmit(values: z.infer<typeof loginSchema>) {  
    

    const result = await signIn("credentials", {
      redirect: true,
      username: values.user,
      password: values.password,
    });
    console.log("Token de acceso",session);
    if(session?.user.accessToken){
      const payload:TokenPayload = jwtDecode(session?.user.accessToken);
    }
    // Si el inicio de sesión es exitoso, redirige a /dashboard
    if (result?.ok) {
      //router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="mb-6 text-center text-2xl font-bold text-[#F2F2F2]">Iniciar Sesión</h1>
      <Form {...form}>


        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              {/*
                <motion.div
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#F2F2F2]/70 transition-all duration-200 ${focusedField === "username" || formData.username
                  ? "top-2 -translate-y-full scale-90 text-[#F2B90F]"
                  : ""
                  }`}
              >
                <User size={18} className="mr-2 inline-block" />
                <span>Usuario</span>
              </motion.div>
              */}
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        onFocus={() => setFocusedField("username")}
                        className={`w-full rounded-lg border border-[#77B3D9] bg-[#0367A6]/30 px-4 py-3 pt-6 text-[#F2F2F2] placeholder-transparent transition-all duration-200 focus:border-[#F2B90F] focus:outline-none focus:ring-2 focus:ring-[#F2B90F]/20 ${focusedField === "username" ? "border-[#F2B90F] ring-2 ring-[#F2B90F]/20" : ""
                          }`}
                        placeholder="Usuario"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ingresa tu usuario.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                className={`w-full rounded-lg border border-[#77B3D9] bg-[#0367A6]/30 px-4 py-3 pt-6 text-[#F2F2F2] placeholder-transparent transition-all duration-200 focus:border-[#F2B90F] focus:outline-none focus:ring-2 focus:ring-[#F2B90F]/20 ${focusedField === "username" ? "border-[#F2B90F] ring-2 ring-[#F2B90F]/20" : ""
                  }`}
                placeholder="Usuario"
              /> */}
            </div>

            <div className="relative">
              {/*
                <motion.div
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#F2F2F2]/70 transition-all duration-200 ${focusedField === "password" || formData.password
                  ? "top-2 -translate-y-full scale-90 text-[#F2B90F]"
                  : ""
                  }`}
              >
                <Lock size={18} className="mr-2 inline-block" />
                <span>Contraseña</span>
              </motion.div>
              */}
              <FormField
                control={form.control}
                name="password"

                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contraseña"
                        onFocus={() => setFocusedField("password")}
                        className={`w-full rounded-lg border border-[#77B3D9] bg-[#0367A6]/30 px-4 py-3 pt-6 text-[#F2F2F2] placeholder-transparent transition-all duration-200 focus:border-[#F2B90F] focus:outline-none focus:ring-2 focus:ring-[#F2B90F]/20 ${focusedField === "password" ? "border-[#F2B90F] ring-2 ring-[#F2B90F]/20" : ""
                          }`}
                        type="password" {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ingresa tu contraseña.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className={`w-full rounded-lg border border-[#77B3D9] bg-[#0367A6]/30 px-4 py-3 pt-6 text-[#F2F2F2] placeholder-transparent transition-all duration-200 focus:border-[#F2B90F] focus:outline-none focus:ring-2 focus:ring-[#F2B90F]/20 ${focusedField === "password" ? "border-[#F2B90F] ring-2 ring-[#F2B90F]/20" : ""
                  }`}
                placeholder="Contraseña"
              /> */}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-md bg-red-500/20 p-3 text-sm text-[#F2F2F2]"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-[#F2B90F] to-[#F2B90F]/90 py-3 font-medium text-[#0367A6] transition-all duration-200 hover:from-[#F2B90F]/90 hover:to-[#F2B90F] focus:outline-none focus:ring-2 focus:ring-[#F2B90F] focus:ring-offset-2 disabled:opacity-70"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Iniciar Sesión"}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </motion.button>
        </form>
      </Form>
    </motion.div>
  )
}

