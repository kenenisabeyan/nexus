import { Router } from "express";
import { pool } from "../../infrastructure/db.js";
import { attachEvidence } from "../knowledge/knowledge.helpers.js";
import type { KnowledgeItem, BriefingResponse } from "@nexus/types";

export const briefingRouter = Router();

briefingRouter.get("/", async (_req, res) => {
  // Only verification_status = 'verified' items reach the daily briefing —
  // freshly ingested items (Milestone 1's GitHub adapter) are correctly
  // NOT shown here until real verification (Phase 2) exists. See
  // database/migrations/002_ingestion_support.sql.
  const result = await pool.query<KnowledgeItem>(
    "SELECT * FROM knowledge_items WHERE verification_status = 'verified' ORDER BY importance_rank ASC"
  );
  const items = await Promise.all(result.rows.map(attachEvidence));
  const payload: BriefingResponse = { generated_at: new Date().toISOString(), items };
  res.json(payload);
});
