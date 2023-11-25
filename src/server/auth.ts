import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  DefaultUser,
  User,
  Awaitable,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";
import * as bycrypt from "bcrypt";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { CustomDrizzleAdapter } from "@/db/CustomDrizzleAdapter";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      username: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    id: string | undefined;
    role: string | undefined;
    username: string | undefined;
  }
  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
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
          role: profile.role ?? "USER",
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
        if (
          (credentials?.email === undefined &&
            credentials?.username === undefined) || // no email or username
          credentials?.password === undefined || // no password
          (credentials?.password && credentials?.password.length < 8) // password too short
        )
          return Promise.resolve(null);

        let user = null;
        if (credentials?.email !== undefined) {
          user = await db.query.users.findFirst({
            where: eq(users.email, credentials?.email),
          });
        }

        user =
          user !== null
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
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          username: token.username,
        },
      };
    },
    jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          username: user.username,
          role: user.role,
          id: user.id,
        };
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  //@ts-ignore
  adapter,
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
