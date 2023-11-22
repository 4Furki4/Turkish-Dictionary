import {
  integer,
  pgEnum,
  pgTable,
  serial,
  uniqueIndex,
  varchar,
  text,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
export const words = pgTable("word", {
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
  wordMeanings: many(meanings),
  relatedWords: many(relatedWords),
}));

export const relatedWords = pgTable("related_word", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id").notNull(),
  relatedWordId: integer("related_word_id").notNull(),
});

export const relatedWordsRelations = relations(relatedWords, ({ one }) => ({
  word: one(words, {
    fields: [relatedWords.wordId],
    references: [words.id],
  }),
  relatedWord: one(words, {
    fields: [relatedWords.relatedWordId],
    references: [words.id],
  }),
}));

export const meanings = pgTable("meaning", {
  id: serial("id").primaryKey(),
  definition: text("definition").notNull(),
  exampleSentece: text("exampleSentence").notNull(),
  exampleSentenceAuthor: varchar("exampleAuthor", { length: 255 }).notNull(),
  wordId: integer("word_id").notNull(),
});

export const meaningsRelations = relations(meanings, ({ one }) => ({
  word: one(words, {
    fields: [meanings.wordId],
    references: [words.id],
  }),
}));
