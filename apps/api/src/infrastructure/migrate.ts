import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "./db.js";

// Deliberately minimal migration runner rather than a heavy framework
// dependency — per the master prompt's anti-overengineering instruction
// (Section 44), this is proportionate to a single-service Milestone 0.
// Revisit if/when multiple services need to share migration tooling.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../../../database/migrations");

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const applied = new Set(
    (await pool.query("SELECT filename FROM schema_migrations")).rows.map(
      (r: { filename: string }) => r.filename
    )
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`apply ${file}`);
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await pool.query("COMMIT");
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(`FAILED applying ${file}`);
      throw err;
    }
  }

  console.log("Migrations complete.");
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
