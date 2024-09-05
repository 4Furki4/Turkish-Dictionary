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
  meaning: text("meaning").notNull(),
  wordId: integer("word_id")
    .notNull()
    .references(() => words.id, {
      onDelete: "cascade",
    }),
  imageUrl: varchar("imageUrl", { length: 255 }),
  partOfSpeechId: integer("part_of_speech_id")
    .references(() => partOfSpeechs.id)
    .notNull(),
  requestType: varchar("request_type", { length: 255 }).default("meaning"),
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
