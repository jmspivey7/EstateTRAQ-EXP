import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Lazy-initialize the database connection.
 * This prevents crashes during Next.js build when DATABASE_URL
 * isn't available yet (e.g., Replit's nix build step).
 *
 * Works with any standard PostgreSQL connection string:
 *   - Replit's built-in PostgreSQL
 *   - Neon serverless
 *   - Supabase, Railway, etc.
 */
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment variables or Replit Secrets."
    );
  }
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

// Use a proxy so the connection is only created when first accessed at runtime,
// not at import/build time.
let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) {
      _db = createDb();
    }
    return (_db as any)[prop];
  },
});

export type Database = ReturnType<typeof createDb>;
