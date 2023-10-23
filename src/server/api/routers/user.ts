import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
export const userRouter = createTRPCRouter({
  /**
   * Get a word by id quering the database
   * @param input string mongo id
   */
  getSavedWords: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session.user;
    const user = await ctx.db.user.findUnique({
      where: {
        email: session.email!,
      },
    });
    const savedWords = await ctx.db.word.findMany({
      where: {
        id: {
          in: user?.savedWordIds,
        },
      },
      include: {
        meanings: true,
      },
    });
    return savedWords;
  }),
  getWordSaveStatus: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const session = ctx.session.user;
      const user = await ctx.db.user.findUnique({
        where: {
          id: session.id!,
        },
      });
      const savedWords = await ctx.db.user.findFirst({
        where: {
          id: session.id!,
        },
      });
      return savedWords?.savedWordIds?.includes(input) ?? false;
    }),
  /**
   * Save a word to user's saved word list
   */
  saveWord: protectedProcedure
    .input(
      z.object({
        wordId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = ctx.session.user;
      console.log(session);
      const user = await ctx.db.user.findUnique({
        where: {
          id: session.id!,
        },
      });
      if (user?.savedWordIds?.includes(input.wordId)) {
        console.log("word_id", input.wordId);
        const savedWords = await ctx.db.user.update({
          where: {
            email: user.email!,
          },
          data: {
            savedWordIds: {
              set: user.savedWordIds.filter(
                (wordId) => wordId !== input.wordId
              ),
            },
          },
        });
        return savedWords;
      }
      const savedWords = await ctx.db.user.update({
        where: {
          email: session.email!,
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
