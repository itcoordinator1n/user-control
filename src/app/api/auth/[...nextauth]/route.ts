import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { DefaultSession } from "next-auth";
import { jwtDecode} from "jwt-decode";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      permissions: string[];
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
    area: { name: string; color?: string } | null;
    idEmployee: string | number | null;
  }
}

interface Pay  {
      permissions: string[];
      id?: string | number;
      idEmployee?: string | number;
      name?: string | null;
      email?: string | null;
      area?: { name: string; color?: string };
      // ... cualquier otro claim que venga en tu token
    } 

import { NextAuthOptions } from "next-auth";

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

        const maxRetries = 2; // Intenta hasta 3 veces en total (1 original + 2 reintentos)
        let attempt = 0;

        while (attempt <= maxRetries) {
          try {
            const res = await fetch(url, options);
            
            // Si la respuesta es un error de servidor (5xx) o timeout, podríamos reintentar. 
            // Si es un error 4xx (credenciales inválidas), no reintentamos.
            if (!res.ok && res.status >= 500 && attempt < maxRetries) {
               attempt++;
               await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos antes de reintentar
               continue;
            }

            const data = await res.json();
            console.log("Acceso en el servidor data:", data);
            
            if (res.ok && data) {
              return {
                id: data.user.id_usuario,
                token: data.token
              };
            }
            
            return null; // Credenciales inválidas u otro error controlado
            
          } catch (error) {
            console.error(`Error connecting to login API (Attempt ${attempt + 1}):`, error);
            if (attempt < maxRetries) {
              attempt++;
              await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos si hay error de red
            } else {
              // Si ya superamos los reintentos, devolvemos null para que NextAuth rechace el login
              // En un futuro podrías lanzar un error personalizado para mostrar un mensaje específico en el frontend.
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
          token.permissions = payload?.permissions ?? [];
          token.area = payload?.area ?? null;
          token.idEmployee = payload?.idEmployee ?? null;
          // Asignar nombre y email desde el token para el avatar
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
        session.user.area = (token.area as { name: string; color?: string } | null) ?? null;
        session.user.idEmployee = (token.idEmployee as string | number | undefined) ?? undefined;
        // Propagar nombre y email a la sesión
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      // En lugar de redirigir a /page/admin, se recarga la página actual
      return `${baseUrl}/page/profile`;
    }
  },
  pages: {
    signIn: '/page/profile',
    signOut: '/page/landing',
    // error: '/auth/error',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
