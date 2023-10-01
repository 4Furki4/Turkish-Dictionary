import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/db";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import * as bycrypt from "bcrypt";
import { getToken } from "next-auth/jwt";
const handler = NextAuth({
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
        console.log(credentials);
        let user = await prisma.user.findFirst({
          where: {
            email: credentials?.email,
          },
        });
        console.log("user", user);
        user =
          user !== null
            ? user
            : await prisma.user.findFirst({
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
      const userExist = await prisma.user.findUnique({
        where: {
          email: user.email!,
        },
      });
      if (userExist) {
        return true;
      }
      try {
        await prisma.user.create({
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
    signIn: "/signup",
  },
});

export { handler as GET, handler as POST };
