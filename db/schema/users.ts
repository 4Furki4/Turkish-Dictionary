import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { words } from "./words";
import { pronounciations } from "./pronounciations";
import { savedWords } from "./saved_words";

export const rolesEnum = pgEnum("role", ["user", "moderator", "admin"]);

export type Role = (typeof rolesEnum.enumValues)[number];

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 510 }),
  role: rolesEnum("role").default("user").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  saved_words: many(savedWords),
  pronounciations: many(pronounciations),
}));

export const usersToWordsRelations = relations(savedWords, ({ one }) => ({
  user: one(users, {
    fields: [savedWords.userId],
    references: [users.id],
  }),
  word: one(words, {
    fields: [savedWords.wordId],
    references: [words.id],
  }),
}));

export type SelectUser = InferSelectModel<typeof users>;
export type SelectUsersToWords = InferSelectModel<typeof savedWords>;
export type InsertUser = InferInsertModel<typeof users>;
export type InsertUsersToWords = InferInsertModel<typeof savedWords>;
