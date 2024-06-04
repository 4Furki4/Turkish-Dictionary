import {
  pgTable,
  serial,
  varchar,
  text,
  date,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { SelectMeaning, meanings } from "./meanings";
import { pronounciations } from "./pronounciations";
import { savedWords } from "./saved_words";
import { roots } from "./roots";
export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phonetic: varchar("phonetic", { length: 255 }),
  rootId: integer("root_id"),
  created_at: date("created_at").defaultNow(),
  updated_at: date("updated_at"),
  prefix: varchar("prefix", { length: 255 }),
  suffix: varchar("suffix", { length: 255 }),
  requestType: varchar("request_type", { length: 255 }).default("word"),
}, (t) => {
  return {
    name_index: index("name_idx").on(t.name)
  }
});

export const wordsRelations = relations(words, ({ many, one }) => ({
  meanings: many(meanings),
  saved_words: many(savedWords),
  pronounciations: many(pronounciations),
  root: one(roots, {
    fields: [words.rootId],
    references: [roots.id],
  }),
}));

export type SelectWordWithMeanings = InferSelectModel<typeof words> & {
  meanings: SelectMeaning[];
};
export type SelectWord = InferSelectModel<typeof words>;

export type InsertWord = InferInsertModel<typeof words>;
