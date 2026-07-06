'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  icon?: React.ElementType;
  accent?: 'default' | 'emerald' | 'red' | 'amber' | 'purple' | 'sky';
}

const ACCENT: Record<NonNullable<KpiCardProps['accent']>, string> = {
  default: 'text-foreground',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  red: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
  purple: 'text-purple-600 dark:text-purple-400',
  sky: 'text-sky-600 dark:text-sky-400',
};

export function KpiCard({ label, value, hint, href, icon: Icon, accent = 'default' }: KpiCardProps) {
  const inner = (
    <Card className={cn('p-4 transition-colors', href && 'cursor-pointer hover:bg-muted/50')}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && <Icon className={cn('h-4 w-4', ACCENT[accent])} />}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tabular-nums', ACCENT[accent])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}
