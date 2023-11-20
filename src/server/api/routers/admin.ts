import { TRPCError } from "@trpc/server";
import { adminProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import type { Word } from "@prisma/client";
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
    .input(
      z.object({
        word: z.object({
          name: z.string(),
          root: z.string().optional(),
          attributes: z.array(z.string().min(2)),
          audio: z.string().optional(),
          prefix: z.string().optional(),
          suffix: z.string().optional(),
          relatedWords: z.array(z.string().min(2)).optional(),
          relatedPhrases: z.array(z.string().min(2)).optional(),
          meanings: z.array(
            z.object({
              definition: z.object({
                definition: z.string(),
                image: z.string().optional(),
                example: z
                  .object({
                    sentence: z.string(),
                    author: z.string().optional(),
                  })
                  .optional(),
              }),
              partOfSpeech: z
                .enum([
                  "noun",
                  "verb",
                  "adjective",
                  "adverb",
                  "preposition",
                  "conjunction",
                  "interjection",
                ])
                .optional(),
              attributes: z.array(z.string().min(2)).optional(),
            })
          ),
        }),
      })
    )
    .mutation(async ({ ctx: { db } }) => {}),
});
