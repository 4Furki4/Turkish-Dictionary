import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { index, pgTable, serial, text, unique, varchar } from "drizzle-orm/pg-core";
import { announcements } from "./announcements";

export const announcementTranslations = pgTable("announcement_translations", {
  id: serial("id").primaryKey(),
  announcementId: serial("announcement_id").notNull().references(() => announcements.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 10 }).notNull(), // 'en' or 'tr'
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"), // Markdown content
  excerpt: text("excerpt"),
}, (table) => {
  return {
    announcementIdIdx: index("announcement_id_idx").on(table.announcementId),
    uniqueLocale: unique().on(table.announcementId, table.locale),
  };
});

// Define relations for announcement translations
export const announcementTranslationsRelations = relations(announcementTranslations, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementTranslations.announcementId],
    references: [announcements.id],
  }),
}));

// Export types for use in other files
export type SelectAnnouncementTranslation = InferSelectModel<typeof announcementTranslations>;
export type InsertAnnouncementTranslation = InferInsertModel<typeof announcementTranslations>;
