-- 001_init.sql
-- Milestone 0: replaces the exec()-on-boot SQLite schema with a real,
-- versioned migration against PostgreSQL.
--
-- This schema is still a relational approximation of the Living Professional
-- Knowledge Graph concept (see ARCHITECTURE_STATUS.md, Section 7) — it is
-- NOT the temporal, versioned graph model the whitepaper describes. That is
-- explicitly out of scope for Milestone 0 and is scheduled for the
-- "Knowledge Graph" phase in IMPLEMENTATION_PLAN.md.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,               -- random session token
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('institutional', 'social', 'code')),
  trust_score REAL NOT NULL CHECK (trust_score >= 0 AND trust_score <= 1)
);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('urgent', 'notable', 'routine')),
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  importance_rank INTEGER NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  recommended_action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  stance TEXT NOT NULL CHECK (stance IN ('corroborates', 'contradicts')),
  url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relationships (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  related_item_id INTEGER NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('depends_on', 'supersedes', 'affects'))
);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_rank ON knowledge_items (importance_rank);
CREATE INDEX IF NOT EXISTS idx_evidence_item_id ON evidence (item_id);
CREATE INDEX IF NOT EXISTS idx_relationships_item_id ON relationships (item_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
