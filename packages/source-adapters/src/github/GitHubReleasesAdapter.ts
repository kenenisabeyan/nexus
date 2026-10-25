import type {
  SourceAdapter,
  RawDiscoveredItem,
  NormalizedKnowledgeCandidate,
  RateLimitStatus,
  HealthCheckResult,
} from "../types.js";
import { SourceRateLimitError } from "../types.js";

interface GitHubReleaseApiResponse {
  id: number;
  html_url: string;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  created_at: string;
}

export interface GitHubReleasesAdapterOptions {
  /** e.g. "facebook/react" */
  repo: string;
  /** Optional PAT for authenticated requests (5000/hr vs 60/hr unauthenticated).
   * Read from environment, never hardcoded — see .env.example. */
  token?: string;
  fetchImpl?: typeof fetch;
}

// Real adapter against the real GitHub REST API (releases endpoint).
// No mocking, no fabricated data — this makes an actual HTTP request to
// api.github.com. See packages/source-adapters/src/github/github.test.ts
// for the unit-testable pure functions (normalize) tested without network,
// and IMPLEMENTATION_LEDGER.md for the live-run evidence from this session.
export class GitHubReleasesAdapter implements SourceAdapter {
  readonly id = "github-releases";
  readonly sourceName = "GitHub Releases";
  private readonly repo: string;
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;
  private lastRateLimit: RateLimitStatus | null = null;

  constructor(options: GitHubReleasesAdapterOptions) {
    this.repo = options.repo;
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    return headers;
  }

  private captureRateLimit(res: Response): void {
    const limit = res.headers.get("x-ratelimit-limit");
    const remaining = res.headers.get("x-ratelimit-remaining");
    const reset = res.headers.get("x-ratelimit-reset");
    if (limit && remaining && reset) {
      this.lastRateLimit = {
        limit: Number(limit),
        remaining: Number(remaining),
        resetAt: new Date(Number(reset) * 1000).toISOString(),
      };
    }
  }

  async discover(): Promise<RawDiscoveredItem[]> {
    const url = `https://api.github.com/repos/${this.repo}/releases?per_page=10`;
    const res = await this.fetchImpl(url, { headers: this.headers() });
    this.captureRateLimit(res);

    if (res.status === 403 || res.status === 429) {
      if (this.lastRateLimit) throw new SourceRateLimitError(this.lastRateLimit);
      throw new Error(`GitHub API rate limit or access error: ${res.status}`);
    }
    if (!res.ok) {
      throw new Error(`GitHub API request failed: ${res.status} ${res.statusText}`);
    }

    const releases = (await res.json()) as GitHubReleaseApiResponse[];
    return releases.map((release) => ({
      externalId: `github:${this.repo}:release:${release.id}`,
      url: release.html_url,
      raw: release,
    }));
  }

  normalize(raw: RawDiscoveredItem): NormalizedKnowledgeCandidate {
    const release = raw.raw as GitHubReleaseApiResponse;
    const title = release.name?.trim() || release.tag_name;
    const bodySnippet = (release.body ?? "").trim().slice(0, 500);
    return {
      externalId: raw.externalId,
      originUrl: raw.url,
      title: `${this.repo}: ${title}`,
      summary: bodySnippet.length > 0 ? bodySnippet : `Release ${release.tag_name} published with no description.`,
      category: "Releases",
      publishedAt: release.published_at ?? release.created_at,
    };
  }

  getMetadata() {
    return { id: this.id, sourceName: this.sourceName, category: "code" as const };
  }

  async getRateLimits(): Promise<RateLimitStatus | null> {
    if (this.lastRateLimit) return this.lastRateLimit;
    const res = await this.fetchImpl("https://api.github.com/rate_limit", { headers: this.headers() });
    if (!res.ok) return null;
    const body = (await res.json()) as { resources: { core: { limit: number; remaining: number; reset: number } } };
    const core = body.resources.core;
    return { limit: core.limit, remaining: core.remaining, resetAt: new Date(core.reset * 1000).toISOString() };
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const res = await this.fetchImpl(`https://api.github.com/repos/${this.repo}`, { headers: this.headers() });
      if (res.ok) return { healthy: true, detail: `Reached api.github.com for ${this.repo}` };
      return { healthy: false, detail: `HTTP ${res.status} from api.github.com` };
    } catch (err) {
      return { healthy: false, detail: `Network error: ${(err as Error).message}` };
    }
  }
}
