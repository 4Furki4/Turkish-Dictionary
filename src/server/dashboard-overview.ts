import type { db } from "@/db";
import { feedbacks } from "@/db/schema/feedbacks";
import { requests } from "@/db/schema/requests";
import { searchLogs } from "@/db/schema/search_logs";
import { users } from "@/db/schema/users";
import { words } from "@/db/schema/words";
import { and, count, desc, eq, gte, lt, or, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { DASHBOARD_DAY_MS, type DashboardRange } from "./api/schemas/dashboard";
import { compareDashboardMetric, getDashboardWindow } from "./dashboard-window";

export async function getDashboardOverview(database: Pick<typeof db, "select">, selection?: DashboardRange, now = new Date()) {
  const window = getDashboardWindow(selection, now);
  const between = (column: AnyColumn, start: Date, end: Date) => and(gte(column, start), lt(column, end))!;
  const current = (column: AnyColumn) => between(column, window.start, window.end);
  const previous = (column: AnyColumn) => between(column, window.previousStart, window.previousEnd);
  const periods = (column: AnyColumn) => or(current(column), previous(column));
  const filteredCount = (condition: SQL) => sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
  const periodCounts = (column: AnyColumn) => ({ current: filteredCount(current(column)), previous: filteredCount(previous(column)) });
  const dateBucket = sql<string>`to_char(${searchLogs.searchTimestamp} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;

  const [totalWords, totalUsers, pendingRequests, openFeedback, searches, newUsers, submitted, resolved, dailyRows, topWords] = await Promise.all([
    database.select({ count: count() }).from(words),
    database.select({ count: count() }).from(users),
    database.select({ count: count() }).from(requests).where(eq(requests.status, "pending")),
    database.select({ count: count() }).from(feedbacks).where(eq(feedbacks.status, "open")),
    database.select({
      ...periodCounts(searchLogs.searchTimestamp),
      authenticated: filteredCount(and(current(searchLogs.searchTimestamp), sql`${searchLogs.userId} is not null`)!),
      anonymous: filteredCount(and(current(searchLogs.searchTimestamp), sql`${searchLogs.userId} is null`)!),
    }).from(searchLogs).where(periods(searchLogs.searchTimestamp)),
    database.select(periodCounts(users.createdAt)).from(users).where(periods(users.createdAt)),
    database.select(periodCounts(requests.requestDate)).from(requests).where(periods(requests.requestDate)),
    database.select(periodCounts(requests.resolvedAt)).from(requests)
      .where(and(periods(requests.resolvedAt), sql`${requests.status} in ('approved', 'rejected')`)),
    database.select({ date: dateBucket, count: count() }).from(searchLogs)
      .where(current(searchLogs.searchTimestamp)).groupBy(dateBucket).orderBy(dateBucket),
    database.select({ wordId: words.id, wordName: words.name, count: count(searchLogs.id) })
      .from(searchLogs).innerJoin(words, eq(searchLogs.wordId, words.id))
      .where(current(searchLogs.searchTimestamp)).groupBy(words.id, words.name)
      .orderBy(desc(count(searchLogs.id)), words.id).limit(8),
  ]);
  const comparison = (rows: { current: number; previous: number }[]) => compareDashboardMetric(rows[0]?.current ?? 0, rows[0]?.previous ?? 0);
  const byDate = new Map(dailyRows.map(row => [row.date, row.count]));
  return {
    generatedAt: now,
    window,
    metrics: {
      totalWords: totalWords[0]?.count ?? 0,
      totalUsers: totalUsers[0]?.count ?? 0,
      pendingRequests: pendingRequests[0]?.count ?? 0,
      openFeedback: openFeedback[0]?.count ?? 0,
    },
    periodMetrics: {
      searches: comparison(searches),
      newUsers: comparison(newUsers),
      submittedRequests: comparison(submitted),
      resolvedRequests: comparison(resolved),
    },
    searchAnalytics: {
      dailySearches: Array.from({ length: window.days }, (_, index) => {
        const date = new Date(window.start.getTime() + index * DASHBOARD_DAY_MS).toISOString().slice(0, 10);
        return { date, count: byDate.get(date) ?? 0 };
      }),
      topSearchedWords: topWords,
      actorSplit: { total: searches[0]?.current ?? 0, authenticated: searches[0]?.authenticated ?? 0, anonymous: searches[0]?.anonymous ?? 0 },
    },
  };
}
