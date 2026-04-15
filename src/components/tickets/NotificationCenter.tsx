'use client';

import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { useNotificationsQuery, useMarkNotificationsRead } from '@/hooks/useTicketQueries';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const { notifications, unreadCount } = useNotificationStore();

  // Carga notificaciones desde API al montar y sincroniza con el store
  useNotificationsQuery();

  const { mutate: markRead } = useMarkNotificationsRead();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markRead('all')}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              No hay notificaciones
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 border-b px-4 py-3 last:border-0',
                  !n.is_read && 'bg-blue-50 dark:bg-blue-950/30'
                )}
              >
                {/* Indicador de no leída */}
                {!n.is_read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}

                <div className={cn('flex-1 min-w-0', n.is_read && 'ml-5')}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="block"
                      onClick={() => !n.is_read && markRead([n.id])}
                    >
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {new Date(n.created_at).toLocaleString('es-SV', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </Link>
                  ) : (
                    <>
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {n.body}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
