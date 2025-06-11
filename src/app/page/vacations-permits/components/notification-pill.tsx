"use client"

import { Badge } from "@/components/ui/badge"

interface NotificationPillProps {
  count: number
}

export function NotificationPill({ count }: NotificationPillProps) {
  if (count === 0) return null

  return (
    <Badge
      variant="destructive"
      className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  )
}
