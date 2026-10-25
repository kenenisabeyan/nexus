// The common contract every source integration must implement — per
// master implementation prompt Section 25. Nothing in the ingestion
// pipeline is allowed to depend on source-specific logic directly; it
// depends on this interface only.

export interface RawDiscoveredItem {
  /** Stable identifier from the origin platform, used for deduplication. */
  externalId: string;
  /** Canonical URL to the original content. */
  url: string;
  /** Raw, unprocessed payload as returned by the source — kept for
   * provenance, per master prompt Section 8 ("do not lose the original
   * source context"). */
  raw: unknown;
}

export interface NormalizedKnowledgeCandidate {
  externalId: string;
  originUrl: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string; // ISO 8601
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  /** ISO 8601 timestamp of when the limit resets. */
  resetAt: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  detail: string;
}

export class SourceRateLimitError extends Error {
  constructor(public readonly status: RateLimitStatus) {
    super(`Rate limit exceeded: ${status.remaining}/${status.limit}, resets at ${status.resetAt}`);
    this.name = "SourceRateLimitError";
  }
}

export interface SourceAdapter {
  /** Machine-readable identifier for this adapter, e.g. "github-releases". */
  readonly id: string;
  /** Human-readable source name, matches a row in the `sources` table. */
  readonly sourceName: string;

  /** Finds new raw items from the configured target (e.g. a specific repo). */
  discover(): Promise<RawDiscoveredItem[]>;

  /** Converts a raw discovered item into the common normalized shape.
   * Must be a pure function — no network calls — so it is unit-testable
   * without hitting the real source. */
  normalize(raw: RawDiscoveredItem): NormalizedKnowledgeCandidate;

  /** Returns adapter metadata for observability/debugging. */
  getMetadata(): { id: string; sourceName: string; category: "institutional" | "social" | "code" };

  /** Returns the adapter's current understanding of its rate limit budget.
   * May return null if the source does not expose this information. */
  getRateLimits(): Promise<RateLimitStatus | null>;

  /** Verifies the adapter can currently reach its source. */
  healthCheck(): Promise<HealthCheckResult>;
}
