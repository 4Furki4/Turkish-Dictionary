// Example: Add to src/server/api/routers/health.ts (or similar)
import { publicProcedure, createTRPCRouter } from '../trpc';
import { db } from '@/db';
import { words } from '@/db/schema/words'; // Use your actual schema

export const healthRouter = createTRPCRouter({
    warmup: publicProcedure
        .query(async () => {
            try {
                // Perform a very simple query to keep DB warm
                await db.select({ id: words.id }).from(words).limit(1);
                return { status: 'ok', timestamp: new Date().toISOString() };
            } catch (error: any) {
                console.error("Warm-up query failed:", error);
                return { status: 'error', error: error.message };
            }
        }),
});
// Remember to merge healthRouter into your main appRouter