import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  const publicRoutes = ['/', '/login'];
  const protectedRoutes = ['/page/admin', '/page/profile', '/page/applications','/page/vacations-permits','/page/dashboard']; // ← Agrega tus rutas protegidas aquí

  // Si el usuario tiene sesión y quiere entrar a una ruta pública → redirige a /page/admin
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/page/admin', req.url));
  }

  // Si el usuario NO tiene sesión y trata de acceder a una ruta protegida → redirige al inicio
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

// Aplica el middleware a todas las rutas necesarias
export const config = {
  matcher: ['/', '/login', '/page/:path*'], // ← Aplica a todas las rutas relevantes
};
