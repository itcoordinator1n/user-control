"use client"

import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { signOut } from "next-auth/react";
import { Navbar } from "@/components/navbar2"
import { ThemeProvider } from "@/components/theme-provider"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import PasswordChangeModal from "@/components/password-change-modal";
import {jwtDecode} from "jwt-decode";
export default function ClientLayout(
  {
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>

) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [open, setOpen] = useState(false)
  const { data: session, status } = useSession()
  useEffect(() => {
    console.log("estatus:",status)
    if (status == "authenticated") {
      setIsLoggedIn(true)
    } else {
      setIsLoggedIn(false)

    }
  }, [status]);



  const handleLogout = () => {
    setIsLoggedIn(false)
  }
  useEffect(() => {
    const getFlag = async ()=>{
      try {
        console.log("token:",session)
        console.log("Permisos",session?.user?.permissions)
        
        if (!session?.user?.accessToken) {
          console.log("No access token available yet")
          return;
        }

        const decoded = jwtDecode(session.user.accessToken as string);
        console.log("Payload del token:", decoded);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/auth/get-password-flag`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.accessToken}`,
          }
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn("Error al enviar solicitud:", err)
          return
        }
        const result = await res.json();
        console.log("Bandera",result)
        setOpen(result.changePassword)
        console.log("Contraseña actualizada")
      } catch (error) {
        console.warn("No se pudo obtener el flag de contraseña, API no disponible:", error);
      }
    }
    
    getFlag()
  },[status]);

  return (
    <html lang="en">
      <body>

        <PasswordChangeModal isOpen={open} setOpen={setOpen}/>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {!isLoggedIn ? (
            <div className="min-h-screen bg-white dark:bg-background transition-colors duration-300">
              <Navbar isLoggedIn={isLoggedIn} />
              <main className="container  w-screen px-0 ">
                {children}
              </main>
            </div>
          ) : (
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <SidebarInset className="flex flex-1 flex-col bg-white dark:bg-background transition-colors duration-300">
                  <Navbar isLoggedIn={isLoggedIn} />
                  <main className="flex-1">
                    <div className="mx-auto w-full">
                      {children}
                    </div>
                  </main>
                </SidebarInset>
              </div>
            </SidebarProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
