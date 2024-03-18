import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { createWordSchema } from "@/src/lib/zod-schemas";
import { eq } from "drizzle-orm";
import { words } from "@/db/schema/words";
import { InsertMeaning, meanings } from "@/db/schema/meanings";
import { roots } from "@/db/schema/roots";
import { meaningAttributes } from "@/db/schema/meaning_attributes";
import { authors } from "@/db/schema/authors";
import { MeaningInputs, WordForm } from "@/types";
const CreateWordSchema = z.ZodType<WordForm>
export const adminRouter = createTRPCRouter({
  // deleteWord: adminProcedure
  //   .input(
  //     z.object({
  //       id: z.number(),
  //     })
  //   )
  //   .mutation(async ({ input: { id }, ctx: { db, session } }) => {
  //     try {
  //       await db.delete(words).where(eq(words.id, id));
  //     } catch (error) {
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "Something went wrong",
  //       });
  //     }
  //   }),
  // createWord: adminProcedure
  //   .input(createWordSchema)
  //   .mutation(async ({ ctx: { db }, input: { word } }) => {
  //     // todo
  //   }),

  addWord: adminProcedure.input(z.object({
    name: z.string(),
    language: z.string().optional(),
    phonetic: z.string().optional(),
    root: z.string(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    requestType: z.string().optional(),
    meanings: z.array(z.object({
      meaning: z.string(),
      partOfSpeech: z.string(),
      attributes: z.string().optional(),
      example: z.object({
        sentence: z.string().optional(),
        author: z.string().optional()
      }),
      imageUrl: z.string().optional()
    }
    ))
  })
  ).mutation(async ({ ctx: { db }, input }) => {
    // const word = await db.insert(words).values(input).execute();
    // return word;
    console.log(input)
    return null;
  }),
  checkWord: adminProcedure
    .input(z.string())
    .query(async ({ ctx: { db }, input: wordInput }) => {
      const word = await db
        .select({ id: words.id })
        .from(words)
        .where(eq(words.name, wordInput));
      return {
        wordAlreadyExists: word.length > 0,
      };
    }),
  getMeaningAttributes: adminProcedure.query(async ({ ctx: { db } }) => {
    const attributes = await db.select().from(meaningAttributes)
    return attributes
  }),
  getExampleSentenceAuthors: adminProcedure.query(async ({ ctx: { db } }) => {
    const authorsData = await db.select({
      id: authors.id,
      name: authors.name
    }).from(authors)
    return authorsData
  })
});
