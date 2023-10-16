import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
export const userRouter = createTRPCRouter({
  /**
   * Get a word by id quering the database
   * @param input string mongo id
   */
  getSavedWords: protectedProcedure
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
