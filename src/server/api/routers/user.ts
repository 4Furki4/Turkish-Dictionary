import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { users } from "@/db/schema/users";
import { savedWords } from "@/db/schema/saved_words";
export const userRouter = createTRPCRouter({
  getSavedWords: protectedProcedure.query(async ({ ctx: { session, db } }) => {
    const userWithSavedWords = await db.query.users
      .findFirst({
        where: eq(users.email, session.user.email!),
        with: {
          savedWords: {
            with: {
              word: {
                with: {
                  meanings: true,
                },
              },
            },
          },
        },
      })
      .execute();
    const savedWords = userWithSavedWords?.savedWords;
    return savedWords;
  }),
  getWordSaveStatus: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx: { session, db } }) => {
      //   const user = await db.query.users
      //     .findFirst({
      //       where: eq(users.id, session.user.id),
      //       with: {
      //         usersToWords: {
      //           where: eq(savedWords.wordId, input),
      //         },
      //       },
      //     })
      //     .execute();
      //   return user?.usersToWords? ? true : false;
    }),
  /**
   * Save a word to user's saved word list
   */
  saveWord: protectedProcedure
    .input(
      z.object({
        wordId: z.number(),
      })
    )
    .mutation(async ({ input, ctx: { session, db } }) => {
      // console.log(session);
      // const user = await db.query.users
      //   .findFirst({
      //     where: eq(users.id, session.user.id),
      //     with: {
      //       usersToWords: {
      //         where: eq(usersToWords.wordId, input.wordId),
      //       },
      //     },
      //   })
      //   .execute();
      // const savedWordIds = user?.usersToWords.map(
      //   (userToWord) => userToWord.wordId
      // );
      // if (savedWordIds?.includes(input.wordId)) {
      //   await db
      //     .delete(usersToWords)
      //     .where(eq(usersToWords.wordId, input.wordId))
      //     .execute();
      //   return;
      // }
      // await db
      //   .insert(usersToWords)
      //   .values({
      //     userId: session.user.id,
      //     wordId: input.wordId,
      //   })
      //   .execute();
      // return;
      return;
    }),
});
