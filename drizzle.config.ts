import { Config, defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
});
export default defineConfig({
  schema: "./db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DB_URL as string,
    ssl: true,
  },
  verbose: true,
  strict: true,
  out: "./drizzle/migrations",
}) satisfies Config;
