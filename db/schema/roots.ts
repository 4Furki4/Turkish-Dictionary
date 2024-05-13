import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { words } from "./words";
import { users } from "./users";

export const roots = pgTable("roots", {
  id: serial("id").primaryKey(),
  root: varchar("root", { length: 255 }),
  language: varchar("language", { length: 255 }).notNull(),
  userId: text("user_id"),
  wordId: integer("word_id").notNull().references(() => words.id),
  requestType: varchar("request_type", { length: 255 }).default("root"),
});

export const rootsRelations = relations(roots, ({ one }) => ({
  user: one(users, {
    fields: [roots.userId],
    references: [users.id],
  }),
}));

export type SelectRoot = InferSelectModel<typeof roots>;

export type InsertRoot = InferInsertModel<typeof roots>;
