import {
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { feedbackVotes } from "./feedback_votes";

// Define enums for feedback type and status to ensure data consistency.
export const feedbackTypeEnum = pgEnum("feedback_type", ["bug", "feature", "other"]);
export const feedbackStatusEnum = pgEnum("feedback_status", [
    "open",
    "in_progress",
    "closed",
]);

export const feedbacks = pgTable("feedbacks", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id") // Keep as varchar to match the users table's uuid
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: feedbackTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: feedbackStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relationships for querying with Drizzle.
export const feedbacksRelations = relations(feedbacks, ({ one, many }) => ({
    // A piece of feedback belongs to one user.
    user: one(users, {
        fields: [feedbacks.userId],
        references: [users.id],
    }),
    // A piece of feedback can have many votes.
    votes: many(feedbackVotes),
}));
