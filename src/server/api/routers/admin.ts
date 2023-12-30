import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { createWordSchema } from "@/src/lib/zod-schemas";
import { eq } from "drizzle-orm";
import { words } from "@/db/schema/words";
import { InsertMeaning, meanings } from "@/db/schema/meanings";
import { roots } from "@/db/schema/roots";
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
  checkWord: adminProcedure
    .input(z.string())
    .query(async ({ ctx: { db }, input: wordInput }) => {
      const word = await db
        .select({ id: words.id })
        .from(words)
        .where(eq(words.name, wordInput));
      return word.length > 0;
    }),
});
