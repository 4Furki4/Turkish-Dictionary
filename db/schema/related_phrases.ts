import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { words } from "./words";
import { relations, InferSelectModel, InferInsertModel } from "drizzle-orm";

export const relatedPhrases = pgTable("related_phrases", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, { onDelete: "cascade" }),
  phrase: text("phrase").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const relatedPhrasesRelations = relations(relatedPhrases, ({ one }) => ({
  word: one(words, {
    fields: [relatedPhrases.wordId],
    references: [words.id],
  }),
}));

export type RelatedPhrase = InferSelectModel<typeof relatedPhrases>;
export type NewRelatedPhrase = InferInsertModel<typeof relatedPhrases>;
