import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";
import { users } from "./schema/users";
import { words } from "./schema/words";
import { relatedWords } from "./schema/related_words";
import { roots } from "./schema/roots";
import { savedWords } from "./schema/saved_words";
import { meanings } from "./schema/meanings";
import { examples } from "./schema/examples";
import { authors } from "./schema/authors";
import { wordAttributes } from "./schema/word_attributes";
import { meaningAttributes } from "./schema/meaning_attributes";
import { partOfSpeechs } from "./schema/part_of_speechs";
import { requests } from "./schema/requests";
import { env } from "@/src/env.mjs";
export const schema = {
  users,
  words,
  relatedWords,
  roots,
  savedWords,
  meanings,
  examples,
  authors,
  wordAttributes,
  meaningAttributes,
  partOfSpeechs,
  requests,
};

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};
const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });

export const migrateToLatest = async () => {
  await migrate(db, { migrationsFolder: "drizzle/migrations" });
};

