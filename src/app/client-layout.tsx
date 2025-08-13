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
      console.log("token:",session)
      console.log("Permisos",session?.user.permissions)
      const decoded = jwtDecode(session?.user.accessToken as string);
      console.log("Payload del token:", decoded);
      const res = await fetch("https://infarma.duckdns.org/api/auth/get-password-flag", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          // NO Content-Type: lo gestiona automáticamente FormData
        }
      })
      

      if (!res.ok) {
        const err = await res.json()
        console.error("Error al enviar solicitud:", err)
        return
      }
      const result = await res.json();
      console.log("Bandera",result)
      setOpen(result.changePassword)
      console.log("Contrase;a actualizada")
    }
    
    getFlag()
  },[status]);

  return (
    <html lang="en">
      <body>

        <PasswordChangeModal isOpen={open} setOpen={setOpen}/>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {!isLoggedIn ? (
            <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
              <Navbar isLoggedIn={isLoggedIn} />
              <main className="container  w-screen px-0 ">
                {children}
              </main>
            </div>
          ) : (
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <SidebarInset className="flex flex-1 flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
                  <Navbar isLoggedIn={isLoggedIn} />
                  <main className="flex-1 p-6">
                    <div className="mx-auto max-w-7xl">
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
