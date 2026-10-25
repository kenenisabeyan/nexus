-- 002_ingestion_support.sql
-- Milestone 1: real source adapters produce raw ingested items that have
-- NOT been through verification, classification, or impact-analysis yet
-- (those are Phase 2/4 work — see IMPLEMENTATION_PLAN.md). It would be
-- dishonest to require severity/confidence/importance_rank/recommended_action
-- on a freshly ingested item, since nothing in this codebase computes those
-- values yet for real. This migration makes that distinction explicit in
-- the schema rather than papering over it with fabricated defaults.

ALTER TABLE knowledge_items
  ALTER COLUMN severity DROP NOT NULL,
  ALTER COLUMN confidence DROP NOT NULL,
  ALTER COLUMN importance_rank DROP NOT NULL,
  ALTER COLUMN recommended_action DROP NOT NULL;

ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS origin_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'verified'));

-- Only verified items are eligible for the daily briefing / search surfaces
-- a user actually sees — see apps/api/src/modules/briefing/briefing.routes.ts
-- and search.routes.ts, both updated in this migration's accompanying code
-- change to filter on this column.
CREATE INDEX IF NOT EXISTS idx_knowledge_items_verification_status ON knowledge_items (verification_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_external_id ON knowledge_items (external_id);
