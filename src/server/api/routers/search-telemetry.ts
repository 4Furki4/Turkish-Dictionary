import { wordQueryLatencies } from "@/db/schema/word_query_latencies";
import { wordQueryLatencyInputSchema } from "@/src/lib/word-query-latency-schema";
import { createTRPCRouter, telemetryProcedure } from "@/src/server/api/trpc";

export const searchTelemetryRouter = createTRPCRouter({
  recordWordQueryLatency: telemetryProcedure
    .input(wordQueryLatencyInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(wordQueryLatencies).values(input).onConflictDoNothing({
        target: wordQueryLatencies.eventId,
      });
      return { accepted: true as const };
    }),
});
