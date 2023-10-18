import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import GoogleProvider from "next-auth/providers/google";
import * as bycrypt from "bcrypt";

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
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
          user = await db.user.findFirst({
            where: {
              email: credentials?.email,
            },
          });
        }

        user =
          user !== null
            ? user
            : await db.user.findFirst({
                where: {
                  username: credentials?.username,
                },
              });

        if (user === null) return Promise.resolve(null); // user not found

        if (user.password === undefined) return Promise.resolve(null); // users created with google auth

        const isPasswordValid = await bycrypt.compare(
          credentials?.password!,
          user.password!
        );

        if (!isPasswordValid) return Promise.resolve(null);
        return Promise.resolve(user);
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile, email, credentials }) => {
      const userExist = await db.user.findUnique({
        where: {
          email: user.email!,
        },
      });
      if (userExist) {
        return true;
      }
      try {
        await db.user.create({
          data: {
            email: user.email!,
            name: user.name!,
            username: user.email!.split("@")[0],
          },
        });
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  },
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
