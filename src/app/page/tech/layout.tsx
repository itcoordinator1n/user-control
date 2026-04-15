'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/tickets/NotificationCenter';
import { PomodoroTimer } from '@/components/tickets/PomodoroTimer';
import { AFKDetector } from '@/components/tickets/AFKDetector';
import { useTimerStore } from '@/hooks/useTimerStore';

const NAV_ITEMS = [
  { href: '/page/tech', label: 'Tablero', icon: LayoutGrid, exact: true },
  { href: '/page/tech/stats', label: 'Mi productividad', icon: BarChart2, exact: false },
];

export default function TechLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRunning = useTimerStore((s) => s.isRunning);

  return (
    <div className="space-y-4">
      {/* AFKDetector invisible — siempre montado */}
      <AFKDetector />

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Timer — visible cuando hay una sesión activa */}
          {isRunning ? (
            <PomodoroTimer />
          ) : (
            <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              Timer inactivo
            </div>
          )}
          <NotificationCenter />
        </div>
      </div>

      {children}
    </div>
  );
}
