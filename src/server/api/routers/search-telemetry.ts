import { wordQueryLatencies } from "@/db/schema/word_query_latencies";
import { wordQueryLatencyInputSchema } from "@/src/lib/word-query-latency-schema";
import { createTRPCRouter, isSearchBot, outcomeTelemetryProcedure, telemetryProcedure } from "@/src/server/api/trpc";
import { searchOutcomeInputSchema } from "@/src/lib/search-outcome-schema";
import { recordSearchOutcome } from "@/src/server/search-outcomes";

export const searchTelemetryRouter = createTRPCRouter({
  recordSearchOutcome: outcomeTelemetryProcedure.input(searchOutcomeInputSchema).mutation(async ({ ctx, input }) => {
    if (isSearchBot(ctx.headers.get("user-agent"))) return { accepted: false as const };
    return recordSearchOutcome(ctx.db, input);
  }),
  recordWordQueryLatency: telemetryProcedure
    .input(wordQueryLatencyInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(wordQueryLatencies).values(input).onConflictDoNothing({
        target: wordQueryLatencies.eventId,
      });
      return { accepted: true as const };
    }),
});
