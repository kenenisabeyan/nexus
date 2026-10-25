import { describe, it, expect, vi } from "vitest";
import { GitHubReleasesAdapter } from "./GitHubReleasesAdapter.js";
import { SourceRateLimitError } from "../types.js";

function mockResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: init.headers ?? {},
  });
}

describe("GitHubReleasesAdapter.normalize", () => {
  const adapter = new GitHubReleasesAdapter({ repo: "facebook/react" });

  it("is a pure function — same input always produces same output, no network call", () => {
    const raw = {
      externalId: "github:facebook/react:release:1",
      url: "https://github.com/facebook/react/releases/tag/v19.1.0",
      raw: {
        id: 1,
        html_url: "https://github.com/facebook/react/releases/tag/v19.1.0",
        tag_name: "v19.1.0",
        name: "React 19.1.0",
        body: "Stable compiler-driven memoization.",
        published_at: "2026-08-07T14:00:00Z",
        created_at: "2026-08-07T13:00:00Z",
      },
    };
    const result1 = adapter.normalize(raw);
    const result2 = adapter.normalize(raw);
    expect(result1).toEqual(result2);
    expect(result1.title).toBe("facebook/react: React 19.1.0");
    expect(result1.externalId).toBe("github:facebook/react:release:1");
  });

  it("falls back to tag_name when release name is null", () => {
    const raw = {
      externalId: "github:facebook/react:release:2",
      url: "https://github.com/facebook/react/releases/tag/v19.1.1",
      raw: {
        id: 2, html_url: "x", tag_name: "v19.1.1", name: null, body: null,
        published_at: null, created_at: "2026-08-08T00:00:00Z",
      },
    };
    const result = adapter.normalize(raw);
    expect(result.title).toBe("facebook/react: v19.1.1");
    expect(result.summary).toContain("no description");
    expect(result.publishedAt).toBe("2026-08-08T00:00:00Z"); // falls back to created_at
  });

  it("truncates an overly long release body to 500 characters", () => {
    const longBody = "x".repeat(2000);
    const raw = {
      externalId: "github:facebook/react:release:3",
      url: "https://github.com/facebook/react/releases/tag/v19.1.2",
      raw: {
        id: 3, html_url: "x", tag_name: "v19.1.2", name: "R", body: longBody,
        published_at: "2026-08-09T00:00:00Z", created_at: "2026-08-09T00:00:00Z",
      },
    };
    const result = adapter.normalize(raw);
    expect(result.summary.length).toBe(500);
  });
});

describe("GitHubReleasesAdapter.discover", () => {
  it("parses real-shaped GitHub API responses into RawDiscoveredItem[]", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse(
        [{ id: 42, html_url: "https://github.com/x/y/releases/tag/v1", tag_name: "v1", name: "V1", body: "notes", published_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z" }],
        { headers: { "x-ratelimit-limit": "60", "x-ratelimit-remaining": "59", "x-ratelimit-reset": "9999999999" } }
      )
    );
    const adapter = new GitHubReleasesAdapter({ repo: "x/y", fetchImpl: fetchImpl as unknown as typeof fetch });
    const items = await adapter.discover();
    expect(items).toHaveLength(1);
    expect(items[0].externalId).toBe("github:x/y:release:42");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/x/y/releases?per_page=10",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/vnd.github+json" }) })
    );
  });

  it("throws SourceRateLimitError with parsed reset time when the API returns 403 with rate-limit headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse(
        { message: "API rate limit exceeded" },
        { status: 403, headers: { "x-ratelimit-limit": "60", "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1786536218" } }
      )
    );
    const adapter = new GitHubReleasesAdapter({ repo: "x/y", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(adapter.discover()).rejects.toThrow(SourceRateLimitError);
    await expect(adapter.discover()).rejects.toMatchObject({
      status: { limit: 60, remaining: 0 },
    });
  });

  it("includes an Authorization header when a token is provided", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockResponse([]));
    const adapter = new GitHubReleasesAdapter({ repo: "x/y", token: "ghp_test123", fetchImpl: fetchImpl as unknown as typeof fetch });
    await adapter.discover();
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer ghp_test123" }) })
    );
  });
});

describe("GitHubReleasesAdapter.healthCheck", () => {
  it("reports healthy when the repo endpoint responds OK", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockResponse({ full_name: "x/y" }));
    const adapter = new GitHubReleasesAdapter({ repo: "x/y", fetchImpl: fetchImpl as unknown as typeof fetch });
    const result = await adapter.healthCheck();
    expect(result.healthy).toBe(true);
  });

  it("reports unhealthy on a network error rather than throwing", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const adapter = new GitHubReleasesAdapter({ repo: "x/y", fetchImpl: fetchImpl as unknown as typeof fetch });
    const result = await adapter.healthCheck();
    expect(result.healthy).toBe(false);
    expect(result.detail).toContain("ECONNREFUSED");
  });
});
