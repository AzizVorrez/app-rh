import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js stocke les variables dans .env.local — dotenv/config ne lit que .env
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: false,
  strict: false,
});
