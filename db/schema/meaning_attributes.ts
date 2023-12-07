import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { pgTable, primaryKey, serial, varchar } from "drizzle-orm/pg-core";
import { meanings } from "./meanings";

export const meaningAttributes = pgTable("meaning_attributes", {
  id: serial("id").primaryKey(),
  attribute: varchar("attribute", { length: 255 }).notNull(),
});
export const meaningsAttributes = pgTable(
  "meanings_attributes",
  {
    meaningId: serial("meaning_id").references(() => meanings.id, {
      onDelete: "cascade",
    }),
    attributeId: serial("attribute_id").references(() => meaningAttributes.id, {
      onDelete: "cascade",
    }),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.meaningId, t.attributeId],
    }),
  })
);

export const meaningAttributesRelations = relations(
  meaningAttributes,
  ({ many }) => ({
    meaningsAttributes: many(meaningsAttributes),
  })
);

export const meaningsAttributesRelations = relations(
  meaningsAttributes,
  ({ one }) => ({
    meaning: one(meanings, {
      fields: [meaningsAttributes.meaningId],
      references: [meanings.id],
    }),
    attribute: one(meaningAttributes, {
      fields: [meaningsAttributes.attributeId],
      references: [meaningAttributes.id],
    }),
  })
);

export type SelectMeaningAttribute = InferSelectModel<typeof meaningAttributes>;

export type InsertMeaningAttribute = InferInsertModel<typeof meaningAttributes>;
