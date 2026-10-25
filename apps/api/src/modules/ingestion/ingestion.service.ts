import { pool } from "../../infrastructure/db.js";
import type { SourceAdapter } from "@nexus/source-adapters";

export interface IngestionResult {
  discovered: number;
  inserted: number;
  skippedDuplicates: number;
  errors: string[];
}

// Ensures a `sources` row exists for this adapter, returning its id.
// This is the join point between the adapter's identity and the trust
// registry described in ARCHITECTURE_STATUS.md — a source's trust_score
// here is still a placeholder (0.8) until Dynamic Trust Scoring (Phase 2)
// computes it for real. That is stated explicitly rather than left implicit.
async function ensureSourceRow(adapter: SourceAdapter): Promise<number> {
  const meta = adapter.getMetadata();
  const existing = await pool.query<{ id: number }>("SELECT id FROM sources WHERE name = $1", [meta.sourceName]);
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await pool.query<{ id: number }>(
    "INSERT INTO sources (name, category, trust_score) VALUES ($1, $2, $3) RETURNING id",
    [meta.sourceName, meta.category, 0.8] // placeholder trust score — see comment above
  );
  return inserted.rows[0].id;
}

// The real discover -> normalize -> dedupe -> store pipeline stage
// (master prompt Section 26), scoped for Milestone 1 to run synchronously
// on demand rather than on a schedule via a queue — see ADR 0006.
export async function runIngestion(adapter: SourceAdapter): Promise<IngestionResult> {
  const result: IngestionResult = { discovered: 0, inserted: 0, skippedDuplicates: 0, errors: [] };

  const sourceId = await ensureSourceRow(adapter);

  let rawItems;
  try {
    rawItems = await adapter.discover();
  } catch (err) {
    result.errors.push((err as Error).message);
    return result;
  }
  result.discovered = rawItems.length;

  for (const raw of rawItems) {
    try {
      const candidate = adapter.normalize(raw);

      // Real deduplication (master prompt Section 27): check by externalId
      // before inserting, rather than inserting first and cleaning up later.
      const existing = await pool.query("SELECT id FROM knowledge_items WHERE external_id = $1", [candidate.externalId]);
      if (existing.rows.length > 0) {
        result.skippedDuplicates += 1;
        continue;
      }

      const inserted = await pool.query<{ id: number }>(
        `INSERT INTO knowledge_items
          (title, summary, category, published_at, external_id, origin_url, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'unverified')
         RETURNING id`,
        [candidate.title, candidate.summary, candidate.category, candidate.publishedAt, candidate.externalId, candidate.originUrl]
      );

      await pool.query(
        "INSERT INTO evidence (item_id, source_id, stance, url) VALUES ($1, $2, 'corroborates', $3)",
        [inserted.rows[0].id, sourceId, candidate.originUrl]
      );

      result.inserted += 1;
    } catch (err) {
      result.errors.push(`Failed to process ${raw.externalId}: ${(err as Error).message}`);
    }
  }

  return result;
}
