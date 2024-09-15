import { count, eq, sql } from "drizzle-orm";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { WordSearchResult } from "@/types";
import { savedWords } from "@/db/schema/saved_words";
import { rolesEnum, users } from "@/db/schema/users";
import { TRPCError } from "@trpc/server";
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
  getUsers: adminProcedure.input(
    z.object({
      take: z.number().optional().default(5),
      skip: z.number().optional().default(0),
    })
  ).query(async ({ ctx: { db }, input }) => {
    const users = await db.query.users.findMany({
      limit: input.take,
      offset: input.skip
    })
    return users
  }),
  getUserCount: adminProcedure
    .query(async ({ ctx: { db } }) => {
      const result = await db.select({ count: count() }).from(users);
      return result[0].count
    }),
  getUserRole: adminProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx: { db }, input: { userId } }) => {
      const result = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          role: true
        }
      })
      return result?.role
    }),
  setRole: adminProcedure.input(z.object({
    selectedRole: z.enum(rolesEnum.enumValues),
    userId: z.string()
  })).mutation(async ({ ctx: { db }, input: { userId, selectedRole } }) => {
    const userExist = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })
    if (!userExist) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No user found to change their role! Please make sure a user is provided and try again. If the error persists, please contact the admins or developers."
      })
    }
    try {
      await db.update(users).set({
        role: selectedRole,
      }).where(eq(users.id, userId))
      return {
        message: "The users role is updated!"
      }
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while updating the user's role! Please try again. If the error persists, please contact the admins or developers."
      })
    }
  }),
  deleteUser: adminProcedure.input(z.object({
    userId: z.string()
  })).mutation(async ({ ctx: { db }, input: { userId } }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No user found to delete! Please make sure a user is provided and try again. If the error persists, please contact the admins or developers."
      })
    }
    await db.delete(users).where(eq(users.id, userId))
    return {
      message: "The user is deleted successfully!"
    }
  })
});
