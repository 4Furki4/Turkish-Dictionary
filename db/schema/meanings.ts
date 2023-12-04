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
import { partOfSpeechs } from "./part_of_speechs";
import { meaningsAttributes } from "./meaning_attributes";

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
  partOfSpeechId: integer("part_of_speech_id")
    .references(() => partOfSpeechs.id)
    .notNull(),
});

export const meaningsRelations = relations(meanings, ({ one, many }) => ({
  word: one(words, {
    fields: [meanings.wordId],
    references: [words.id],
  }),
  partOfSpeech: one(partOfSpeechs, {
    fields: [meanings.partOfSpeechId],
    references: [partOfSpeechs.id],
  }),
  attributes: many(meaningsAttributes),
}));

export type SelectMeaning = InferSelectModel<typeof meanings>;

export type InsertMeaning = InferInsertModel<typeof meanings>;
