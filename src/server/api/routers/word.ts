import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";
import { eq } from "drizzle-orm";
import { words } from "@/db/schema/words";
import { meanings } from "@/db/schema/meanings";

export const wordRouter = createTRPCRouter({
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
    .query(async ({ input, ctx: { db } }) => {
      const wordsWithMeanings = await db.select().from(words).fullJoin(meanings, eq(words.id, meanings.wordId)).limit(input.take).offset(input.skip)
      return wordsWithMeanings
      // console.log(wordsWithMeanings)
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
    .query(async ({ input: name, ctx: { db } }) => {
      //TODO
    }),
});
