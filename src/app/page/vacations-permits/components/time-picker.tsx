"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function TimePicker({ value, onChange, placeholder = "Seleccionar hora" }: TimePickerProps) {
  const [hour, setHour] = useState(value?.split(":")[0] || "")
  const [minute, setMinute] = useState(value?.split(":")[1] || "")

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

  const handleHourChange = (newHour: string) => {
    setHour(newHour)
    if (minute && onChange) {
      onChange(`${newHour}:${minute}`)
    }
  }

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute)
    if (hour && onChange) {
      onChange(`${hour}:${newMinute}`)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center space-x-1">
        <Select value={hour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-16">
            <SelectValue placeholder="00" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={minute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-16">
            <SelectValue placeholder="00" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
