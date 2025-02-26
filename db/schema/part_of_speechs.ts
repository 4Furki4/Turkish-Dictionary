import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { meanings } from "./meanings";


export const partOfSpeechs = pgTable("part_of_speechs", {
  id: serial("id").primaryKey(),
  partOfSpeech: varchar("part_of_speech", { length: 255 }).notNull(),
  requestType: varchar("request_type", { length: 255 }).default("partOfSpeech"),
});

export const partOfSpeechsRelations = relations(partOfSpeechs, ({ many }) => ({
  words: many(meanings),
}));

export type SelectPartOfSpeech = InferSelectModel<typeof partOfSpeechs>;

export type InsertPartOfSpeech = InferInsertModel<typeof partOfSpeechs>;
