import { z } from "zod";
import { normalizeOutcomeQuery, outcomeQuerySchema } from "@/src/lib/search-outcome-schema";
import { dashboardRangeSchema, dashboardSnapshotSchema } from "./dashboard";

export const searchGapFiltersSchema = z.object({
  q: z.string().max(100).transform(normalizeOutcomeQuery).default(""),
  source: z.enum(["all", "online", "offline"]).default("all"),
  kind: z.enum(["all", "word", "pattern"]).default("all"),
  status: z.enum(["all", "open", "reviewed", "dismissed", "linked"]).default("open"),
  sort: z.enum(["frequency", "recent"]).default("frequency"),
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(5).max(25).default(10),
});
export type SearchGapFilters = z.infer<typeof searchGapFiltersSchema>;
export const searchGapsInputSchema = searchGapFiltersSchema.extend({
  selection: dashboardRangeSchema.default({ range: "30d" }),
  asOf: dashboardSnapshotSchema.optional(),
}).strict();

export const searchGapReviewSchema = z.discriminatedUnion("status", [
  z.object({ query: outcomeQuerySchema, status: z.literal("open") }).strict(),
  z.object({ query: outcomeQuerySchema, status: z.literal("reviewed") }).strict(),
  z.object({ query: outcomeQuerySchema, status: z.literal("dismissed") }).strict(),
  z.object({ query: outcomeQuerySchema, status: z.literal("linked"),
    targetType: z.enum(["word", "correction", "request"]), targetId: z.number().int().positive().max(2_147_483_647),
  }).strict(),
]);
export type SearchGapReview = z.infer<typeof searchGapReviewSchema>;

export function readSearchGapFilters(params: { get(key: string): string | null }) {
  const parsed = searchGapFiltersSchema.safeParse({
    q: params.get("q") ?? undefined, source: params.get("source") ?? undefined,
    kind: params.get("kind") ?? undefined, status: params.get("status") ?? undefined,
    sort: params.get("sort") ?? undefined,
    page: params.get("page") === null ? undefined : Number(params.get("page")),
    pageSize: params.get("pageSize") === null ? undefined : Number(params.get("pageSize")),
  });
  return parsed.success
    ? { filters: parsed.data, error: false }
    : { filters: searchGapFiltersSchema.parse({}), error: true };
}
