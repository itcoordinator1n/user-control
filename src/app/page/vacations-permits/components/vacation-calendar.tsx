"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VacationCalendarProps {
  startDate?: Date
  endDate?: Date
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void
  availableDays?: number
}

export function VacationCalendar({ startDate, endDate, onDateRangeChange, availableDays = 0 }: VacationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)

  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]

  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false
    return date >= startDate && date <= endDate
  }

  const isDateSelected = (date: Date) => {
    if (!startDate && !endDate) return false
    return (startDate && date.getTime() === startDate.getTime()) || (endDate && date.getTime() === endDate.getTime())
  }

  const handleDateClick = (date: Date) => {
    if (selectingStart || !startDate) {
      onDateRangeChange?.(date, null)
      setSelectingStart(false)
    } else {
      if (date < startDate) {
        onDateRangeChange?.(date, startDate)
      } else {
        onDateRangeChange?.(startDate, date)
      }
      setSelectingStart(true)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const clearSelection = () => {
    onDateRangeChange?.(null, null)
    setSelectingStart(true)
  }

  const days = getDaysInMonth(currentMonth)
  const totalDays =
    startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div key={index} className="aspect-square">
              {day && (
                <button
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "w-full h-full text-sm rounded hover:bg-blue-100 transition-colors",
                    isDateSelected(day) && "bg-yellow-400 text-white font-medium",
                    isDateInRange(day) && !isDateSelected(day) && "bg-blue-100",
                    !day && "invisible",
                  )}
                >
                  {day.getDate()}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Fecha inicio:</span>
          <span className="text-blue-600">{startDate ? startDate.toLocaleDateString("es-ES") : "No seleccionada"}</span>
        </div>
        <div className="flex justify-between">
          <span>Fecha fin:</span>
          <span className="text-blue-600">{endDate ? endDate.toLocaleDateString("es-ES") : "No seleccionada"}</span>
        </div>
        <div className="flex justify-between">
          <span>Días totales:</span>
          <span className="font-medium">{totalDays}</span>
        </div>
        <div className="flex justify-between">
          <span>Días laborables:</span>
          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
            {totalDays > 0 ? Math.max(0, totalDays - Math.floor(totalDays / 7) * 2) : 0}
          </span>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={clearSelection} className="w-full">
        Limpiar
      </Button>
    </div>
  )
}
