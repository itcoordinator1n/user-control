import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Tickets | Soporte IT',
};

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
