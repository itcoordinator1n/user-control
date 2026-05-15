import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { DefaultSession } from "next-auth";
import { jwtDecode} from "jwt-decode";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      permissions: string[];
      platforms: string[];
      platformPermissions: Record<string, string[]>;
      idEmployee?: string | number;
      name?: string | null;
      email?: string | null;
      area?: { name: string; color?: string } | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessToken: string;
    permissions: string[];
    platforms: string[];
    platformPermissions: Record<string, string[]>;
    area: { name: string; color?: string } | null;
    idEmployee: string | number | null;
  }
}

interface Pay  {
      permissions: string[];
      platforms?: string[];
      platformPermissions?: Record<string, string[]>;
      id?: string | number;
      idEmployee?: string | number;
      name?: string | null;
      email?: string | null;
      area?: { name: string; color?: string };
    } 

import { NextAuthOptions } from "next-auth";

// Mapa de permisos → plataforma para inferencia cuando el backend no la envía
const PERMISSION_TO_PLATFORM: Record<string, string> = {
  'RRHH:PERMITS_VIEW':          'permisos',
  'RRHH:PERMITS_REQUEST':       'permisos',
  'EMPLOYEE:PERMITS':           'permisos',
  'RRHH:ADMIN':                 'permisos',
  'RRHH:DASHBOARD':             'permisos',
  'RRHH:APPLICATIONS_MANAGE':   'permisos',
  'BOSS:APPLICATIONS':          'permisos',
  'TICKET:READ':                'tickets',
  'TICKET:CREATE':              'tickets',
  'TICKET:RESPOND':             'tickets',
  'TICKET:ADMIN':               'tickets',
  'TICKET:TECH':                'tickets',
  'TICKET:MGMT':                'tickets',
  'PROD:REGISTER':              'produccion',
  'PROD:VIEW':                  'produccion',
  'PROD:ADMIN':                 'produccion',
  'PRODUCCION:TIEMPOS':         'produccion',
  'USER:CREATE':                'admin',
  'ROLE:VIEW':                  'admin',
  'ADMIN:VIEW':                 'admin',
  'METRICS:GENERAL':            'permisos',
};

function inferPlatforms(permissions: string[]): string[] {
  const platforms = new Set<string>();
  for (const perm of permissions) {
    const plat = PERMISSION_TO_PLATFORM[perm];
    if (plat) platforms.add(plat);
  }
  return Array.from(platforms);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`;
        const options = {
          method: 'POST',
          body: JSON.stringify({ credentials }),
          headers: { "Content-Type": "application/json" }
        };

        const maxRetries = 2;
        let attempt = 0;

        while (attempt <= maxRetries) {
          try {
            const res = await fetch(url, options);
            
            if (!res.ok && res.status >= 500 && attempt < maxRetries) {
               attempt++;
               await new Promise(resolve => setTimeout(resolve, 2000));
               continue;
            }

            const data = await res.json();
            console.log("Acceso en el servidor data:", data);
            
            if (res.ok && data) {
              // El backend puede enviar el usuario anidado en data.user o en la raíz
              const userData = data.user || data;
              return {
                id: userData.id_usuario || userData.id,
                token: data.token,
              };
            }
            
            return null;
            
          } catch (error) {
            console.error(`Error connecting to login API (Attempt ${attempt + 1}):`, error);
            if (attempt < maxRetries) {
              attempt++;
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              return null; 
            }
          }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.id = user.id;
      }

      if (token.accessToken) {
        try {
          const payload: Pay = jwtDecode(token.accessToken as string);
          const rawPermissions: string[] = payload?.permissions ?? [];
          token.permissions = rawPermissions;

          // Plataformas: usar las del payload si existen y no están vacías,
          // de lo contrario inferirlas desde los permisos (workaround backend)
          const rawPlatforms: string[] = payload?.platforms ?? [];
          if (rawPlatforms.length > 0) {
            token.platforms = rawPlatforms;
          } else {
            token.platforms = inferPlatforms(rawPermissions);
            if (token.platforms.length > 0) {
              console.log(">>> [NextAuth] Plataformas inferidas:", token.platforms);
            }
          }

          // platformPermissions: normalizar clave "_global" a cada plataforma inferida
          const rawPlatformPerms: Record<string, string[]> = payload?.platformPermissions ?? {};
          const globalPerms: string[] = rawPlatformPerms['_global'] ?? [];

          if (globalPerms.length > 0) {
            // El backend usa "_global" → mapear a cada plataforma
            const normalized: Record<string, string[]> = {};
            for (const plat of token.platforms as string[]) {
              normalized[plat] = globalPerms;
            }
            token.platformPermissions = normalized;
            console.log(">>> [NextAuth] platformPermissions normalizado:", normalized);
          } else {
            token.platformPermissions = rawPlatformPerms;
          }

          token.area = payload?.area ?? null;
          token.idEmployee = payload?.idEmployee ?? null;
          if (payload.name) token.name = payload.name;
          if (payload.email) token.email = payload.email;
          if (payload.id) token.id = payload.id.toString();
        } catch (error) {
          console.error("Error decoding JWT in callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.accessToken = token.accessToken as string;
        session.user.permissions = (token.permissions as string[]) || [];
        session.user.platforms = (token.platforms as string[]) || [];
        session.user.platformPermissions = (token.platformPermissions as Record<string, string[]>) || {};
        session.user.area = (token.area as { name: string; color?: string } | null) ?? null;
        session.user.idEmployee = (token.idEmployee as string | number | undefined) ?? undefined;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/page/profile`;
    }
  },
  pages: {
    signIn: '/page/profile',
    signOut: '/page/landing',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
