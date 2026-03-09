import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, familyUsers, families } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      name: string;
      families: {
        familyId: string;
        familyName: string;
        role: string;
        isDefault: boolean;
      }[];
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    families: {
      familyId: string;
      familyName: string;
      role: string;
      isDefault: boolean;
    }[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    families: {
      familyId: string;
      familyName: string;
      role: string;
      isDefault: boolean;
    }[];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email.toLowerCase()))
          .limit(1);

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        // Update last login
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        // Get family memberships
        const memberships = await db
          .select({
            familyId: familyUsers.familyId,
            familyName: families.name,
            role: familyUsers.role,
            isDefault: familyUsers.isDefault,
          })
          .from(familyUsers)
          .innerJoin(families, eq(familyUsers.familyId, families.id))
          .where(eq(familyUsers.userId, user.id));

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          families: memberships.map((m) => ({
            familyId: m.familyId,
            familyName: m.familyName,
            role: m.role,
            isDefault: m.isDefault,
          })),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.families = user.families;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        firstName: token.firstName,
        lastName: token.lastName,
        name: `${token.firstName} ${token.lastName}`,
        families: token.families,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
  // NEXTAUTH_URL is set dynamically via REPLIT_DOMAINS in production
};
