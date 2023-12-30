import { createTRPCRouter } from "@/src/server/api/trpc";
import { wordRouter } from "./routers/word";
import { authRouter } from "./routers/auth";
import { userRouter } from "./routers/user";
import { adminRouter } from "./routers/admin";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // word: wordRouter,
  auth: authRouter,
  // user: userRouter,
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
