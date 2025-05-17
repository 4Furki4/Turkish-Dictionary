import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { words } from "./words";
import { users } from "./users";

/**
 * User search history table
 * Stores a chronological list of words searched by each logged-in user
 */
export const userSearchHistory = pgTable(
  "user_search_history",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    searchedAt: timestamp("searched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => {
    return {
      // Composite index on userId and searchedAt for efficient retrieval of a user's search history
      userHistoryIdx: index("user_history_idx").on(table.userId, table.searchedAt),
    };
  }
);

// Define relations for userSearchHistory
export const userSearchHistoryRelations = relations(userSearchHistory, ({ one }) => ({
  user: one(users, {
    fields: [userSearchHistory.userId],
    references: [users.id],
  }),
  word: one(words, {
    fields: [userSearchHistory.wordId],
    references: [words.id],
  }),
}));

// Type definitions for TypeScript
export type SelectUserSearchHistory = InferSelectModel<typeof userSearchHistory>;
export type InsertUserSearchHistory = InferInsertModel<typeof userSearchHistory>;
