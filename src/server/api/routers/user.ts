import { count, eq, sql } from "drizzle-orm";
import { adminProcedure, createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { SavedWordsResult, WordSearchResult } from "@/types";
import { savedWords } from "@/db/schema/saved_words";
import { rolesEnum, users } from "@/db/schema/users";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getSavedWords: protectedProcedure.input(z.object({
    search: z.string().optional().default(""),
    sortAlphabet: z.enum(["az", "za"]).default("az"),
    sortDate: z.enum(["dateAsc", "dateDesc"]).default("dateAsc"),
    sortBy: z.enum(["alphabet", "date"]).default("date"),
    take: z.number().optional().default(10),
    skip: z.number().optional().default(0),
  })).query(async ({ ctx: { session, db }, input: { search, sortAlphabet, sortDate, sortBy, take, skip } }) => {
    console.log('sordDate', sortDate);
    const alphabetOrder =
      sortAlphabet === "az"
        ? sql`w.name ASC`
        : sortAlphabet === "za"
          ? sql`w.name DESC`
          : sql``;
    const dateOrder =
      sortDate === "dateAsc"
        ? sql`sw."createdAt" ASC`
        : sortDate === "dateDesc"
          ? sql`sw."createdAt" DESC`
          : sql``;
    const primaryOrder = sortBy === "alphabet" ? alphabetOrder : dateOrder;
    const secondaryOrder = sortBy === "alphabet" ? dateOrder : alphabetOrder;
    const searchClause = search ? sql`AND w.name ILIKE ${'%' + search + '%'}` : sql``;
    const userWithSavedWords = (await db.execute(sql`
    SELECT
    JSON_BUILD_OBJECT(
      'word_id',
      w.id,
      'word_name',
      w.name,
      'saved_at',
      sw."createdAt",
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
      JSON_BUILD_OBJECT('root', r.root, 'language', l.language_en)
    ) AS word_data
  FROM
    users u
    INNER JOIN saved_words sw ON u.id = sw.user_id
    LEFT JOIN words w ON sw.word_id = w.id
    LEFT JOIN roots r ON r.word_id = w.id
    LEFT JOIN languages l ON r.language_id::integer = l.id
  WHERE
    u.id = ${session.user.id} 
    ${searchClause}
    GROUP BY
    w.id,
    w.name,
    r.root,
    l.language_en,
    sw."createdAt" 
    ORDER BY
    ${primaryOrder},
    ${secondaryOrder}
    LIMIT ${take}
    OFFSET ${skip};
    `)) as SavedWordsResult[];
    console.log('userWithSavedWords', userWithSavedWords)
    return userWithSavedWords.length > 0 ? userWithSavedWords : [];
  }),
  getSavedWordCount: protectedProcedure.input(z.object({
    search: z.string().optional().default(""),
  })).query(async ({ ctx: { session, db }, input: { search } }) => {
    const searchClause = search ? sql`AND w.name ILIKE ${'%' + search + '%'}` : sql``;
    const result = await db.execute(sql`
      SELECT COUNT(*) AS count
      FROM saved_words sw
      JOIN words w ON sw.word_id = w.id
      WHERE sw.user_id = ${session.user.id}
      ${searchClause};
    `) as { count: number }[];
    return Number(result[0]?.count ?? 0);
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
  }),
  getProfile: publicProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx: { db }, input: { userId } }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
        }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      return user;
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      username: z.string().min(3),
      name: z.string().min(2),
    }))
    .mutation(async ({ ctx: { db, session }, input }) => {
      // Check if username is taken by another user
      const existingUser = await db.query.users.findFirst({
        where: sql`username = ${input.username} AND id != ${session.user.id}`,
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username is already taken"
        });
      }

      const updateData = {
        username: input.username,
        name: input.name,
      };

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, session.user.id));

      return { success: true };
    }),
});
