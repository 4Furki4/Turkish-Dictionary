import { relations } from "drizzle-orm";
import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { examples } from "./examples";

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const authorsRelations = relations(authors, ({ many }) => ({
  examples: many(examples),
}));
