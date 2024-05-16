
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const languages = pgTable("languages", {
    id: serial("id").primaryKey(),
    language_en: varchar("language_en", { length: 255 }).notNull(),
    language_tr: varchar("language_tr", { length: 255 }).notNull(),
    language_code: varchar("language_code", { length: 255 }).notNull(),
})