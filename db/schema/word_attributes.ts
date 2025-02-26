import {
  integer,
  pgTable,
  serial,
  varchar,
  primaryKey,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { words } from "./words";
export const wordAttributes = pgTable("word_attributes", {
  id: serial("id").primaryKey(),
  attribute: varchar("attribute", { length: 255 }).notNull(),
  requestType: varchar("request_type", { length: 255 }).default(
    "wordAttribute"
  ),
});

export const wordAttributesRelations = relations(
  wordAttributes,
  ({ many }) => ({
    wordAttributes: many(wordsAttributes),
  })
);

export const wordsAttributes = pgTable(
  "words_attributes",
  {
    wordId: integer("word_id").notNull().references(() => words.id, {
      onDelete: "cascade",
    }),
    attributeId: integer("attribute_id").notNull().references(() => wordAttributes.id, {
      onDelete: "cascade",
    }),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.wordId, t.attributeId],
    }),
  })
);

export const wordsAttributesRelations = relations(
  wordsAttributes,
  ({ one }) => ({
    word: one(words, {
      fields: [wordsAttributes.wordId],
      references: [words.id],
    }),
    attribute: one(wordAttributes, {
      fields: [wordsAttributes.attributeId],
      references: [wordAttributes.id],
    }),
  })
);

export type SelectWordAttribute = InferSelectModel<typeof wordAttributes>;

export type InsertWordAttribute = InferInsertModel<typeof wordAttributes>;
