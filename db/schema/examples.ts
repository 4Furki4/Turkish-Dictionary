import { integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { authors } from "./authors";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { words } from "./words";

export const examples = pgTable("examples", {
  id: serial("id").primaryKey(),
  sentence: text("sentence").notNull(),
  authorId: integer("author_id").references(() => authors.id, {
    onDelete: "cascade",
  }),
  requestType: varchar("request_type", { length: 255 }).default("example"),
  wordId: integer("word_id").notNull().references(() => words.id, {
    onDelete: "cascade",
  }),
});

export const examplesRelations = relations(examples, ({ one }) => ({
  author: one(authors, {
    fields: [examples.authorId],
    references: [authors.id],
  }),
  word: one(words, {
    fields: [examples.wordId],
    references: [words.id],
  })
}));

export type SelectExample = InferSelectModel<typeof examples>;

export type InsertExample = InferInsertModel<typeof examples>;
