import { describe, it, expect, vi } from "vitest";
import { NexusClient, NexusApiError } from "../src/nexusClient.js";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const sampleItem = {
  id: 1,
  title: "Sample vulnerability disclosed",
  summary: "A summary.",
  category: "Security",
  severity: "urgent" as const,
  confidence: 0.9,
  importance_rank: 1,
  recommended_action: "Upgrade now.",
  evidence: [{ source_name: "NVD", stance: "corroborates" as const, url: "https://example.org", trust_score: 0.99 }],
};

describe("NexusClient", () => {
  it("fetches and unwraps the daily briefing's items array", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ generated_at: "2026-01-01", items: [sampleItem] }));
    const client = new NexusClient({ apiUrl: "http://localhost:4000/api", fetchImpl });

    const items = await client.getDailyBriefing();
    expect(items).toEqual([sampleItem]);
    expect(fetchImpl).toHaveBeenCalledWith("http://localhost:4000/api/briefing");
  });

  it("strips a trailing slash from apiUrl so requests don't end up with a double slash", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    const client = new NexusClient({ apiUrl: "http://localhost:4000/api/", fetchImpl });

    await client.getDailyBriefing();
    expect(fetchImpl).toHaveBeenCalledWith("http://localhost:4000/api/briefing");
  });

  it("throws NexusApiError with the status code when the briefing request fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    const client = new NexusClient({ apiUrl: "http://localhost:4000/api", fetchImpl });

    await expect(client.getDailyBriefing()).rejects.toThrow(NexusApiError);
    await expect(client.getDailyBriefing()).rejects.toThrow(/500/);
  });

  it("URL-encodes the search query", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ query: "a b", results: [] }));
    const client = new NexusClient({ apiUrl: "http://localhost:4000/api", fetchImpl });

    await client.search("a b&c");
    expect(fetchImpl).toHaveBeenCalledWith("http://localhost:4000/api/search?q=a%20b%26c");
  });

  it("unwraps the search results array", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ query: "x", results: [sampleItem] }));
    const client = new NexusClient({ apiUrl: "http://localhost:4000/api", fetchImpl });

    expect(await client.search("x")).toEqual([sampleItem]);
  });

  it("throws a specific NexusApiError message on a 404 item lookup, distinct from other failures", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    const client = new NexusClient({ apiUrl: "http://localhost:4000/api", fetchImpl });

    await expect(client.getItem(999)).rejects.toThrow(/not found/);
  });

  it("returns the item directly (not wrapped) on a successful item lookup", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(sampleItem));
    const client = new NexusClient({ apiUrl: "http://localhost:4000/api", fetchImpl });

    expect(await client.getItem(1)).toEqual(sampleItem);
  });
});
