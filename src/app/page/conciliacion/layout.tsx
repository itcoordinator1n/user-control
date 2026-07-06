'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ScanSearch, GitCompareArrows, PackageMinus, PackagePlus, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/page/conciliacion',                label: 'Resumen',              icon: LayoutDashboard, exact: true },
  { href: '/page/conciliacion/campana',        label: 'Campaña de búsqueda',  icon: ScanSearch },
  { href: '/page/conciliacion/emparejamiento', label: 'Emparejamiento',       icon: GitCompareArrows },
  { href: '/page/conciliacion/candidatos-baja',label: 'Candidatos a baja',    icon: PackageMinus },
  { href: '/page/conciliacion/por-registrar',  label: 'Nuevos por registrar', icon: PackagePlus },
  { href: '/page/conciliacion/importar',       label: 'Importar archivo',     icon: Upload },
];

export default function ConciliacionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] gap-4 p-4">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="sticky top-4 flex flex-col gap-1">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conciliación
          </p>
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(href, exact)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
