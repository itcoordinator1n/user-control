"use client";  // ✅ Esto permite usar React Context en Next.js

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children, session }: { children: React.ReactNode, session?: any }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}