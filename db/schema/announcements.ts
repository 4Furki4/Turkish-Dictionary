import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { announcementTranslations } from "./announcement_translations";

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  authorId: varchar("author_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }),
  imageUrl: text("image_url"),
  actionUrl: text("action_url"),
  actionTextKey: varchar("action_text_key", { length: 100 }),
  publishedAt: timestamp("published_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Define relations for announcements
export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  translations: many(announcementTranslations),
}));

// Export types for use in other files
export type SelectAnnouncement = InferSelectModel<typeof announcements>;
export type InsertAnnouncement = InferInsertModel<typeof announcements>;