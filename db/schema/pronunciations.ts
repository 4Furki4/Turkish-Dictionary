import { serial, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { words } from "./words";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { users } from "./users";

export const pronunciations = pgTable("pronunciations", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, {
      onDelete: "cascade",
    }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  audioUrl: varchar("audio_url", { length: 255 }).notNull(),
});

export const pronunciationsRelations = relations(
  pronunciations,
  ({ one }) => ({
    word: one(words, {
      fields: [pronunciations.wordId],
      references: [words.id],
    }),
    user: one(users, {
      fields: [pronunciations.userId],
      references: [users.id],
    }),
  })
);

export type SelectPronunciation = InferSelectModel<typeof pronunciations>;
export type InsertPronunciation = InferInsertModel<typeof pronunciations>;
