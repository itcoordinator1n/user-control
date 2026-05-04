"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserAvatarMenu } from "@/components/user-avatar-menu"

interface NavbarProps {
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
}

export function Navbar({ isLoggedIn, onLogin }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-950 dark:border-gray-800 transition-colors duration-300">
      <div className="container flex h-16 items-center">
        {/* Mobile menu trigger for non-logged-in users */}
        {!isLoggedIn && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 md:hidden text-primary dark:text-white">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white dark:bg-gray-950">
              <nav className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                  <span className="font-bold text-primary dark:text-white text-2xl">infarma</span>
                </div>
                <div className="mt-4 px-2">
                  <Button onClick={onLogin} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Iniciar sesión
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {/* Sidebar trigger for logged-in users */}
        {isLoggedIn && <SidebarTrigger className="mr-2 text-primary dark:text-white" />}

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary dark:text-white text-2xl transition-colors duration-300">
            infarma
          </span>
        </div>

        {/* Right side content */}
        <div className="ml-auto flex items-center gap-2">
          {!isLoggedIn ? (
            <Button onClick={onLogin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Iniciar sesión
            </Button>
          ) : (
            <UserAvatarMenu />
          )}
        </div>
      </div>
    </header>
  )
}

