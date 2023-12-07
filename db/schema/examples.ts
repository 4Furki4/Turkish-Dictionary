import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { authors } from "./authors";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";

export const examples = pgTable("examples", {
  id: serial("id").primaryKey(),
  sentence: text("sentence").notNull(),
  authorId: integer("author_id").references(() => authors.id, {
    onDelete: "cascade",
  }),
});

export const examplesRelations = relations(examples, ({ one }) => ({
  author: one(authors, {
    fields: [examples.authorId],
    references: [authors.id],
  }),
}));

export type SelectExample = InferSelectModel<typeof examples>;

export type InsertExample = InferInsertModel<typeof examples>;
