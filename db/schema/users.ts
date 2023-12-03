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

export const rolesEnum = pgEnum("role", ["user", "moderator", "admin"]);

export type Role = (typeof rolesEnum.enumValues)[number];

export const usersToWords = pgTable(
  "users_to_words",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wordId: integer("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.userId, t.wordId],
    }),
  })
);
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
  usersToWords: many(usersToWords),
  pronounciations: many(pronounciations),
}));

export const usersToWordsRelations = relations(usersToWords, ({ one }) => ({
  user: one(users, {
    fields: [usersToWords.userId],
    references: [users.id],
  }),
  word: one(words, {
    fields: [usersToWords.wordId],
    references: [words.id],
  }),
}));

export type SelectUser = InferSelectModel<typeof users>;
export type SelectUsersToWords = InferSelectModel<typeof usersToWords>;
export type InsertUser = InferInsertModel<typeof users>;
export type InsertUsersToWords = InferInsertModel<typeof usersToWords>;
