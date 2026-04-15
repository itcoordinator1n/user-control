'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/page/ticket-admin/tree');
  }, [router]);

  return null;
}
