import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireDb } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/passwords";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function getSuperadminEmails(): Set<string> {
  const raw = process.env.SUPERADMIN_EMAILS ?? process.env.SUPERADMIN_EMAIL ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getAdapter() {
  if (!process.env.DATABASE_URL) return undefined;
  return DrizzleAdapter(requireDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });
}

export const authConfig: NextAuthConfig = {
  adapter: getAdapter(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const database = requireDb();
        const email = parsed.data.email.toLowerCase();
        const [user] = await database
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase();
      const superadminEmails = getSuperadminEmails();

      if (account?.provider === "google") {
        const database = requireDb();
        const [existing] = await database
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing?.role === "superadmin") {
          return superadminEmails.has(email);
        }

        if (existing) return true;

        // New Google users default to owner (shop created in onboarding)
        return true;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role =
          "role" in user && user.role
            ? user.role
            : await fetchUserRole(user.id!);
      }

      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const database = requireDb();
      const superadminEmails = getSuperadminEmails();
      const email = user.email?.toLowerCase() ?? "";

      if (superadminEmails.has(email)) {
        await database
          .update(users)
          .set({ role: "superadmin" })
          .where(eq(users.id, user.id));
      }

      const { userPreferences } = await import("@/lib/db/schema");
      await database
        .insert(userPreferences)
        .values({ userId: user.id })
        .onConflictDoNothing();
    },
  },
};

async function fetchUserRole(userId: string) {
  const database = requireDb();
  const [row] = await database
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.role ?? "owner";
}
