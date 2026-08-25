import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/pageindex_db?schema=public";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export const pool =
  globalForDb.pool ||
  new Pool({
    connectionString,
  });

export const db = globalForDb.db || drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
  globalForDb.db = db;
}
