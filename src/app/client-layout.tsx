"use client"

import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { signOut } from "next-auth/react";
import { Navbar } from "@/components/navbar2"
import { ThemeProvider } from "@/components/theme-provider"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"

export default function ClientLayout(
      {
  children,
}: Readonly<{
  children: React.ReactNode;
}>

) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
 const { data: session, status } = useSession()
useEffect(() => {
    if(status == "authenticated"){
        setIsLoggedIn(true)
    }else{
        setIsLoggedIn(false)

    }
  }, [status]);



  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <html lang="en">
     <body>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {!isLoggedIn ? (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
          <Navbar isLoggedIn={isLoggedIn}  />
          <main className="container  w-screen px-0 ">
            {children}
          </main>
        </div>
      ) : (
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <SidebarInset className="flex flex-1 flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
              <Navbar isLoggedIn={isLoggedIn}  />
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
