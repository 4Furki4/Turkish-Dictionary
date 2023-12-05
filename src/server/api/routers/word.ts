import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";
import { eq } from "drizzle-orm";
import { words } from "@/db/schema/words";

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
      return await db.query.words
        .findMany({
          limit: input.take,
          offset: input.skip,
          with: {
            meanings: true,
          },
        })
        .execute();
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
      const query = db.query.words.findMany({
        where: eq(words.name, name),
        with: {
          meanings: true,
        },
      });
      console.log(query.toSQL());
      const queriedWords = await query.execute();
      const relatedWordsQuery = await db.query.relatedWords.findMany({
        where: eq(relatedWords.wordId, queriedWords[0].id),
        with: {
          relatedWord: true,
        },
      });
      console.log(relatedWordsQuery);
      return queriedWords || "Word not found";
    }),
});
