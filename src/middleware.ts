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
  { pattern: /^\/page\/profile(?:\/.*)?$/, anyOf: ["USER:READ", "EMPLOYEE:PROFILE"] },
  { pattern: /^\/page\/vacations-permits(?:\/.*)?$/, anyOf: ["RRHH:PERMITS_VIEW", "EMPLOYEE:PERMITS"] },

  // RRHH
  { pattern: /^\/page\/dashboard(?:\/.*)?$/, anyOf: ["METRICS:GENERAL", "RRHH:ADMIN", "RRHH:DASHBOARD", "dashboard:all:view"] },

  // TI / Admin
  { pattern: /^\/page\/admin(?:\/.*)?$/, anyOf: ["USER:READ", "ROLE:VIEW", "ADMIN:VIEW"] },

  // Jefe / Aplicaciones
  { pattern: /^\/page\/applications(?:\/.*)?$/, anyOf: ["RRHH:APPLICATIONS_MANAGE", "BOSS:APPLICATIONS"] },

  // Tickets — técnico
  { pattern: /^\/page\/tech(?:\/.*)?$/, anyOf: ["TICKET:RESPOND", "TICKET:ADMIN", "TICKET:TECH"] },

  // Tickets — administración IT
  { pattern: /^\/page\/ticket-admin(?:\/.*)?$/, anyOf: ["TICKET:ADMIN"] },

  // Tickets — gerencia
  { pattern: /^\/page\/ticket-mgmt(?:\/.*)?$/, anyOf: ["TICKET:READ", "TICKET:ADMIN", "TICKET:MGMT"] },

  // Produccion
  { pattern: /^\/page\/produccion(?:\/.*)?$/, anyOf: ["PROD:REGISTER", "PROD:VIEW", "PROD:ADMIN", "PRODUCCION:TIEMPOS", "PRODUCCION:REVISION"] },
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
    '/page/dashboard',
    '/page/tickets',
    '/page/tech',
    '/page/ticket-admin',
    '/page/ticket-mgmt',
    '/page/produccion',
  ];

  const isPublic = (path: string) => publicRoutes.includes(path);
  const matchRule = (path: string) => rules.find(r => r.pattern.test(path));
  
  // Helper para validar permisos en una plataforma o de forma global
  const hasPermission = (token: any, perm: string, platform?: string) => {
    if (!token) return false;
    
    // Si se especifica plataforma, buscar ahí primero
    if (platform && token.platformPermissions?.[platform]?.includes(perm)) {
      return true;
    }
    
    // Fallback a permisos globales (compatibilidad)
    return token.permissions?.includes(perm) || false;
  };

  const isAuthorized = (token: any, rule: Rule) => {
    // Determinar la plataforma basándonos en el pathname (ejemplo simple)
    let platform = '';
    if (pathname.startsWith('/page/tickets') || pathname.startsWith('/page/tech') || 
        pathname.startsWith('/page/ticket-admin') || pathname.startsWith('/page/ticket-mgmt')) {
      platform = 'tickets';
    } else if (pathname.startsWith('/page/produccion')) {
      platform = 'produccion';
    } else if (pathname.startsWith('/page/admin')) {
      platform = 'admin';
    } else if (pathname.startsWith('/page/vacations-permits') || pathname.startsWith('/page/dashboard')) {
      platform = 'permisos';
    }

    // Si hay una plataforma detectada, el usuario DEBE tenerla asignada
    if (platform && token.platforms && !token.platforms.includes(platform)) {
      return { authorized: false, reason: 'platform_missing' };
    }

    const perms = token.permissions || [];
    
    if (rule.anyOf) {
      const ok = rule.anyOf.some(p => hasPermission(token, p, platform));
      if (!ok) return { authorized: false, reason: 'permission_missing' };
    }
    
    if (rule.allOf) {
      const ok = rule.allOf.every(p => hasPermission(token, p, platform));
      if (!ok) return { authorized: false, reason: 'permission_missing' };
    }

    return { authorized: true };
  };

  console.log("🔹 Middleware ejecutado:", pathname);

  // Ruta pública con usuario autenticado → redirigir
  if (token && isPublic(pathname)) {
    return NextResponse.redirect(new URL('/page/profile', req.url));
  }

  // Ruta protegida sin usuario autenticado → redirigir a login
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/page/login', req.url));
  }

  // Validar permisos para rutas con reglas específicas
  const rule = matchRule(pathname);
  if (rule && token) {
    const { authorized, reason } = isAuthorized(token, rule);

    if (!authorized) {
      console.log(`❌ Acceso denegado: ${reason} en ${pathname}`);
      // Si falta la plataforma, redirigir a una página específica o forbiden
      const target = reason === 'platform_missing' ? '/page/forbiden' : '/page/forbiden';
      return NextResponse.redirect(new URL(target, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/page/:path*'],
};
