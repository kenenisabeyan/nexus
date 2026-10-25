// Shared domain types — the single source of truth for the shape of a
// Knowledge Object, Source, Evidence record, and Relationship, used by both
// apps/api and apps/web so the two cannot silently drift apart.

export type Severity = "urgent" | "notable" | "routine";
export type SourceCategory = "institutional" | "social" | "code";
export type EvidenceStance = "corroborates" | "contradicts";
export type RelationshipType = "depends_on" | "supersedes" | "affects";
export type UserRole = "user" | "reviewer" | "admin";
export type VerificationStatus = "unverified" | "verified" | "rejected";

export interface Source {
  id: number;
  name: string;
  category: SourceCategory;
  trust_score: number; // 0.0–1.0
}

export interface Evidence {
  source_name: string;
  source_category: SourceCategory;
  stance: EvidenceStance;
  url: string;
  trust_score: number;
}

export interface RelatedItem {
  id: number;
  title: string;
  relationship_type: RelationshipType;
}

export interface KnowledgeItem {
  id: number;
  title: string;
  summary: string;
  category: string;
  severity?: Severity | null;
  confidence?: number | null; // 0.0–1.0
  importance_rank?: number | null;
  published_at: string;
  recommended_action?: string | null;
  verification_status?: VerificationStatus;
  external_id?: string | null;
  origin_url?: string | null;
  reviewer_id?: number | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
}

export interface KnowledgeItemDetail extends KnowledgeItem {
  evidence: Evidence[];
  related: RelatedItem[];
}

export interface BriefingResponse {
  generated_at: string;
  items: KnowledgeItemDetail[];
}

export interface SearchResponse {
  query: string;
  results: KnowledgeItemDetail[];
}

export interface GraphNode {
  id: number;
  title: string;
  category: string;
  severity?: Severity | null;
  confidence?: number | null;
  importance_rank?: number | null;
}

export interface GraphEdge {
  source: number;
  target: number;
  relationship_type: RelationshipType;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Auth & Permissions
export interface PublicUser {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface VerifyActionPayload {
  status: "verified" | "rejected";
  rejection_reason?: string;
  confidence?: number;
  severity?: Severity;
}

