import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

// A current triage decision, not an audit log. Query-bearing reviews expire
// after 90 days without an update, alongside raw search-outcome retention.
export const searchGapReviews = pgTable("search_gap_reviews", {
  query: text("query").primaryKey(),
  status: text("status", { enum: ["reviewed", "dismissed", "linked"] }).notNull(),
  targetType: text("target_type", { enum: ["word", "correction", "request"] }),
  targetId: integer("target_id"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("search_gap_reviews_updated_at_idx").on(table.updatedAt),
  check("search_gap_reviews_query_length_check", sql`char_length(${table.query}) BETWEEN 1 AND 100`),
  check("search_gap_reviews_status_check", sql`${table.status} IN ('reviewed', 'dismissed', 'linked')`),
  check("search_gap_reviews_target_check", sql`(
    ${table.status} = 'linked' AND ${table.targetType} IS NOT NULL
    AND ${table.targetType} IN ('word', 'correction', 'request') AND ${table.targetId} IS NOT NULL AND ${table.targetId} > 0
  ) OR (${table.status} IN ('reviewed', 'dismissed') AND ${table.targetType} IS NULL AND ${table.targetId} IS NULL)`),
]);
