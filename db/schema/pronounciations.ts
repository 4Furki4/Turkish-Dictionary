import { serial, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { words } from "./words";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const pronounciations = pgTable("pronounciations", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id").references(() => words.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  audioUrl: varchar("audio_url", { length: 255 }),
});

export const pronounciationsRelations = relations(
  pronounciations,
  ({ one }) => ({
    word: one(words, {
      fields: [pronounciations.wordId],
      references: [words.id],
    }),
    user: one(users, {
      fields: [pronounciations.userId],
      references: [users.id],
    }),
  })
);
