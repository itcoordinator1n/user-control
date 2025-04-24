import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken: string;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const res = await fetch("http://localhost:3000/api/auth/login", {
          method: 'POST',
          body: JSON.stringify({ credentials }),
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
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
      return token;
    },
    async session({ session, token }) {
      if (session) {
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      // En lugar de redirigir a /page/admin, se recarga la página actual
      return baseUrl;
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    // error: '/auth/error',
  }
});

export { handler as GET, handler as POST };
