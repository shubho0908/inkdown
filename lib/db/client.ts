import "server-only";

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "@/lib/db/schema";

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Set it to your Neon Postgres connection string.",
    );
  }

  return url;
}

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: getDatabaseUrl(),
});

export const db = drizzle(pool, { schema });

export function isDatabaseConfigured() {
  return Boolean(
    process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
  );
}
