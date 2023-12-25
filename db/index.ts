import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
export const db = drizzle(sql, { schema });

export const migrateToLatest = async () => {
  await migrate(db, { migrationsFolder: "drizzle/migrations" });
};
