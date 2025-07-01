// db/schema/request_votes.ts
import { relations } from "drizzle-orm";
import { integer, serial, pgTable, text } from "drizzle-orm/pg-core";
import { requests } from "./requests";
import { users } from "./users";

export const request_votes = pgTable(
  "request_votes",
  {
    id: serial("id").primaryKey(),
    request_id: integer("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vote_type: integer("vote_type").notNull(),
  }
);

export const requestVotesRelations = relations(request_votes, ({ one }) => ({
  request: one(requests, {
    fields: [request_votes.request_id],
    references: [requests.id],
  }),
  user: one(users, {
    fields: [request_votes.user_id],
    references: [users.id],
  }),
}));

