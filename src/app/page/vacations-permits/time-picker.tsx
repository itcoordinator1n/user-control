"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface TimePickerDemoProps {
  setTime: (time: string) => void
  label?: string
}

export function TimePickerDemo({ setTime, label }: TimePickerDemoProps) {
  const [hours, setHours] = React.useState("09")
  const [minutes, setMinutes] = React.useState("00")

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value === "") {
      setHours("00")
      return
    }

    const numValue = Number.parseInt(value, 10)
    if (numValue > 23) {
      value = "23"
    } else if (value.length === 1) {
      value = "0" + value
    }

    setHours(value)
    setTime(`${value}:${minutes}`)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value === "") {
      setMinutes("00")
      return
    }

    const numValue = Number.parseInt(value, 10)
    if (numValue > 59) {
      value = "59"
    } else if (value.length === 1) {
      value = "0" + value
    }

    setMinutes(value)
    setTime(`${hours}:${value}`)
  }

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="text"
        inputMode="numeric"
        value={hours}
        onChange={handleHoursChange}
        className="w-12 text-center"
        maxLength={2}
      />
      <span className="text-sm">:</span>
      <Input
        type="text"
        inputMode="numeric"
        value={minutes}
        onChange={handleMinutesChange}
        className="w-12 text-center"
        maxLength={2}
      />
    </div>
  )
}

