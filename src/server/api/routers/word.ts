import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const wordRouter = createTRPCRouter({
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
    .query(async ({ input, ctx }) => {
      return await ctx.db.word.findMany({
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
    .query(async ({ input, ctx }) => {
      const words = await ctx.db.word.findMany({
        where: {
          name: input,
        },
        include: {
          meanings: true,
        },
      });
      return words || "Word not found";
    }),
  /**
   * Get a word by id quering the database
   * @param input string mongo id
   */
  getSavedWords: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          email: input,
        },
      });
      if (!user)
        return {
          error: "User not found",
        };
      const savedWords = await ctx.db.word.findMany({
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
  saveWord: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        wordId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          id: input.userId,
        },
      });
      if (!user)
        return {
          error: "User not found",
        };
      const savedWords = await ctx.db.user.update({
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
});
