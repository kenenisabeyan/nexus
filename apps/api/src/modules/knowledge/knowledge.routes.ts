import { Router } from "express";
import { pool } from "../../infrastructure/db.js";
import { attachEvidence } from "./knowledge.helpers.js";
import type { KnowledgeItem, GraphNode, GraphEdge } from "@nexus/types";

export const knowledgeRouter = Router();

knowledgeRouter.get("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid item id" });

  const result = await pool.query<KnowledgeItem>("SELECT * FROM knowledge_items WHERE id = $1", [id]);
  const item = result.rows[0];
  if (!item) return res.status(404).json({ error: "Knowledge item not found" });

  res.json(await attachEvidence(item));
});

knowledgeRouter.get("/graph", async (_req, res) => {
  const nodes = await pool.query<GraphNode>(
    "SELECT id, title, category, severity, confidence, importance_rank FROM knowledge_items"
  );
  const edges = await pool.query<GraphEdge>(
    "SELECT item_id AS source, related_item_id AS target, relationship_type FROM relationships"
  );
  res.json({ nodes: nodes.rows, edges: edges.rows });
});
