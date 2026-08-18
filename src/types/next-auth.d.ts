import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      managerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    managerId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    managerId?: string | null;
  }
}
