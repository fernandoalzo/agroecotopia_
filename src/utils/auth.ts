import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/backend/db/prisma";
import { authService } from "@/backend/modules/auth";

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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
  },
  pages: {
    // You can customize these in the future:
    // signIn: "/auth/login",
    // error: "/auth/error",
  },
});
