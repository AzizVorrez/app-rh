import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Don't throw at import time so `next build` works without a DB.
  // Any actual query will fail clearly at runtime if the URL is missing.
  console.warn("[db] DATABASE_URL is not set — database queries will fail.");
}

// Reuse the postgres-js client across hot reloads / serverless invocations.
const globalForDb = globalThis as unknown as {
  __izichangeClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__izichangeClient ??
  postgres(connectionString ?? "postgres://invalid:invalid@localhost:5432/invalid", {
    max: 1, // serverless-friendly: one connection per lambda
    prepare: false, // compatible with transaction-mode poolers (pgBouncer/Supabase/Neon)
    idle_timeout: 20,
    connect_timeout: 15,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__izichangeClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
