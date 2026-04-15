'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GanttChartSquare, FileBarChart, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/page/ticket-mgmt',               label: 'Overview',       icon: LayoutDashboard, exact: true },
  { href: '/page/ticket-mgmt/gantt',          label: 'Gantt',          icon: GanttChartSquare, exact: false },
  { href: '/page/ticket-mgmt/reports',        label: 'Reportes',       icon: FileBarChart, exact: false },
  { href: '/page/ticket-mgmt/interruptions',  label: 'Interrupciones', icon: AlertTriangle, exact: false },
];

export default function TicketMgmtLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b pb-3">
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
      </div>

      {children}
    </div>
  );
}
