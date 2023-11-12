import { createTRPCRouter, publicProcedure } from "../trpc";
import * as bycrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import nodemailler from "nodemailer";
import { render } from "@react-email/render";
import { PasswordResetEmail } from "@/components/customs/PasswordResetEmail";
import { z } from "zod";
import { adapter } from "../../auth";
export const authRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, { message: "NameLengthError" }),
        username: z.string().min(2, { message: "UsernameLengthError" }),
        email: z.string().email({ message: "EmailInvalidError" }),
        password: z
          .string()
          .min(8, { message: "PasswordLengthError" })
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=\S+$).{8,}$/,
            {
              message: "PasswordPatternErrorMessage",
            }
          ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userQueriedWUsername = await ctx.db.user.findUnique({
        where: {
          username: input.username,
        },
        include: {
          Account: true,
        },
      });
      if (userQueriedWUsername)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this username already exists",
        });
      const userQueriedWEmail = await ctx.db.user.findUnique({
        where: {
          email: input.email,
        },
        include: {
          Account: true,
        },
      });
      if (userQueriedWEmail)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this email already exists",
        });
      try {
        const hashedPassword = await bycrypt.hash(input.password, 10);
        const user = await ctx.db.user.create({
          data: {
            name: input.name,
            email: input.email,
            username: input.username,
            password: hashedPassword,
            role: "USER",
          },
        });
        await adapter.linkAccount!({
          provider: "credentials",
          providerAccountId: user.id,
          userId: user.id,
          type: "email",
        });

        return {
          email: user.email,
          name: user.name,
          username: user.username,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
  createUniqueForgotPasswordLink: publicProcedure
    .input(
      z.object({
        email: z.string().email({ message: "EmailInvalidError" }),
        locale: z.string().optional().default("en"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
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
    .mutation(async ({ input, ctx }) => {
      let user;
      try {
        user = await ctx.db.user.findUnique({
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
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
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
          message: "New password cannot be the same as the old password",
        });
      }
      const newHashedPassword = await bycrypt.hash(input.newPassword, 10);
      await ctx.db.user.update({
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
