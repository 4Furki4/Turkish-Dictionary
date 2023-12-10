import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";
import { words } from "./words";
import { meanings } from "./meanings";
import { partOfSpeechs } from "./part_of_speechs";
import { roots } from "./roots";
import { authors } from "./authors";
import { examples } from "./examples";

export const actionsEnum = pgEnum("action", ["create", "update", "delete"]);

export const entityTypesEnum = pgEnum("entity_type", [
  "words",
  "meanings",
  "roots",
  "related_words",
  "part_of_speechs",
  "examples",
  "authors",
  "word_attributes",
  "meaning_attributes",
]);

export const statusEnum = pgEnum("status", ["pending", "approved", "rejected"]);

export type Status = (typeof statusEnum.enumValues)[number];

export type EntityTypes = (typeof entityTypesEnum.enumValues)[number];

export type Actions = (typeof actionsEnum.enumValues)[number];

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  entityType: entityTypesEnum("entity_type").notNull(),
  requestableId: integer("entity_id"),
  action: actionsEnum("action").notNull(),
  newData: jsonb("new_data"),
  requestDate: timestamp("request_date").defaultNow(),
  status: statusEnum("status").default("pending"),
});

export const requestsRelations = relations(requests, ({ one }) => ({
  user: one(users, {
    fields: [requests.userId],
    references: [users.id],
  }),
  word: one(words, {
    fields: [requests.requestableId, requests.entityType],
    references: [words.id, words.requestType],
  }),
  meaning: one(meanings, {
    fields: [requests.requestableId, requests.entityType],
    references: [meanings.id, meanings.requestType],
  }),
  partOfSpeech: one(partOfSpeechs, {
    fields: [requests.requestableId, requests.entityType],
    references: [partOfSpeechs.id, partOfSpeechs.requestType],
  }),
  root: one(roots, {
    fields: [requests.requestableId, requests.entityType],
    references: [roots.id, roots.requestType],
  }),
  author: one(authors, {
    fields: [requests.requestableId, requests.entityType],
    references: [authors.id, authors.requestType],
  }),
  example: one(examples, {
    fields: [requests.requestableId, requests.entityType],
    references: [examples.id, examples.requestType],
  }),
}));

export type SelectRequest = {
  id: number;
  userId: string;
  entityType: EntityTypes;
  entityId: number;
  action: Actions;
  newData: any;
  requestDate: Date;
  status: Status;
};

export type InsertRequest = {
  userId: string;
  entityType: EntityTypes;
  entityId: number;
  action: Actions;
  newData: any;
  requestDate: Date;
  status: Status;
};
