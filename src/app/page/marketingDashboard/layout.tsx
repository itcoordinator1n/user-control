'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Target, MessageSquare, Gauge, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/page/marketingDashboard/demanda',       label: 'Demanda',       icon: TrendingUp,    exact: false },
  { href: '/page/marketingDashboard/oportunidades', label: 'Oportunidades', icon: Target,        exact: false },
  { href: '/page/marketingDashboard/experiencia',   label: 'Experiencia',   icon: MessageSquare, exact: false },
  { href: '/page/marketingDashboard/operacion',     label: 'Operación',     icon: Gauge,         exact: false },
  { href: '/page/marketingDashboard/precios',       label: 'Precios',       icon: Tags,          exact: false },
];

export default function MarketingDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 border-b pb-3">
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
