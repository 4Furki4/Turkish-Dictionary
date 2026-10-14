import { z } from "zod";

export const DASHBOARD_DAY_MS = 86_400_000;
export const MAX_DASHBOARD_DAYS = 90;
export const DEFAULT_DASHBOARD_RANGE = { range: "30d" } as const;

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return value >= "1970-01-01" && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "invalidDate");

export const dashboardRangeSchema = z.discriminatedUnion("range", [
  z.object({ range: z.enum(["7d", "30d", "90d"]) }).strict(),
  z.object({ range: z.literal("custom"), start: calendarDate, end: calendarDate }).strict(),
]).superRefine((input, ctx) => {
  if (input.range !== "custom") return;
  if (!calendarDate.safeParse(input.start).success || !calendarDate.safeParse(input.end).success) return;
  if (input.start > input.end) ctx.addIssue({ code: "custom", message: "reversedRange", path: ["end"] });
  const days = (Date.parse(input.end) - Date.parse(input.start)) / DASHBOARD_DAY_MS + 1;
  if (days > MAX_DASHBOARD_DAYS) ctx.addIssue({ code: "custom", message: "rangeTooLong", path: ["end"] });
});

export type DashboardRange = z.infer<typeof dashboardRangeSchema>;

export const dashboardLatencyInputSchema = z.object({
  selection: dashboardRangeSchema.default(DEFAULT_DASHBOARD_RANGE),
  // Reuse the overview snapshot so the separate latency request has identical bounds.
  asOf: z.date().min(new Date("1970-01-01T00:00:00Z"), "invalidSnapshot")
    .refine(value => value.getTime() <= Date.now(), "futureSnapshot").optional(),
}).strict().optional();

export function readDashboardRange(params: { get(name: string): string | null }, referenceTime: Date) {
  const range = params.get("range") ?? "30d";
  const raw = range === "custom"
    ? { range, start: params.get("start") ?? "", end: params.get("end") ?? "" }
    : { range };
  const result = dashboardRangeSchema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues.find(issue => ["reversedRange", "rangeTooLong"].includes(issue.message))?.message;
    return { selection: DEFAULT_DASHBOARD_RANGE as DashboardRange, error: message ?? "invalidRange" };
  }
  if (result.data.range === "custom" && result.data.end > referenceTime.toISOString().slice(0, 10)) {
    return { selection: DEFAULT_DASHBOARD_RANGE as DashboardRange, error: "futureRange" };
  }
  return { selection: result.data, error: null };
}
