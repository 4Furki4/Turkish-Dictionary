import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { authors } from "./authors";
import { relations } from "drizzle-orm";

export const examples = pgTable("examples", {
  id: serial("id").primaryKey(),
  sentence: text("sentence").notNull(),
  authorId: serial("author_id").references(() => authors.id, {
    onDelete: "cascade",
  }),
});

export const examplesRelations = relations(examples, ({ one }) => ({
  author: one(authors, {
    fields: [examples.authorId],
    references: [authors.id],
  }),
}));

export type SelectExample = {
  id: number;
  sentence: string;
  authorId: number;
};

export type InsertExample = {
  sentence: string;
  authorId: number;
};
