import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { AtomFeedAdapter } from "./AtomFeedAdapter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The literal, unmodified response captured live from
// https://github.com/facebook/react/releases.atom (re-captured fresh after
// a full sandbox reset lost the first copy — see IMPLEMENTATION_LEDGER.md).
// Testing against a real captured response, rather than hand-written XML,
// catches shape mismatches a hand-written fixture would hide.
const realFixture = readFileSync(path.join(__dirname, "fixtures/react-releases.atom.xml"), "utf8");

function mockTextResponse(body: string, status = 200) {
  return new Response(body, { status });
}

describe("AtomFeedAdapter", () => {
  it("discovers entries from a real captured GitHub Atom feed", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockTextResponse(realFixture));
    const adapter = new AtomFeedAdapter({
      feedUrl: "https://github.com/facebook/react/releases.atom",
      sourceName: "React Releases (Atom)",
      fetchImpl,
    });

    const items = await adapter.discover();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].externalId).toMatch(/^atom:react-releases-\(atom\):/);
    expect(items[0].url).toContain("github.com/react/react/releases/tag/");
  });

  it("normalizes an entry, stripping HTML tags and decoding entities from the content field", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockTextResponse(realFixture));
    const adapter = new AtomFeedAdapter({
      feedUrl: "https://github.com/facebook/react/releases.atom",
      sourceName: "React Releases (Atom)",
      fetchImpl,
    });
    const items = await adapter.discover();
    const normalized = adapter.normalize(items[0]);

    expect(normalized.title).toContain("React Releases (Atom):");
    expect(normalized.summary).not.toMatch(/<[^>]+>/);
    expect(normalized.summary).not.toMatch(/&lt;|&gt;|&amp;/);
    expect(normalized.summary.length).toBeLessThanOrEqual(500);
  });

  it("normalize() is pure — same input always produces the same output", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockTextResponse(realFixture));
    const adapter = new AtomFeedAdapter({
      feedUrl: "https://github.com/facebook/react/releases.atom",
      sourceName: "React Releases (Atom)",
      fetchImpl,
    });
    const items = await adapter.discover();
    expect(adapter.normalize(items[0])).toEqual(adapter.normalize(items[0]));
  });

  it("handles a feed with exactly one entry (parser returns an object, not an array, in this case)", async () => {
    const singleEntryFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>tag:example.com,2026:1</id>
    <updated>2026-01-01T00:00:00Z</updated>
    <link rel="alternate" type="text/html" href="https://example.com/1"/>
    <title>Single Entry</title>
    <content type="html">Some content</content>
  </entry>
</feed>`;
    const fetchImpl = vi.fn().mockResolvedValue(mockTextResponse(singleEntryFeed));
    const adapter = new AtomFeedAdapter({ feedUrl: "https://example.com/feed.atom", sourceName: "Example", fetchImpl });

    const items = await adapter.discover();
    expect(items).toHaveLength(1);
  });

  it("handles an empty feed (zero entries) without throwing", async () => {
    const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>`;
    const fetchImpl = vi.fn().mockResolvedValue(mockTextResponse(emptyFeed));
    const adapter = new AtomFeedAdapter({ feedUrl: "https://example.com/feed.atom", sourceName: "Example", fetchImpl });

    const items = await adapter.discover();
    expect(items).toEqual([]);
  });

  it("throws a clear error when the feed request fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockTextResponse("Not Found", 404));
    const adapter = new AtomFeedAdapter({ feedUrl: "https://example.com/missing.atom", sourceName: "Example", fetchImpl });

    await expect(adapter.discover()).rejects.toThrow(/404/);
  });

  it("getRateLimits returns null — the honest answer for a source with no rate-limit headers", async () => {
    const adapter = new AtomFeedAdapter({ feedUrl: "https://example.com/feed.atom", sourceName: "Example" });
    expect(await adapter.getRateLimits()).toBeNull();
  });

  it("healthCheck fails gracefully (does not throw) on network error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("simulated network failure"));
    const adapter = new AtomFeedAdapter({ feedUrl: "https://example.com/feed.atom", sourceName: "Example", fetchImpl });

    const result = await adapter.healthCheck();
    expect(result.healthy).toBe(false);
    expect(result.detail).toMatch(/simulated network failure/);
  });

  it("getMetadata reports category 'code', matching GitHubReleasesAdapter's category for the same kind of source", () => {
    const adapter = new AtomFeedAdapter({ feedUrl: "https://example.com/feed.atom", sourceName: "Example" });
    expect(adapter.getMetadata().category).toBe("code");
  });
});
