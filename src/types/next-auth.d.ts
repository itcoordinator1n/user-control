import { Usuario } from "./user"; // Ruta correcta a tu archivo de tipos
import { JWT } from "next-auth/jwt"
import NextAuth, { DefaultSession, User } from 'next-auth';

export interface CustomAuthUser extends User {
    id: number;
    token: string;
    permissions: string[];
    platforms: string[];
    platformPermissions: Record<string, string[]>;
}

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: CustomAuthUser;
        token: string;
    }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: CustomAuthUser;
  }
}