import { sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { WordSearchResult } from "@/types";
import { savedWords } from "@/db/schema/saved_words";
export const userRouter = createTRPCRouter({
  getSavedWords: protectedProcedure.query(async ({ ctx: { session, db } }) => {
    const userWithSavedWords = await db.execute(sql`
    SELECT
    JSON_BUILD_OBJECT(
      'word_id',
      w.id,
      'word_name',
      w.name,
      'attributes',
      (
        SELECT
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'attribute_id',
              w_a.id,
              'attribute',
              w_a.attribute
            )
          )
        FROM
          words_attributes ws_a
          JOIN word_attributes w_a ON ws_a.attribute_id = w_a.id
        WHERE
          ws_a.word_id = w.id
      ),
      'root',
      JSON_BUILD_OBJECT('root', r.root, 'language', l.language_en),
      'meanings',
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'meaning_id',
          m.id,
          'meaning',
          m.meaning,
          'part_of_speech',
          pos.part_of_speech
        )
      )
    ) AS word_data
  FROM
    users u
    LEFT JOIN saved_words sw ON u.id = sw.user_id
    LEFT JOIN words w ON sw.word_id = w.id
    LEFT JOIN meanings m ON w.id = m.word_id
    LEFT JOIN part_of_speechs pos ON m.part_of_speech_id = pos.id
    LEFT JOIN roots r ON r.word_id = w.id
    LEFT JOIN languages l ON r.language_id::integer = l.id
  WHERE
    u.id = ${session.user.id}
  GROUP BY
    w.id,
    w.name,
    r.root,
    l.language_en;
    `) as WordSearchResult[]
    return userWithSavedWords
  }),
  getWordSaveStatus: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx: { session, db } }) => {
      const result = await db.execute(
        sql`
        SELECT
          *
        FROM
          saved_words
          WHERE
          user_id = ${session.user.id}
          AND word_id = ${input}
        `
      )
      if (result.length > 0) {
        return true
      }
      return false
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      try {
        const savedWord = await db.insert(savedWords).values({
          userId: session.user.id,
          wordId: input.wordId,
        }).returning().execute()
      } catch (error) {
        await db.delete(savedWords).where(sql`user_id = ${session.user.id} AND word_id = ${input.wordId}`).execute()
        return false
      }
      return true
    }),
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
  // return
});
