import { Config, defineConfig } from "drizzle-kit";
import { env } from "process";
export default defineConfig({
  schema: "./db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: env.DB_URL!,
  },
  verbose: true,
  strict: true,
  out: "./drizzle/migrations",
}) satisfies Config;
