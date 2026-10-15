import { z } from "zod";
import { dashboardRangeSchema, dashboardSnapshotSchema, DEFAULT_DASHBOARD_RANGE } from "./dashboard";

export const QUALITY_GAPS = ["any", "meaning", "pronunciation", "examples", "source", "etymology"] as const;
export const contentQualityFiltersSchema = z.object({
  q: z.string().max(100).transform(value => value.normalize("NFC").trim()).default(""),
  gap: z.enum(QUALITY_GAPS).default("any"),
  demand: z.enum(["all", "searched", "unsearched"]).default("all"),
  sort: z.enum(["demand_desc", "demand_asc", "name"]).default("demand_desc"),
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(5).max(25).default(10),
});
export const contentQualityInputSchema = contentQualityFiltersSchema.extend({
  selection: dashboardRangeSchema.default(DEFAULT_DASHBOARD_RANGE),
  asOf: dashboardSnapshotSchema.optional(),
}).strict();
export type ContentQualityFilters = z.infer<typeof contentQualityFiltersSchema>;
export type ContentQualityInput = z.infer<typeof contentQualityInputSchema>;

export function readContentQualityFilters(params: { get(key: string): string | null }) {
  const result = contentQualityFiltersSchema.safeParse({
    q: params.get("q") ?? undefined, gap: params.get("gap") ?? undefined,
    demand: params.get("demand") ?? undefined, sort: params.get("sort") ?? undefined,
    page: params.get("page") === null ? undefined : Number(params.get("page")),
    pageSize: params.get("pageSize") === null ? undefined : Number(params.get("pageSize")),
  });
  return result.success ? { filters: result.data, error: false }
    : { filters: contentQualityFiltersSchema.parse({}), error: true };
}
