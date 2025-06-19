import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { words } from "./words";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const savedWords = pgTable(
  "saved_words",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.userId, t.wordId],
    }),
  })
);

export type SelectSavedWord = InferSelectModel<typeof savedWords>;

export type InsertSavedWord = InferInsertModel<typeof savedWords>;
