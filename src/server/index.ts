import prisma from "@/db";
import { router, publicProcedure } from "./trpc";
export const appRouter = router({
  helloWorld: publicProcedure.query(() => {
    return "Hello World!";
  }),
  getWords: publicProcedure.query(async () => {
    return await prisma.word.findMany({ include: { meanings: true } });
  }),
});

export type AppRouter = typeof appRouter;
