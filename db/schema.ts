import {
  integer,
  pgEnum,
  pgTable,
  serial,
  varchar,
  text,
  date,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import {
  relations,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters";

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phonetic: varchar("phonetic", { length: 255 }),
  root: varchar("root", { length: 255 }),
  attributes: varchar("attributes", { length: 255 }).array(),
  audioUrl: varchar("audio", { length: 255 }), // will also have many-to-many relation with words and users in the future
  created_at: date("created_at").defaultNow(),
  updated_at: date("updated_at"),
  related_words: varchar("related_words", { length: 255 }).array(),
  related_phrases: text("related_phrases").array(),
});

export const wordsRelations = relations(words, ({ many }) => ({
  meanings: many(meanings),
  usersToWords: many(usersToWords),
}));

export const partOfSpeechEnum = pgEnum("partOfSpeech", [
  "isim",
  "fiil",
  "sıfat",
  "zarf",
  "zamir",
  "ünlem",
  "edat",
  "bağlaç",
]);
export type PartOfSpeech = (typeof partOfSpeechEnum.enumValues)[number];

export const meanings = pgTable("meanings", {
  id: serial("id").primaryKey(),
  definition: text("definition").notNull(),
  exampleSentece: text("exampleSentence"),
  exampleSentenceAuthor: varchar("exampleAuthor", { length: 255 }),
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, {
      onDelete: "cascade",
    }),
  imageUrl: varchar("imageUrl", { length: 255 }),
  partOfSpeech: partOfSpeechEnum("partOfSpeech").notNull(),
  attributes: varchar("attributes", { length: 255 }).array(),
});

export const meaningsRelations = relations(meanings, ({ one }) => ({
  word: one(words, {
    fields: [meanings.wordId],
    references: [words.id],
  }),
}));

export const usersToWords = pgTable(
  "users_to_groups",
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

export const rolesEnum = pgEnum("role", ["user", "moderator", "admin"]);

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 510 }),
  role: rolesEnum("role").default("user"),
});

export const usersRelations = relations(users, ({ many }) => ({
  usersToWords: many(usersToWords),
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

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export type SelectWord = InferSelectModel<typeof words> & {
  meanings: SelectMeaning[];
};

export type SelectMeaning = InferSelectModel<typeof meanings>;

export type SelectUser = InferSelectModel<typeof users>;

export type SelectUsersToWords = InferSelectModel<typeof usersToWords>;

export type SelectAccount = InferSelectModel<typeof accounts>;

export type InsertWord = InferInsertModel<typeof words>;

export type InsertMeaning = InferInsertModel<typeof meanings>;

export type InsertUser = InferInsertModel<typeof users>;

export type InsertUsersToWords = InferInsertModel<typeof usersToWords>;

export type InsertAccount = InferInsertModel<typeof accounts>;
