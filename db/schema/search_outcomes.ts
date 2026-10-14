import { sql } from "drizzle-orm";
import { bigint, check, date, index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Reported submissions, independent of accounts, network addresses and words.
export const searchOutcomes = pgTable("search_outcomes", {
  eventId: uuid("event_id").primaryKey(),
  query: text("query").notNull(),
  locale: text("locale", { enum: ["tr", "en"] }).notNull(),
  entryPoint: text("entry_point", { enum: ["search", "navbar"] }).notNull(),
  source: text("source", { enum: ["online", "offline"] }).notNull(),
  kind: text("kind", { enum: ["word", "pattern"] }).notNull(),
  outcome: text("outcome", { enum: ["resolved", "no_result", "error", "cancelled", "superseded"] }).notNull(),
  resultCount: integer("result_count").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("search_outcomes_received_at_idx").on(table.receivedAt),
  check("search_outcomes_query_length_check", sql`char_length(${table.query}) BETWEEN 1 AND 100`),
  check("search_outcomes_locale_check", sql`${table.locale} IN ('tr', 'en')`),
  check("search_outcomes_entry_point_check", sql`${table.entryPoint} IN ('search', 'navbar')`),
  check("search_outcomes_source_check", sql`${table.source} IN ('online', 'offline')`),
  check("search_outcomes_kind_check", sql`${table.kind} IN ('word', 'pattern')`),
  check("search_outcomes_result_check", sql`(${table.outcome} = 'resolved' AND ${table.resultCount} BETWEEN 1 AND 1000) OR (${table.outcome} IN ('no_result', 'error', 'cancelled', 'superseded') AND ${table.resultCount} = 0)`),
]);

// Long-lived counts have no query text or event/visitor identifiers.
export const searchOutcomeDailyTotals = pgTable("search_outcome_daily_totals", {
  day: date("day").notNull(),
  locale: text("locale", { enum: ["tr", "en"] }).notNull(),
  entryPoint: text("entry_point", { enum: ["search", "navbar"] }).notNull(),
  source: text("source", { enum: ["online", "offline"] }).notNull(),
  kind: text("kind", { enum: ["word", "pattern"] }).notNull(),
  outcome: text("outcome", { enum: ["resolved", "no_result", "error", "cancelled", "superseded"] }).notNull(),
  count: bigint("count", { mode: "number" }).notNull(),
}, table => [
  primaryKey({ name: "search_outcome_daily_totals_pk", columns: [table.day, table.locale, table.entryPoint, table.source, table.kind, table.outcome] }),
  check("search_outcome_daily_count_check", sql`${table.count} > 0`),
  check("search_outcome_daily_locale_check", sql`${table.locale} IN ('tr', 'en')`),
  check("search_outcome_daily_entry_point_check", sql`${table.entryPoint} IN ('search', 'navbar')`),
  check("search_outcome_daily_source_check", sql`${table.source} IN ('online', 'offline')`),
  check("search_outcome_daily_kind_check", sql`${table.kind} IN ('word', 'pattern')`),
  check("search_outcome_daily_outcome_check", sql`${table.outcome} IN ('resolved', 'no_result', 'error', 'cancelled', 'superseded')`),
]);
