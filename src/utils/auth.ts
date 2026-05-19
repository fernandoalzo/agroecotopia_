import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/backend/db/prisma";
import { authService } from "@/backend/modules/auth";
import { headers } from "next/headers";

import { config, getRequiredConfig } from "@/config/config";

/**
 * Auth.js configuration — Central auth engine.
 *
 * Strategy: JWT (stateless, no DB sessions needed for OAuth).
 * Adapter: Prisma (persists User & Account records on first login).
 *
 * To add future providers (GitHub, Facebook), simply import them
 * and add to the `providers` array below.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/v1/auth",
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: getRequiredConfig(config.auth.google.clientId, "GOOGLE_CLIENT_ID"),
      clientSecret: getRequiredConfig(config.auth.google.clientSecret, "GOOGLE_CLIENT_SECRET"),
      checks: ["state"],
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await authService.verifyCredentials(
          credentials.email as string,
          credentials.password as string
        );

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Attach the DB user ID to the JWT so it's available everywhere.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    /**
     * Expose user ID, email, name, and role on the client-side session object.
     */
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    /**
     * Dynamically resolve the absolute redirect URL in production environments.
     * Prevents localhost fallback by trusting x-forwarded headers behind reverse proxies.
     */
    async redirect({ url, baseUrl }) {
      let realBaseUrl = baseUrl;
      try {
        const headersList = await headers();
        const host = headersList.get("x-forwarded-host") || headersList.get("host");
        const proto = headersList.get("x-forwarded-proto") || "https";
        if (host) {
          realBaseUrl = `${proto}://${host}`;
        }
      } catch (e) {
        // Fallback during static build/generation if headers are unavailable
      }

      if (url.startsWith("/")) {
        return `${realBaseUrl}${url}`;
      }
      
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl || urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
          return `${realBaseUrl}${urlObj.pathname}${urlObj.search}`;
        }
      } catch (e) {
        // Ignore invalid URLs
      }

      return url;
    },
  },
  pages: {
    // You can customize these in the future:
    // signIn: "/auth/login",
    // error: "/auth/error",
  },
});
