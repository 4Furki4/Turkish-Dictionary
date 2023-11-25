import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { createWordSchema } from "@/src/lib/zod-schemas";
import { InsertMeaning, meanings, words } from "@/db/schema";
import { eq } from "drizzle-orm";
export const adminRouter = createTRPCRouter({
  deleteWord: adminProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input: { id }, ctx: { db, session } }) => {
      try {
        await db.delete(words).where(eq(words.id, id));
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
          cause: error,
        });
      }
    }),
  createWord: adminProcedure
    .input(createWordSchema)
    .mutation(async ({ ctx: { db }, input: { word } }) => {
      const wordCreated = await db
        .insert(words)
        .values({
          name: word.name,
          phonetic: word.phonetics,
          attributes: word.attributes,
          related_phrases: word.relatedPhrases,
          related_words: word.relatedWords,
          root: word.root,
          audioUrl: word.audio,
        })
        .returning()
        .execute();
      const wordMeanings: InsertMeaning[] = word.meanings.map((meaning) => ({
        definition: meaning.definition.definition,
        partOfSpeech: meaning.partOfSpeech,
        wordId: wordCreated[0].id,
        attributes: meaning.attributes,
        exampleSentece: meaning.definition.example?.sentence,
        exampleSentenceAuthor: meaning.definition.example?.author,
        imageUrl: meaning.definition.image,
      }));
      await db.insert(meanings).values(wordMeanings).execute();
    }),
});
