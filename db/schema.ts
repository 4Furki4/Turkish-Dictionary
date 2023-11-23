import {
  integer,
  pgEnum,
  pgTable,
  serial,
  uniqueIndex,
  varchar,
  text,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phonetic: varchar("phonetic", { length: 255 }),
  root: varchar("root", { length: 255 }),
  attributes: varchar("attributes", { length: 255 }),
  audio: varchar("audio", { length: 255 }),
  createdAt: date("createdAt").notNull(),
  updatedAt: date("updatedAt").notNull(),
});

export const wordsRelations = relations(words, ({ many }) => ({
  meanings: many(meanings),
  wordsToRelatedWords: many(wordsToRelatedWords),
}));

export const relatedWords = pgTable("related_words", {
  id: serial("id").primaryKey(),
  relatedWordId: integer("related_word_id")
    .notNull()
    .references(() => words.id),
});

export const relatedWordsRelations = relations(relatedWords, ({ many }) => ({
  wordsToRelatedWords: many(wordsToRelatedWords),
}));
export const wordsToRelatedWords = pgTable(
  "words_to_related_words",
  {
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id),
    relatedWordId: integer("related_word_id")
      .notNull()
      .references(() => relatedWords.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.wordId, t.relatedWordId] }),
  })
);

export const wordsToRelatedWordsRelations = relations(
  wordsToRelatedWords,
  ({ one }) => ({
    words: one(words, {
      fields: [wordsToRelatedWords.wordId],
      references: [words.id],
    }),
    relatedWords: one(words, {
      fields: [wordsToRelatedWords.relatedWordId],
      references: [words.id],
    }),
  })
);
export const meanings = pgTable("meanings", {
  id: serial("id").primaryKey(),
  definition: text("definition").notNull(),
  exampleSentece: text("exampleSentence").notNull(),
  exampleSentenceAuthor: varchar("exampleAuthor", { length: 255 }).notNull(),
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, {
      onDelete: "cascade",
    }),
});

export const meaningsRelations = relations(meanings, ({ one }) => ({
  word: one(words, {
    fields: [meanings.wordId],
    references: [words.id],
  }),
}));
