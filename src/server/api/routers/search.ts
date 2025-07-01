import { createTRPCRouter, publicProcedure } from "@/src/server/api/trpc";
import { z } from "zod";
import { words } from "@/db/schema/words";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const searchRouter = createTRPCRouter({
  getWordId: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const word = await ctx.db.query.words.findFirst({
        where: eq(words.name, input.name),
        columns: {
          id: true,
        },
      });

      if (!word) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Word "${input.name}" not found.`,
        });
      }

      return { wordId: word.id };
    }),
});
