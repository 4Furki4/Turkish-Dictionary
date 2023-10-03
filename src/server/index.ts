import prisma from "@/db";
import { z } from "zod";
import { router, publicProcedure } from "./trpc";
import * as bycrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import nodemailler from "nodemailer";
import { render } from "@react-email/render";
import { PasswordResetEmail } from "@/components/customs/PasswordResetEmail";
export const appRouter = router({
  helloWorld: publicProcedure.query(() => {
    return "Hello World!";
  }),
  /**
   * Get all words from database with pagination
   */
  getWords: publicProcedure
    .input(
      z.object({
        take: z.number().optional().default(5),
        skip: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      return await prisma.word.findMany({
        take: input.take,
        skip: input.skip,
        include: { meanings: true },
      });
    }),
  /**
   * Get a word by name quering the database
   */
  getWord: publicProcedure
    .input(
      z.string({
        invalid_type_error: "Word must be a string",
        required_error: "Word is required to get a word",
      })
    )
    .query(async ({ input }) => {
      const words = await prisma.word.findMany({
        where: {
          name: input,
        },
        include: {
          meanings: true,
        },
      });
      return words || "Not found any word";
    }),
  /**
   * Get a word by id quering the database
   * @param input string mongo id
   */
  getSavedWords: publicProcedure.input(z.string()).query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: {
        email: input,
      },
    });
    if (!user)
      return {
        error: "User not found",
      };
    const savedWords = await prisma.word.findMany({
      where: {
        id: {
          in: user.savedWordIds,
        },
      },
      include: {
        meanings: true,
      },
    });
    return savedWords;
  }),
  /**
   * Save a word to user's saved word list
   */
  saveWord: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        wordId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: input.userId,
        },
      });
      if (!user)
        return {
          error: "User not found",
        };
      const savedWords = await prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          savedWordIds: {
            push: input.wordId,
          },
        },
      });
      return savedWords;
    }),
  createUser: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const userQueriedWUsername = await prisma.user.findUnique({
        where: {
          username: input.username,
        },
      });
      console.log(userQueriedWUsername);
      if (userQueriedWUsername)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this username already exists",
        });
      const userQueriedWEmail = await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });
      if (userQueriedWEmail)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this email already exists",
        });
      try {
        const hashedPassword = await bycrypt.hash(input.password, 10);
        const user = await prisma.user.create({
          data: {
            name: input.name,
            email: input.email,
            username: input.username,
            password: hashedPassword,
          },
        });
        return {
          email: user.email,
          name: user.name,
          username: user.username,
        };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  createUniqueForgotPasswordLink: publicProcedure
    .input(
      z.object({
        email: z.string({
          invalid_type_error: "Email must be a string",
          required_error: "Email is required to get a reset link",
        }),
        locale: z.string().optional().default("en"),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });
      if (!user)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this email does not exist",
        });
      if (user && !user.password)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User created with google auth",
        });
      const payload = {
        email: user.email,
        id: user.id,
      };
      const secret = process.env.NEXTAUTH_SECRET! + user.password;
      const token = jwt.sign(payload, secret, {
        expiresIn: "30m",
      });
      const link = `${process.env.NEXT_PUBLIC_URL}/${input.locale}/reset-password/${user.id}?token=${token}`;
      const transporter = nodemailler.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.NODEMAIL_EMAIL,
          pass: process.env.NODEMAIL_PASSWORD,
        },
      });
      const emailHtml = render(
        PasswordResetEmail({ link: link, name: user.name })
      );
      await new Promise((resolve, reject) => {
        // send mail
        transporter.sendMail(
          {
            from: process.env.NODEMAIL_EMAIL,
            to: user.email,
            subject: "Reset password link | Turkish Dictionary",
            html: emailHtml,
          },
          (err, info) => {
            if (err) {
              console.error(err);
              reject(err);
            } else {
              console.log(info);
              resolve(info);
            }
          }
        );
      });
    }),
  verifyResetPasswordToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let user;
      try {
        user = await prisma.user.findUnique({
          where: {
            id: input.id,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid token or user does not exist",
        });
      }
      if (!user)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid token or user does not exist",
        });
      if (user && !user.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User created with google auth",
        });
      }
      try {
        const payload = jwt.verify(
          input.token,
          process.env.NEXTAUTH_SECRET! + user.password
        );
        return payload;
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid token or user does not exist",
        });
      }
    }),
  resetPassword: publicProcedure
    .input(
      z.object({
        id: z.string(),
        newPassword: z.string(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!user)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid token or user does not exist",
        });
      if (user && !user.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User created with google auth",
        });
      }
      try {
        const payload = jwt.verify(
          input.token,
          process.env.NEXTAUTH_SECRET! + user.password
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid token or user does not exist",
        });
      }
      const isPasswordSame = await bycrypt.compare(
        input.newPassword,
        user.password!
      );
      if (isPasswordSame) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New password cannot be same as old password",
        });
      }
      const newHashedPassword = await bycrypt.hash(input.newPassword, 10);
      await prisma.user.update({
        where: {
          id: input.id,
        },
        data: {
          password: newHashedPassword,
        },
      });
      return {
        message: "Password changed successfully",
      };
    }),
});

export type AppRouter = typeof appRouter;
