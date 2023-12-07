import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { createWordSchema } from "@/src/lib/zod-schemas";
import { eq } from "drizzle-orm";
import { words } from "@/db/schema/words";
import { InsertMeaning, meanings } from "@/db/schema/meanings";
import { roots } from "@/db/schema/roots";
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
      const [wordCreated] = await db
        .insert(words)
        .values({
          name: word.name,
          phonetic: word.phonetics,
          prefix: word.prefix,
          suffix: word.suffix,
        })
        .returning()
        .execute();
      const root = await db
        .insert(roots)
        .values({
          root: word.root,
          language: word.language,
          wordId: wordCreated.id,
        })
        .returning()
        .execute();
      const wordMeanings: InsertMeaning[] = word.meanings.map((meaning) => ({
        meaning: meaning.definition.definition,
        wordId: wordCreated.id,
        imageUrl: meaning.definition.image,
      }));
      await db.insert(meanings).values(wordMeanings).execute();
    }),
});
