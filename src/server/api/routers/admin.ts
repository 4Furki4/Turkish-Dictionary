import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import type { Prisma, Word } from "@prisma/client";
import { createWordSchema } from "@/src/lib/zod-schemas";
export const adminRouter = createTRPCRouter({
  deleteWord: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input: { id }, ctx: { db, session } }) => {
      try {
        await db.word.delete({
          where: {
            id,
          },
        });
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
    .mutation(async ({ ctx: { db }, input }) => {
      await db.word.create({
        data: {
          name: input.word.name,
          root: input.word.root,
          attributes: input.word.attributes,
          audio: input.word.audio,
          meanings: {
            createMany: {
              data: input.word.meanings.map((meaning) => {
                return {
                  definition: {
                    definition: meaning.definition.definition,
                    example: meaning.definition.example,
                    imageUrl: meaning.definition.image,
                  },
                  partOfSpeech: meaning.partOfSpeech,
                  attributes: meaning.attributes,
                } as Prisma.MeaningCreateInput;
              }),
            },
          },
          prefix: input.word.prefix,
          suffix: input.word.suffix,
          relatedWords: input.word.relatedWords,
          relatedPhrases: input.word.relatedPhrases,
          phonetics: input.word.phonetics,
        },
      });
    }),
});
