import { pgTable, serial, varchar, text, date } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { SelectMeaning, meanings } from "./meanings";
import { usersToWords } from "./users";
import { pronounciations } from "./pronounciations";
export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phonetic: varchar("phonetic", { length: 255 }),
  root: varchar("root", { length: 255 }),
  attributes: varchar("attributes", { length: 255 }).array(),
  created_at: date("created_at").defaultNow(),
  updated_at: date("updated_at"),
  related_phrases: text("related_phrases").array(),
  prefix: varchar("prefix", { length: 255 }),
  suffix: varchar("suffix", { length: 255 }),
});

export const wordsRelations = relations(words, ({ many }) => ({
  meanings: many(meanings),
  usersToWords: many(usersToWords),
  pronounciations: many(pronounciations),
}));

export type SelectWordWithMeanings = InferSelectModel<typeof words> & {
  meanings: SelectMeaning[];
};
export type SelectWord = InferSelectModel<typeof words>;

export type InsertWord = InferInsertModel<typeof words>;
