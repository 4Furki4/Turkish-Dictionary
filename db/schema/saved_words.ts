import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { words } from "./words";

export const savedWords = pgTable(
  "saved_words",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.userId, t.wordId],
    }),
  })
);
