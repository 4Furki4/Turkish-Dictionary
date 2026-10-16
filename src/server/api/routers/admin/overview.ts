import { adminProcedure, createTRPCRouter } from "@/src/server/api/trpc";
import { dashboardLatencyInputSchema, dashboardRangeSchema } from "@/src/server/api/schemas/dashboard";
import { getDashboardOverview } from "@/src/server/dashboard-overview";
import { getDashboardAttention } from "@/src/server/dashboard-attention";
import { getWordQueryLatency } from "@/src/server/word-query-latency";

export const overviewAdminRouter = createTRPCRouter({
  getNeedsAttention: adminProcedure.query(({ ctx }) => getDashboardAttention(ctx.db)),
  getWordQueryLatency: adminProcedure.input(dashboardLatencyInputSchema)
    .query(({ ctx, input }) => getWordQueryLatency(ctx.db, input?.asOf, input?.selection)),
  getDashboardOverview: adminProcedure.input(dashboardRangeSchema.optional())
    .query(({ ctx, input }) => getDashboardOverview(ctx.db, input)),
});
