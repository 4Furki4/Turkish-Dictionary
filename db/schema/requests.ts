import {
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  entityType: varchar("entity_type").notNull(),
  entityId: text("entity_id"),
  action: varchar("action").notNull(),
  newData: jsonb("new_data"),
  requestDate: timestamp("request_date").defaultNow(),
  status: varchar("status").default("pending"),
});
