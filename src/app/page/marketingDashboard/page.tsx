import { redirect } from 'next/navigation';

/**
 * `/page/marketingDashboard` no tiene contenido propio: el módulo es un conjunto de
 * pestañas (ver `layout.tsx`). Entrar a la raíz manda a la primera, Demanda.
 *
 * Es un `redirect()` temporal y no `permanentRedirect()` a propósito: la pestaña por
 * defecto puede cambiar y no conviene que los navegadores la cacheen con un 308.
 */
export default function MarketingDashboardPage() {
  redirect('/page/marketingDashboard/demanda');
}
