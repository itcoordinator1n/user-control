"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Clock, UserCheck, UserX, CalendarDays } from "lucide-react"

export default function KeyIndicators() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
              <UserCheck className="h-6 w-6 text-blue-700" />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-muted-foreground leading-none">Asistencia</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold">94.2%</p>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>2.1%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">vs. mes anterior</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
              <UserX className="h-6 w-6 text-red-700" />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-muted-foreground leading-none">Ausentismo</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold">5.8%</p>
                <div className="flex items-center text-sm text-red-600">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>0.7%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">vs. mes anterior</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-700" />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-muted-foreground leading-none">Tardanzas</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold">3.5%</p>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  <span>1.2%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">vs. mes anterior</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
              <CalendarDays className="h-6 w-6 text-purple-700" />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-muted-foreground leading-none">Vacaciones</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold">12</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>solicitudes</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">pendientes de aprobación</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

