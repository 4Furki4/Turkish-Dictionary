import type { db } from "@/db";
import { wordQueryLatencies } from "@/db/schema/word_query_latencies";
import { and, count, gte, lt, sql } from "drizzle-orm";
import { compareDashboardMetric, getDashboardWindow } from "./dashboard-window";
import type { DashboardRange } from "./api/schemas/dashboard";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export type WordQueryLatencyMetrics = {
  sampleCount: number;
  averageMs: number | null;
  p95Ms: number | null;
};

type DailyMetrics = WordQueryLatencyMetrics & { date: string };

export function wordQueryLatencyWindow(now: Date, selection?: DashboardRange) {
  return getDashboardWindow(selection, now);
}

export function fillWordQueryLatencyDays(start: Date, rows: DailyMetrics[], days = WINDOW_DAYS) {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return Array.from({ length: days }, (_, index): DailyMetrics => {
    const date = new Date(start.getTime() + index * DAY_IN_MS).toISOString().slice(0, 10);
    return byDate.get(date) ?? { date, sampleCount: 0, averageMs: null, p95Ms: null };
  });
}

export async function getWordQueryLatency(database: Pick<typeof db, "select">, now = new Date(), selection?: DashboardRange) {
  const window = wordQueryLatencyWindow(now, selection);
  const withinWindow = and(
    gte(wordQueryLatencies.receivedAt, window.start),
    lt(wordQueryLatencies.receivedAt, window.end),
  );
  const dateBucket = sql<string>`to_char(${wordQueryLatencies.receivedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
  const withinPreviousWindow = and(gte(wordQueryLatencies.receivedAt, window.previousStart), lt(wordQueryLatencies.receivedAt, window.previousEnd));
  const metrics = {
    sampleCount: count(),
    averageMs: sql<number | null>`avg(${wordQueryLatencies.durationMs})::double precision`,
    p95Ms: sql<number | null>`percentile_cont(0.95) within group (order by ${wordQueryLatencies.durationMs})`,
  };
  const [dailyRows, summaryRows, previousRows] = await Promise.all([
    database.select({ date: dateBucket, ...metrics })
      .from(wordQueryLatencies).where(withinWindow).groupBy(dateBucket).orderBy(dateBucket),
    // Compute the window percentile from raw samples, never daily percentiles.
    database.select(metrics).from(wordQueryLatencies).where(withinWindow),
    database.select(metrics).from(wordQueryLatencies).where(withinPreviousWindow),
  ]);
  const summary = summaryRows[0] ?? { sampleCount: 0, averageMs: null, p95Ms: null };
  const previous = previousRows[0] ?? { sampleCount: 0, averageMs: null, p95Ms: null };
  return {
    generatedAt: now,
    window,
    summary,
    previous,
    comparison: {
      averageMs: compareDashboardMetric(summary.averageMs, previous.averageMs),
      p95Ms: compareDashboardMetric(summary.p95Ms, previous.p95Ms),
    },
    daily: fillWordQueryLatencyDays(window.start, dailyRows, window.days),
  };
}
