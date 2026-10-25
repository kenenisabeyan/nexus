import pg from "pg";

const { Pool } = pg;

// Real PostgreSQL connection pool. Configuration comes entirely from
// environment variables (see .env.example) — no hardcoded credentials,
// per Rule 2 of the master implementation prompt.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  // A background/idle client error should not crash the process, but must
  // not be swallowed silently either.
  // eslint-disable-next-line no-console
  console.error("Unexpected error on idle Postgres client", err);
});

export async function query<T = unknown>(text: string, params: unknown[] = []) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const durationMs = Date.now() - start;
  if (durationMs > 200) {
    // Cheap, real observability signal: flag slow queries in logs now,
    // before a proper metrics pipeline exists (see ARCHITECTURE_STATUS.md,
    // Section 6 — Observability is NOT_STARTED as of Milestone 0).
    // eslint-disable-next-line no-console
    console.warn(`[slow query ${durationMs}ms] ${text}`);
  }
  return result as unknown as { rows: T[] };
}
