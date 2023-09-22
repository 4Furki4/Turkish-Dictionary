import prisma from "@/db";
import { z } from "zod";
import { router, publicProcedure } from "./trpc";
export const appRouter = router({
  helloWorld: publicProcedure.query(() => {
    return "Hello World!";
  }),
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
    .query(async ({ input }) => {
      return await prisma.word.findMany({
        take: input.take,
        skip: input.skip,
        include: { meanings: true },
      });
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
    .query(async ({ input }) => {
      const words = await prisma.word.findMany({
        where: {
          name: input,
        },
        include: {
          meanings: true,
        },
      });
      return words || "Not found any word";
    }),
});

export type AppRouter = typeof appRouter;
