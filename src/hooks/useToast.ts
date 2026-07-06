/**
 * useToast.ts — Store de notificaciones toast (zustand), sin dependencias extra.
 * Uso: const { toast } = useToast(); toast.success("Guardado"); toast.error("Falló");
 */
'use client';

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (message: string, variant: ToastVariant, duration?: number) => void;
  dismiss: (id: number) => void;
}

let seq = 1;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, variant, duration = 3500) => {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, duration }] }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const push = useToastStore((s) => s.push);
  const toast = {
    success: (m: string) => push(m, 'success'),
    error: (m: string) => push(m, 'error', 5000),
    info: (m: string) => push(m, 'info'),
  };
  return { toast };
}

export { useToastStore };
