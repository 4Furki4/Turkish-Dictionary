import prisma from "@/db";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
});

export { handler as GET, handler as POST };
