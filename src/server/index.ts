import { router, publicProcedure } from "./trpc";

export const appRouter = router({
  helloWorld: publicProcedure.query(() => {
    return "Hello World!";
  }),
});

export type AppRouter = typeof appRouter;
