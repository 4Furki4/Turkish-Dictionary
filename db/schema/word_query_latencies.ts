import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Independent anonymous samples: no relationship to words or users.
export const wordQueryLatencies = pgTable("word_query_latencies", {
  eventId: uuid("event_id").primaryKey(),
  durationMs: integer("duration_ms").notNull(),
  source: text("source", { enum: ["online", "offline"] }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("word_query_latencies_received_at_idx").on(table.receivedAt),
  check("word_query_latencies_duration_check", sql`${table.durationMs} >= 0 AND ${table.durationMs} <= 120000`),
  check("word_query_latencies_source_check", sql`${table.source} IN ('online', 'offline')`),
]);
