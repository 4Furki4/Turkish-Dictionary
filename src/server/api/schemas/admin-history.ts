import { z } from "zod";
import { dashboardRangeSchema, dashboardSnapshotSchema, DEFAULT_DASHBOARD_RANGE } from "./dashboard";

export const AUDIT_ACTIONS = ["create", "update", "delete", "approve", "reject", "assign", "revoke"] as const;
export const AUDIT_TARGETS = ["word", "word_attribute", "meaning_attribute", "author", "part_of_speech", "language", "root", "user", "request", "feedback", "announcement", "daily_word", "misspelling", "galatimeshur", "badge", "badge_assignment", "word_relation", "phrase_relation", "relation_suggestion", "foreign_suggestion"] as const;
export const adminHistoryFiltersSchema = z.object({
  actorId: z.string().trim().max(128).default(""),
  targetType: z.enum(["all", ...AUDIT_TARGETS]).default("all"),
  targetId: z.string().trim().max(160).default(""),
  action: z.enum(["all", ...AUDIT_ACTIONS]).default("all"),
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(5).max(25).default(10),
  asOf: z.string().datetime().refine(value => Date.parse(value) <= Date.now(), "futureSnapshot").optional(),
});
export type AdminHistoryFilters = z.infer<typeof adminHistoryFiltersSchema>;
export const adminHistoryInputSchema = adminHistoryFiltersSchema.omit({ asOf: true }).extend({
  selection: dashboardRangeSchema.default(DEFAULT_DASHBOARD_RANGE),
  asOf: dashboardSnapshotSchema.optional(),
}).strict();
export const adminHistoryDetailSchema = z.object({ id: z.number().int().positive().max(2147483647) }).strict();

export function readAdminHistoryFilters(params: { get(key: string): string | null }) {
  const result = adminHistoryFiltersSchema.safeParse({
    actorId: params.get("actorId") ?? undefined, targetType: params.get("targetType") ?? undefined,
    targetId: params.get("targetId") ?? undefined, action: params.get("action") ?? undefined,
    asOf: params.get("asOf") ?? undefined,
    page: params.get("page") === null ? undefined : Number(params.get("page")),
    pageSize: params.get("pageSize") === null ? undefined : Number(params.get("pageSize")),
  });
  return result.success ? { filters: result.data, error: false } : { filters: adminHistoryFiltersSchema.parse({}), error: true };
}
