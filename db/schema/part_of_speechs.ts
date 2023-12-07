import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { pgEnum, pgTable, serial } from "drizzle-orm/pg-core";
import { meanings } from "./meanings";

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

export const partOfSpeechs = pgTable("part_of_speechs", {
  id: serial("id").primaryKey(),
  partOfSpeech: partOfSpeechEnum("partOfSpeech").notNull(),
});

export const partOfSpeechsRelations = relations(partOfSpeechs, ({ many }) => ({
  words: many(meanings),
}));

export type SelectPartOfSpeech = InferSelectModel<typeof partOfSpeechs>;

export type InsertPartOfSpeech = InferInsertModel<typeof partOfSpeechs>;
