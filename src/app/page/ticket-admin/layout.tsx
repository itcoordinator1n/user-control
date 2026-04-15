'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitBranch, Lightbulb, MessageCircle, ListTodo, Brain, BookOpen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/page/ticket-admin/tree',     label: 'Árbol de decisión', icon: GitBranch },
  { href: '/page/ticket-admin/shadow',   label: 'Reglas candidatas', icon: Lightbulb },
  { href: '/page/ticket-admin/whatsapp', label: 'WhatsApp',          icon: MessageCircle },
  { href: '/page/ticket-admin/queues',   label: 'Colas',             icon: ListTodo },
  { href: '/page/ticket-admin/memory',   label: 'Memoria IA',        icon: Brain },
  { href: '/page/ticket-admin/taxonomy', label: 'Taxonomía',         icon: BookOpen },
  { href: '/page/ticket-admin/users',    label: 'Usuarios',          icon: Users },
];

export default function TicketAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] gap-4">
      <aside className="hidden w-52 shrink-0 md:block">
        <nav className="flex flex-col gap-1">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Administración IT
          </p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
