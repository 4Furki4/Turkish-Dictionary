import type { db } from "@/db";
import { searchOutcomes, searchOutcomeDailyTotals } from "@/db/schema/search_outcomes";
import { searchGapReviews } from "@/db/schema/search_gap_reviews";
import { words } from "@/db/schema/words";
import { misspellings } from "@/db/schema/misspellings";
import { requests } from "@/db/schema/requests";
import { and, asc, count, desc, eq, gte, inArray, lt, lte, max, min, sql, type SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { SEARCH_OUTCOME_RETENTION_DAYS } from "@/src/lib/search-outcome-schema";
import { DASHBOARD_DAY_MS } from "./api/schemas/dashboard";
import { searchGapsInputSchema, type SearchGapReview } from "./api/schemas/search-gaps";
import { getDashboardWindow } from "./dashboard-window";
import type { z } from "zod";

type Database = typeof db;
type Match = { id: number; name: string };
export type SearchGapsInput = z.input<typeof searchGapsInputSchema>;

export async function getSearchGaps(database: Database, raw: SearchGapsInput, now = new Date()) {
  const input = searchGapsInputSchema.parse(raw);
  const snapshot = input.asOf ?? now;
  const window = getDashboardWindow(input.selection, snapshot);
  const retainedFrom = new Date(now.getTime() - SEARCH_OUTCOME_RETENTION_DAYS * DASHBOARD_DAY_MS);
  const start = new Date(Math.max(window.start.getTime(), retainedFrom.getTime()));
  const within = and(gte(searchOutcomes.receivedAt, start), lt(searchOutcomes.receivedAt, window.end),
    input.source === "all" ? undefined : eq(searchOutcomes.source, input.source),
    input.kind === "all" ? undefined : eq(searchOutcomes.kind, input.kind))!;
  const misses = and(within, eq(searchOutcomes.outcome, "no_result"),
    input.q ? sql`strpos(${searchOutcomes.query}, ${input.q}) > 0` : undefined)!;
  const status = sql<"open" | "reviewed" | "dismissed" | "linked">`coalesce(${searchGapReviews.status}, 'open')`;
  const grouped = database.$with("search_gap_counts").as(database.select({
    query: searchOutcomes.query,
    frequency: count().as("frequency"),
    firstSeen: min(searchOutcomes.receivedAt).as("first_seen"),
    lastSeen: max(searchOutcomes.receivedAt).as("last_seen"),
  }).from(searchOutcomes).where(misses).groupBy(searchOutcomes.query));
  const reviewFilter = input.status === "all" ? undefined : eq(status, input.status);
  const activeReview = and(eq(searchGapReviews.query, grouped.query), gte(searchGapReviews.updatedAt, retainedFrom));
  const filteredCount = (condition: SQL) => sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
  const day = sql<string>`to_char(${searchOutcomes.receivedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
  const pageQuery = database.with(grouped).select({
      query: grouped.query, frequency: grouped.frequency, firstSeen: grouped.firstSeen, lastSeen: grouped.lastSeen,
      status, reviewedAt: searchGapReviews.updatedAt, targetType: searchGapReviews.targetType, targetId: searchGapReviews.targetId,
      // These bounded, indexed ILIKE probes match the live dictionary lookup;
      // they do not log searches, use a cache, or issue a request per row.
      currentWord: sql<Match | null>`(with dictionary_candidates as materialized (
        select w.id, w.name from ${words} w where w.name ilike ${grouped.query}
      ) select json_build_object('id', id, 'name', name) from dictionary_candidates order by id limit 1)`,
      correction: sql<{ id: number; wordId: number; name: string } | null>`(select json_build_object('id', m.id, 'wordId', w.id, 'name', w.name)
        from ${misspellings} m join ${words} w on w.id = m.correct_word_id
        where strpos(${grouped.query}, '_') = 0 and m.incorrect_spelling ilike ${grouped.query} order by m.id limit 1)`,
      linkedWordName: sql<string | null>`(select w.name from ${words} w where ${searchGapReviews.targetType} = 'word' and w.id = ${searchGapReviews.targetId})`,
    }).from(grouped).leftJoin(searchGapReviews, activeReview).where(reviewFilter)
      .orderBy(input.sort === "recent" ? desc(grouped.lastSeen) : desc(grouped.frequency), asc(grouped.query))
      .limit(input.pageSize);
  const [initialRows, totals, measures, daily, coverage] = await Promise.all([
    pageQuery.offset((input.page - 1) * input.pageSize),
    database.with(grouped).select({ total: count() }).from(grouped)
      .leftJoin(searchGapReviews, activeReview).where(reviewFilter),
    database.select({ reported: count(),
      resolved: filteredCount(eq(searchOutcomes.outcome, "resolved")),
      noResult: filteredCount(eq(searchOutcomes.outcome, "no_result")),
      errors: filteredCount(eq(searchOutcomes.outcome, "error")),
    }).from(searchOutcomes).where(within),
    database.select({ date: day, noResult: filteredCount(eq(searchOutcomes.outcome, "no_result")),
      errors: filteredCount(eq(searchOutcomes.outcome, "error")),
    }).from(searchOutcomes).where(within).groupBy(day).orderBy(day),
    database.select({ firstDay: min(searchOutcomeDailyTotals.day) }).from(searchOutcomeDailyTotals)
      .where(lte(searchOutcomeDailyTotals.day, snapshot.toISOString().slice(0, 10))),
  ]);
  const total = totals[0]?.total ?? 0;
  const page = Math.min(input.page, Math.max(1, Math.ceil(total / input.pageSize)));
  // A review can remove the last row on a page. Return the nearest valid page
  // rather than trapping the administrator on "page 2 of 1".
  const rows = total === 0 ? [] : page === input.page ? initialRows : await pageQuery.offset((page - 1) * input.pageSize);
  const queries = rows.map(row => row.query);
  const byQuery = queries.length ? await database.select({ query: searchOutcomes.query, date: day, count: count() })
    .from(searchOutcomes).where(and(within, eq(searchOutcomes.outcome, "no_result"), inArray(searchOutcomes.query, queries)))
    .groupBy(searchOutcomes.query, day).orderBy(day) : [];
  const metrics = measures[0]!;
  const completed = metrics.resolved + metrics.noResult;
  const byDay = new Map(daily.map(row => [row.date, row]));
  return {
    generatedAt: snapshot, checkedAt: now, window,
    coverage: { firstRecordedDay: coverage[0]?.firstDay ?? null, retainedFrom,
      truncated: window.start < retainedFrom, effectiveStart: start },
    summary: { ...metrics, completed, noResultRate: completed > 0 ? metrics.noResult / completed : null },
    daily: Array.from({ length: window.days }, (_, index) => {
      const date = new Date(window.start.getTime() + index * DASHBOARD_DAY_MS).toISOString().slice(0, 10);
      const dayStart = Date.parse(`${date}T00:00:00Z`);
      const measured = dayStart + DASHBOARD_DAY_MS > start.getTime() && dayStart < window.end.getTime()
        && Boolean(coverage[0]?.firstDay && date >= coverage[0].firstDay);
      return byDay.get(date) ?? { date, noResult: measured ? 0 : null, errors: measured ? 0 : null };
    }),
    items: rows.map(row => ({ ...row, daily: byQuery.filter(point => point.query === row.query).map(({ date, count }) => ({ date, count })) })),
    total, page, pageSize: input.pageSize,
  };
}

export async function reviewSearchGap(database: Database, input: SearchGapReview, actorId: string, now = new Date()) {
  return database.transaction(async tx => {
    const [observed] = await tx.select({ eventId: searchOutcomes.eventId }).from(searchOutcomes)
      .where(and(eq(searchOutcomes.query, input.query), eq(searchOutcomes.outcome, "no_result"),
        lte(searchOutcomes.receivedAt, now),
        gte(searchOutcomes.receivedAt, new Date(now.getTime() - SEARCH_OUTCOME_RETENTION_DAYS * DASHBOARD_DAY_MS))))
      .limit(1);
    if (!observed) throw new TRPCError({ code: "NOT_FOUND", message: "gapExpired" });
    if (input.status === "open") {
      await tx.delete(searchGapReviews).where(eq(searchGapReviews.query, input.query));
    } else {
      if (input.status === "linked") {
        const table = input.targetType === "word" ? words : input.targetType === "correction" ? misspellings : requests;
        const [target] = await tx.select({ id: table.id }).from(table).where(eq(table.id, input.targetId)).limit(1);
        if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "targetMissing" });
      }
      const values = { query: input.query, status: input.status, updatedBy: actorId, updatedAt: now,
        targetType: input.status === "linked" ? input.targetType : null,
        targetId: input.status === "linked" ? input.targetId : null };
      await tx.insert(searchGapReviews).values(values).onConflictDoUpdate({ target: searchGapReviews.query, set: values });
    }
    return { saved: true as const };
  });
}
