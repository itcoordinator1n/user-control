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

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch("https://infarma.duckdns.org/api/auth/login", {
          method: 'POST',
          body: JSON.stringify({ credentials }),
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        console.log("Acceso en el servidor data:", data)
        if (res.ok && data) {
          return {
            id: data.user.id_usuario,
            token: data.token
          };
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
        const payload:Pay = jwtDecode(token.accessToken as string);;

        token.permissions = payload ? payload.permissions : [];
        // Opcionalmente sobreescribe id con el del token si existe
        // if (id !== undefined && id !== null) token.id = String(id);
        // if (idEmployee !== undefined) token.idEmployee = idEmployee;
        // if (name !== undefined) token.name = name;
        // if (email !== undefined) token.email = email;
        // if (area !== undefined) token.area = area as any;
      }

      return token;
    },
    async session({ session, token }) {
      
      if (session) {
        session.user.accessToken = token.accessToken as string;
        session.user.permissions= (token.permissions as string[]) || []
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
});

export { handler as GET, handler as POST };
