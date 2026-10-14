import { TRPCError } from "@trpc/server";
import { DASHBOARD_DAY_MS, DEFAULT_DASHBOARD_RANGE, dashboardRangeSchema, type DashboardRange } from "./api/schemas/dashboard";

export function getDashboardWindow(selection: DashboardRange = DEFAULT_DASHBOARD_RANGE, now = new Date()) {
  const parsed = dashboardRangeSchema.safeParse(selection);
  if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: "invalidRange" });
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const input = parsed.data;
  const start = input.range === "custom"
    ? Date.parse(`${input.start}T00:00:00Z`)
    : today - (Number.parseInt(input.range) - 1) * DASHBOARD_DAY_MS;
  const requestedEnd = input.range === "custom"
    ? Date.parse(`${input.end}T00:00:00Z`) + DASHBOARD_DAY_MS
    : today + DASHBOARD_DAY_MS;
  if (requestedEnd > today + DASHBOARD_DAY_MS) throw new TRPCError({ code: "BAD_REQUEST", message: "futureRange" });
  const days = Math.round((requestedEnd - start) / DASHBOARD_DAY_MS);
  const end = Math.min(requestedEnd, now.getTime());
  const previousStart = start - days * DASHBOARD_DAY_MS;
  return {
    start: new Date(start),
    end: new Date(end),
    previousStart: new Date(previousStart),
    previousEnd: new Date(previousStart + end - start),
    startDate: new Date(start).toISOString().slice(0, 10),
    endDate: new Date(requestedEnd - DASHBOARD_DAY_MS).toISOString().slice(0, 10),
    days,
    partial: end < requestedEnd,
    timeZone: "UTC" as const,
  };
}

export type DashboardWindow = ReturnType<typeof getDashboardWindow>;

export function compareDashboardMetric(current: number | null, previous: number | null) {
  return {
    current,
    previous,
    difference: current === null || previous === null ? null : current - previous,
    percentChange: current === null || previous === null || previous === 0 ? null : (current - previous) / previous * 100,
  };
}

export type DashboardComparison = ReturnType<typeof compareDashboardMetric>;
