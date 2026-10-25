import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pool } from "../src/infrastructure/db.js";
import { beforeAll, afterAll } from "vitest";

const migrationsDir = path.resolve(__dirname, "../../../database/migrations");

beforeAll(async () => {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
  }
});

afterAll(async () => {
  await pool.end();
});
