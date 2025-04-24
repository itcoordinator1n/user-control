"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  addMonths,
  format,
  isWeekend,
  eachDayOfInterval,
  differenceInCalendarDays,
  isSameDay,
  isWithinInterval,
} from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { DayClickEventHandler } from "react-day-picker"

interface VacationDateSelectorProps {
  availableDays: number
  onSelectionChange?: (selectedDays: Date[]) => void
}

export function VacationDateSelector({ availableDays, onSelectionChange }: VacationDateSelectorProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [workingDaysCount, setWorkingDaysCount] = useState(0)
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle date selection
  const handleSelect: DayClickEventHandler = (day, selected) => {
    if (!day) return

    // If no start date is selected, set it
    if (!startDate) {
      setStartDate(day)
      setEndDate(undefined)
      setSelectedDates([day])
      return
    }

    // If start date is selected but no end date, set end date
    if (startDate && !endDate) {
      // Ensure end date is not before start date
      if (day < startDate) {
        setEndDate(startDate)
        setStartDate(day)
      } else {
        setEndDate(day)
      }
    } else {
      // If both dates are selected, start a new selection
      setStartDate(day)
      setEndDate(undefined)
      setSelectedDates([day])
      return
    }
  }

  // Calculate selected days when start and end dates change
  useEffect(() => {
    if (startDate && endDate) {
      const interval = eachDayOfInterval({ start: startDate, end: endDate })
      setSelectedDates(interval)
    }
  }, [startDate, endDate])

  // Calculate working days count
  useEffect(() => {
    if (selectedDates.length > 0) {
      const workingDays = selectedDates.filter((date) => !isWeekend(date))
      setWorkingDaysCount(workingDays.length)

      if (onSelectionChange) {
        onSelectionChange(workingDays)
      }
    } else {
      setWorkingDaysCount(0)

      if (onSelectionChange) {
        onSelectionChange([])
      }
    }
  }, [selectedDates, onSelectionChange])

  // Navigate to previous month with animation
  const goToPreviousMonth = () => {
    if (isAnimating) return

    setSlideDirection("right")
    setIsAnimating(true)

    setTimeout(() => {
      setCurrentMonth((prevMonth) => addMonths(prevMonth, -1))

      setTimeout(() => {
        setIsAnimating(false)
      }, 300)
    }, 200)
  }

  // Navigate to next month with animation
  const goToNextMonth = () => {
    if (isAnimating) return

    setSlideDirection("left")
    setIsAnimating(true)

    setTimeout(() => {
      setCurrentMonth((prevMonth) => addMonths(prevMonth, 1))

      setTimeout(() => {
        setIsAnimating(false)
      }, 300)
    }, 200)
  }

  // Reset selection
  const resetSelection = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setSelectedDates([])
  }

  // Custom day rendering function
  const dayClassName = (date: Date, currentMonth: Date) => {
    if (!startDate) return ""

    // Check if this is the start date
    if (startDate && isSameDay(date, startDate)) {
      return "bg-primary text-primary-foreground rounded-l-md"
    }

    // Check if this is the end date
    if (endDate && isSameDay(date, endDate)) {
      return "bg-primary text-primary-foreground rounded-r-md"
    }

    // Check if this date is in the range
    if (startDate && endDate && isWithinInterval(date, { start: startDate, end: endDate })) {
      // Weekend days in the range
      if (isWeekend(date)) {
        return "bg-primary/30 text-primary-foreground"
      }
      // Weekdays in the range
      return "bg-primary/50 text-primary-foreground"
    }

    return ""
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Selector de Vacaciones</span>
          <Badge variant="outline" className="ml-2">
            {availableDays} días disponibles
          </Badge>
        </CardTitle>
        <CardDescription>Selecciona un rango de fechas para tus vacaciones</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} disabled={isAnimating}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium text-lg">{format(currentMonth, "MMMM yyyy", { locale: es })}</div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} disabled={isAnimating}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative w-full overflow-hidden">
          <div
            className={cn("transition-all duration-300 ease-in-out transform", {
              "-translate-x-full opacity-0": isAnimating && slideDirection === "left",
              "translate-x-full opacity-0": isAnimating && slideDirection === "right",
              "translate-x-0 opacity-100": !isAnimating,
            })}
          >
            <Calendar
              mode="range"
              selected={{
                from: startDate,
                to: endDate,
              }}
              onDayClick={handleSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border mx-auto"
              classNames={{
                month: "space-y-4",
                caption: "hidden", // Hide the default caption that shows month/year
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex-1",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative flex-1 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md transition-colors",
                ),
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-primary/20 aria-selected:text-foreground",
                day_range_start: "aria-selected:bg-primary aria-selected:text-primary-foreground rounded-l-md",
                day_range_end: "aria-selected:bg-primary aria-selected:text-primary-foreground rounded-r-md",
                day_hidden: "invisible",
              }}
              components={{
                IconLeft: () => null, // Remove default navigation icons
                IconRight: () => null,
              }}
              modifiers={{
                weekend: (date) => isWeekend(date),
              }}
              modifiersClassNames={{
                weekend: "text-muted-foreground",
              }}
            />
          </div>
        </div>

        <div className="mt-6 space-y-2 w-full">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fecha inicio:</span>
            <span className="text-sm">{startDate ? format(startDate, "dd/MM/yyyy") : "No seleccionada"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fecha fin:</span>
            <span className="text-sm">{endDate ? format(endDate, "dd/MM/yyyy") : "No seleccionada"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Días totales:</span>
            <span className="text-sm">
              {startDate && endDate ? differenceInCalendarDays(endDate, startDate) + 1 : 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Días laborables:</span>
            <Badge variant={workingDaysCount > availableDays ? "destructive" : "secondary"}>{workingDaysCount}</Badge>
          </div>
          {workingDaysCount > availableDays && (
            <p className="text-xs text-destructive">Has excedido el número de días disponibles.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetSelection}>
          Limpiar
        </Button>
      </CardFooter>
    </Card>
  )
}
