import { Config, defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({
  path: ".env.local",
});
console.log("process.env.DATABASE_URL", process.env.DATABASE_URL);
export default defineConfig({
  schema: "./db/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: true,
  },
  verbose: true,
  strict: true,
  out: "./drizzle/migrations",
}) satisfies Config;
