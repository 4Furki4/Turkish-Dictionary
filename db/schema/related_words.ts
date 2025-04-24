import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { words } from "./words";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { users } from "./users";

export const relatedWords = pgTable("related_words", {
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, {
      onDelete: "cascade",
    }),
  relatedWordId: integer("related_word_id")
    .notNull()
    .references(() => words.id, {
      onDelete: "cascade",
    }),
  relationType: varchar("relation_type", { length: 255 }).default("relatedWord"), // relatedWord, antonym, synonym, correction, compound, see_also, turkish_equivalent, obsolete
  requestType: varchar("request_type", { length: 255 }).default("relatedWord"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  userId: text("user_id").references(() => users.id, {
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
    user: one(users, {
      fields: [relatedWords.userId],
      references: [users.id],
    }),
  })
);

export type SelectRelatedWord = InferSelectModel<typeof relatedWords>;

export type InsertRelatedWord = InferInsertModel<typeof relatedWords>;
