
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { requests } from "./requests";
import { relations } from "drizzle-orm";

export const contributionLogs = pgTable("contribution_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  requestId: integer("request_id")
    .notNull()
    .references(() => requests.id),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const contributionLogsRelations = relations(contributionLogs, ({ one }) => ({
  user: one(users, {
    fields: [contributionLogs.userId],
    references: [users.id],
  }),
  request: one(requests, {
    fields: [contributionLogs.requestId],
    references: [requests.id],
  }),
}));
