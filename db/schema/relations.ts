import { relations } from "drizzle-orm";
import { announcements } from "./announcements";
import { announcementTranslations } from "./announcement_translations";
import { users } from "./users";

// Define relations for announcements
export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  translations: many(announcementTranslations),
}));

// Define relations for announcement translations
export const announcementTranslationsRelations = relations(announcementTranslations, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementTranslations.announcementId],
    references: [announcements.id],
  }),
}));
