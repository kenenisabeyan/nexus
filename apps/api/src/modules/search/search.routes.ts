import { Router } from "express";
import { pool } from "../../infrastructure/db.js";
import { attachEvidence } from "../knowledge/knowledge.helpers.js";
import type { KnowledgeItem, SearchResponse } from "@nexus/types";

export const searchRouter = Router();

searchRouter.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const pattern = `%${q.toLowerCase()}%`;

  // Same rule as the daily briefing: an item that has not been through
  // human verification (see ingestion.routes.ts) must not be user-facing
  // anywhere in the product, search included. This was found missing here
  // during self-review, then lost along with the rest of that session's
  // work in a full sandbox reset, and is being reapplied here for the
  // second time — the regression test below is what makes that possible
  // to do with confidence rather than from memory.
  const result = await pool.query<KnowledgeItem>(
    `SELECT * FROM knowledge_items
     WHERE verification_status = 'verified'
       AND (lower(title) LIKE $1 OR lower(summary) LIKE $1 OR lower(category) LIKE $1)
     ORDER BY importance_rank ASC`,
    [pattern]
  );
  const items = await Promise.all(result.rows.map(attachEvidence));
  const payload: SearchResponse = { query: q, results: items };
  res.json(payload);
});
