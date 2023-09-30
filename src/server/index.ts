import prisma from "@/db";
import { z } from "zod";
import { router, publicProcedure } from "./trpc";
import * as bycrypt from "bcrypt";
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
      const userQueriedWEmail = await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });
      if (userQueriedWEmail)
        return {
          error: "User with this email already exists",
        };
      const userQueriedWUsername = await prisma.user.findUnique({
        where: {
          username: input.username,
        },
      });
      if (userQueriedWUsername)
        return {
          error: "User with this username already exists",
        };
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
        return user;
      } catch (error) {
        console.log(error);
        return {
          error: "Something went wrong. Please try again later",
        };
      }
    }),
});

export type AppRouter = typeof appRouter;
