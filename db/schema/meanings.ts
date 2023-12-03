import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { words } from "./words";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";

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

export type SelectMeaning = InferSelectModel<typeof meanings>;

export type InsertMeaning = InferInsertModel<typeof meanings>;
