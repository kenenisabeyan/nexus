import { Router } from "express";
import { pool } from "../../infrastructure/db.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateVerifyInput } from "../../middleware/validation.middleware.js";
import { logger } from "../../infrastructure/logger.js";
import type { KnowledgeItem } from "@nexus/types";

export const ingestionRouter = Router();

// Listing pending items requires reviewer or admin role
ingestionRouter.get("/pending", requireAuth, requireRole("reviewer", "admin"), async (_req, res) => {
  const result = await pool.query<KnowledgeItem>(
    "SELECT * FROM knowledge_items WHERE verification_status = 'unverified' ORDER BY published_at DESC"
  );
  res.json({ pending: result.rows });
});

// Verify or Reject pending knowledge item
ingestionRouter.post("/:id/verify", requireAuth, requireRole("reviewer", "admin"), validateVerifyInput, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid item id" });

  const { status, rejection_reason, severity, confidence, importance_rank, recommended_action } = req.body ?? {};
  const reviewerId = req.user?.id;

  if (status === "rejected") {
    const result = await pool.query(
      `UPDATE knowledge_items
       SET verification_status = 'rejected',
           reviewer_id = $1,
           rejection_reason = $2,
           reviewed_at = NOW()
       WHERE id = $3 AND verification_status = 'unverified'
       RETURNING id`,
      [reviewerId, rejection_reason, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found or already processed" });
    }

    logger.info(`Knowledge item rejected by reviewer`, { userId: reviewerId, itemId: id, reason: rejection_reason });
    return res.json({ ok: true, id, status: "rejected" });
  }

  // Status is 'verified'
  const defaultSeverity = severity || "notable";
  const defaultConfidence = typeof confidence === "number" ? confidence : 0.85;
  const defaultRank = typeof importance_rank === "number" ? importance_rank : 5;
  const defaultAction = recommended_action || "Review newly verified intelligence update.";

  const result = await pool.query(
    `UPDATE knowledge_items
     SET severity = $1,
         confidence = $2,
         importance_rank = $3,
         recommended_action = $4,
         verification_status = 'verified',
         reviewer_id = $5,
         reviewed_at = NOW()
     WHERE id = $6 AND verification_status = 'unverified'
     RETURNING id`,
    [defaultSeverity, defaultConfidence, defaultRank, defaultAction, reviewerId, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Item not found or already processed" });
  }

  logger.info(`Knowledge item verified by reviewer`, { userId: reviewerId, itemId: id });
  res.json({ ok: true, id, status: "verified" });
});

