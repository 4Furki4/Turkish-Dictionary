import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/db";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
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
        const user = await prisma.user.findUnique({
          where: {
            email: credentials?.email,
          },
        });
        if (user?.password === undefined) return Promise.resolve(null);
        if (user && user.password === credentials?.password) {
          return Promise.resolve(user);
        } else {
          return Promise.resolve(null);
        }
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
