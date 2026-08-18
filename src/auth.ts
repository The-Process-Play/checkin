import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const TPP_EMAIL_DOMAIN = "@theprocessplay.com";

const providers: NextAuthConfig["providers"] = [];

// Only register the real SSO provider once the Azure AD app registration exists —
// an empty issuer/clientId throws on every request otherwise.
if (
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER
) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    })
  );
}

// Dev/test shim: "log in as" any seeded user without a real Microsoft account.
// Gated by an explicit env var (never NODE_ENV alone) so it can be turned on
// for a test/staging deployment without accidentally shipping to a real
// production environment. Role/managerId always come straight from the User row.
if (process.env.NODE_ENV === "development" || process.env.ALLOW_DEV_LOGIN === "true") {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev login (no SSO)",
      credentials: {
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        if (typeof email !== "string" || !email) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        return user ?? null;
      },
    })
  );
}

// Auth.js requires the JWT strategy whenever a Credentials provider is registered,
// so the dev shim forces JWT whenever it's active; a real deployment with only the
// Microsoft SSO provider keeps database sessions so role/managerId changes take
// effect without waiting on token expiry.
const isDev = process.env.NODE_ENV === "development" || process.env.ALLOW_DEV_LOGIN === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: isDev ? "jwt" : "database" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      // Dev credentials logins are already scoped to seeded users; only gate the real SSO path.
      if (account?.provider === "microsoft-entra-id") {
        if (!user.email || !user.email.toLowerCase().endsWith(TPP_EMAIL_DOMAIN)) return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.managerId = user.managerId;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.managerId = token.managerId as string | null;
      } else if (user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.managerId = user.managerId;
      }
      return session;
    },
  },
});
