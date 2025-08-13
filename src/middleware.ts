import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

type Rule = {
  pattern: RegExp;
  anyOf?: string[]; // basta con tener uno
  allOf?: string[]; // requiere todos
};

const rules: Rule[] = [
  // Empleado
  { pattern: /^\/page\/profile(?:\/.*)?$/, anyOf: ["EMPLOYEE:PROFILE"] },
  { pattern: /^\/page\/vacations-permits(?:\/.*)?$/, anyOf: ["EMPLOYEE:PERMITS"] },

  // RRHH
  { pattern: /^\/page\/dashboard(?:\/.*)?$/, anyOf: ["RRHH:DASHBOARD"] },

  // TI
  { pattern: /^\/page\/admin(?:\/.*)?$/, anyOf: ["ADMIN:VIEW"] },

  // Jefe
  { pattern: /^\/page\/applications(?:\/.*)?$/, anyOf: ["BOSS:APPLICATIONS"] },
];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  const publicRoutes = ['/page/landing', '/page/login'];
  const protectedRoutes = [
    '/page/admin',
    '/page/profile',
    '/page/applications',
    '/page/vacations-permits',
    '/page/dashboard'
  ];

  const isPublic = (path: string) => publicRoutes.includes(path);
  const matchRule = (path: string) => rules.find(r => r.pattern.test(path));
  const hasAny = (perms: string[], anyOf?: string[]) =>
    !anyOf || anyOf.some(p => perms.includes(p));
  const hasAll = (perms: string[], allOf?: string[]) =>
    !allOf || allOf.every(p => perms.includes(p));

  console.log("🔹 Middleware ejecutado");
  console.log("📍 Pathname:", pathname);
  console.log("🔑 Token presente:", !!token);
  console.log("👤 Permisos del usuario:", (token as any)?.permissions ?? []);

  // Ruta pública con usuario autenticado → redirigir
  if (token && isPublic(pathname)) {
    console.log("➡️ Usuario autenticado intentando acceder a ruta pública:", pathname);
    return NextResponse.redirect(new URL('/page/profile', req.url));
  }

  // Ruta protegida sin usuario autenticado → redirigir a login
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    console.log("🚫 Usuario NO autenticado intentando acceder a ruta protegida:", pathname);
    return NextResponse.redirect(new URL('/page/login', req.url));
  }

  // Validar permisos para rutas con reglas específicas
  const rule = matchRule(pathname);
  console.log("MI PATH NAME",pathname)
  if (rule) {
    
    console.log("📜 Regla encontrada para la ruta:", rule);
    const userPerms: string[] = ((token as any)?.permissions) ?? [];
    const allowed = hasAny(userPerms, rule.anyOf) && hasAll(userPerms, rule.allOf);
    console.log("✅ Cumple permisos:", allowed);

    if (!allowed) {
      console.log("❌ Usuario SIN permisos necesarios para acceder:", pathname);
      return NextResponse.redirect(new URL("/page/forbiden", req.url));
    } else {
      console.log("✅ Usuario autorizado para acceder:", pathname);
    }
  } else {
    console.log("ℹ️ No existe regla definida para esta ruta:", pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/page/:path*'],
};
