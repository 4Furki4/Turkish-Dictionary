import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  DefaultUser,
  User,
  Session,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";
import * as bycrypt from "bcrypt";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema/users";
import { CustomDrizzleAdapter } from "@/db/CustomDrizzleAdapter";
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { accounts } from "@/db/schema/accounts";
import { sessions } from "@/db/schema/session";
import { verificationTokens } from "@/db/schema/verification_tokens";
import { randomUUID } from "crypto";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */

type Role = "user" | "admin" | "moderator";
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
      username: string;
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    id: string;
    role: Role;
    username: string;
  }
}
declare module "next-auth/adapters" {
  export interface AdapterUser {
    role: Role;
  }
}

export const adapter = CustomDrizzleAdapter(db);
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile: GoogleProfile) {
        return {
          id: profile.sub,
          role: profile.role ?? "user",
          image: profile.picture,
          email: profile.email,
          name: profile.name,
          username: profile.email!.split("@")[0],
        };
      },
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log('credentials', credentials)

        if (
          (credentials?.email === undefined &&
            credentials?.username === undefined) || // no email or username
          credentials?.password === undefined || // no password
          (credentials?.password && credentials?.password.length < 8) // password too short
        ) return Promise.resolve(null);

        const userLoggedInWithEmail = credentials?.email !== undefined;
        let user = null;

        if (userLoggedInWithEmail) {
          user = await db.query.users.findFirst({
            where: eq(users.email, credentials?.email),
          });
        }
        user =
          user!!
            ? user
            : await db.query.users.findFirst({
              where: eq(users.username, credentials?.username),
            });

        if (user === undefined) return Promise.resolve(null); // user not found

        if (user.password === undefined) return Promise.resolve(null); // users created with google auth

        const isPasswordValid = await bycrypt.compare(
          credentials?.password!,
          user.password!
        );
        if (!isPasswordValid) return Promise.resolve(null);

        return Promise.resolve(user as User);
      },
    }),
  ],
  callbacks: {
    async session({ session: defaultSession, user }) {
      // Make our own custom session object.
      const session: Session = {
        user,
        expires: defaultSession.expires,
      };

      return session;
    },
    async jwt({ user }) {
      const session = await DrizzleAdapter(db).createSession?.({
        expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
        sessionToken: randomUUID(),
        userId: user.id,
      });

      return { id: session?.sessionToken };
    },
  },
  jwt: {
    async encode({ token }) {
      // This is the string returned from the `jwt` callback above.
      // It represents the session token that will be set in the browser.
      return token?.id as unknown as string;
    },
    async decode() {
      // Disable default JWT decoding.
      // This method is really only used when using the email provider.
      return null;
    },
  },
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 30, // 3 days
  },
  //@ts-ignore
  adapter: DrizzleAdapter(db, {
    accountsTable: accounts,
    usersTable: users,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens
  }),
  pages: {
    signIn: "/signin",
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
