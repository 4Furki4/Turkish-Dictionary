import {
  integer,
  pgTable,
  serial,
  timestamp,
  index,
  text,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { words } from "./words"; // Assuming words schema is in ./words
import { users } from "./users"; // Assuming users schema is in ./users

export const searchLogs = pgTable(
  "search_logs",
  {
    id: serial("id").primaryKey(),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { // Adjust type if user ID is not integer
      onDelete: "set null",
    }),
    searchTimestamp: timestamp("search_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      wordIdIdx: index("search_logs_word_id_idx").on(table.wordId),
      timestampIdx: index("search_logs_timestamp_idx").on(
        table.searchTimestamp,
      ),
      // Optional: Index userId if frequent lookups by user are expected
      userIdIdx: index("search_logs_user_id_idx").on(table.userId),
    };
  },
);

export type SearchLog = typeof searchLogs.$inferSelect; // return type when queried
export type NewSearchLog = typeof searchLogs.$inferInsert; // insert type
