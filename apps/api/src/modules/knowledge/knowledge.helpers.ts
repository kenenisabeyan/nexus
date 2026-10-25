import { pool } from "../../infrastructure/db.js";
import type { KnowledgeItem, KnowledgeItemDetail } from "@nexus/types";

export async function attachEvidence(item: KnowledgeItem): Promise<KnowledgeItemDetail> {
  const evidence = await pool.query(
    `SELECT evidence.stance, evidence.url, sources.name AS source_name,
            sources.category AS source_category, sources.trust_score
     FROM evidence
     JOIN sources ON sources.id = evidence.source_id
     WHERE evidence.item_id = $1`,
    [item.id]
  );
  const related = await pool.query(
    `SELECT knowledge_items.id, knowledge_items.title, relationships.relationship_type
     FROM relationships
     JOIN knowledge_items ON knowledge_items.id = relationships.related_item_id
     WHERE relationships.item_id = $1`,
    [item.id]
  );
  return { ...item, evidence: evidence.rows as any, related: related.rows as any };
}
