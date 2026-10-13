import type { db } from "@/db";
import { wordQueryLatencies } from "@/db/schema/word_query_latencies";
import { and, count, gte, lt, sql } from "drizzle-orm";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export type WordQueryLatencyMetrics = {
  sampleCount: number;
  averageMs: number | null;
  p95Ms: number | null;
};

type DailyMetrics = WordQueryLatencyMetrics & { date: string };

export function wordQueryLatencyWindow(now: Date) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return {
    start: new Date(today - (WINDOW_DAYS - 1) * DAY_IN_MS),
    end: new Date(today + DAY_IN_MS),
    days: WINDOW_DAYS,
    timeZone: "UTC" as const,
  };
}

export function fillWordQueryLatencyDays(start: Date, rows: DailyMetrics[]) {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return Array.from({ length: WINDOW_DAYS }, (_, index): DailyMetrics => {
    const date = new Date(start.getTime() + index * DAY_IN_MS).toISOString().slice(0, 10);
    return byDate.get(date) ?? { date, sampleCount: 0, averageMs: null, p95Ms: null };
  });
}

export async function getWordQueryLatency(database: Pick<typeof db, "select">, now = new Date()) {
  const window = wordQueryLatencyWindow(now);
  const withinWindow = and(
    gte(wordQueryLatencies.receivedAt, window.start),
    lt(wordQueryLatencies.receivedAt, window.end),
  );
  const dateBucket = sql<string>`to_char(${wordQueryLatencies.receivedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
  const metrics = {
    sampleCount: count(),
    averageMs: sql<number | null>`avg(${wordQueryLatencies.durationMs})::double precision`,
    p95Ms: sql<number | null>`percentile_cont(0.95) within group (order by ${wordQueryLatencies.durationMs})`,
  };
  const [dailyRows, summaryRows] = await Promise.all([
    database.select({ date: dateBucket, ...metrics })
      .from(wordQueryLatencies).where(withinWindow).groupBy(dateBucket).orderBy(dateBucket),
    // Compute the window percentile from raw samples, never daily percentiles.
    database.select(metrics).from(wordQueryLatencies).where(withinWindow),
  ]);
  return {
    generatedAt: now,
    window,
    summary: summaryRows[0] ?? { sampleCount: 0, averageMs: null, p95Ms: null },
    daily: fillWordQueryLatencyDays(window.start, dailyRows),
  };
}
