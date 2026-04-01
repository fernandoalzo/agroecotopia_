import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

/**
 * Module augmentation for `next-auth` types.
 * Allows adding custom properties to the `session` and `user` objects.
 */
declare module "next-auth" {
  interface User {
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      role?: Role;
    } & DefaultSession["user"];
  }
}

import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: Role;
  }
}
