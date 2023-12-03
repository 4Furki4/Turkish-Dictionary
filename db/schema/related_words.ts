import { integer, pgTable } from "drizzle-orm/pg-core";
import { words } from "./words";
import { relations } from "drizzle-orm";

export const relatedWords = pgTable("related_words", {
  wordId: integer("word_id").references(() => words.id, {
    onDelete: "cascade",
  }),
  relatedWordId: integer("related_word_id").references(() => words.id, {
    onDelete: "cascade",
  }),
});
export const relatedWordsToWordsRelations = relations(
  relatedWords,
  ({ one }) => ({
    word: one(words, {
      fields: [relatedWords.wordId],
      references: [words.id],
    }),
    relatedWord: one(words, {
      fields: [relatedWords.relatedWordId],
      references: [words.id],
    }),
  })
);
