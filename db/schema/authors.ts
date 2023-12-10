import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { examples } from "./examples";

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  requestType: varchar("request_type", { length: 255 }).default("author"),
});

export const authorsRelations = relations(authors, ({ many }) => ({
  examples: many(examples),
}));

export type SelectAuthor = InferSelectModel<typeof authors>;

export type InsertAuthor = InferInsertModel<typeof authors>;
