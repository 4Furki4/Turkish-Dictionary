import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

const sql = postgres(process.env.DB_URL!, { max: 1 });
export const db = drizzle(sql, { schema });

await migrate(db, { migrationsFolder: "drizzle/migrations" });