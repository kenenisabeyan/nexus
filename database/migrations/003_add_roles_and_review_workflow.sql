-- 003_add_roles_and_review_workflow.sql
-- Hardening & Human Review Workflow:
-- 1. Adds user roles (user, reviewer, admin) to enforce role-based access control.
-- 2. Enhances knowledge_items table with reviewer audit trail (reviewer_id, rejection_reason, reviewed_at)
--    and expands verification_status to include 'rejected'.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'reviewer', 'admin'));

-- Update knowledge_items verification_status check constraint to accept 'rejected'
ALTER TABLE knowledge_items
  DROP CONSTRAINT IF EXISTS knowledge_items_verification_status_check;

ALTER TABLE knowledge_items
  ADD CONSTRAINT knowledge_items_verification_status_check
  CHECK (verification_status IN ('unverified', 'verified', 'rejected'));

ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_reviewer_id ON knowledge_items (reviewer_id);
