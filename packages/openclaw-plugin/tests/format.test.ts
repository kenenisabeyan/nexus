import { describe, it, expect } from "vitest";
import { formatBriefing, formatSearchResults, formatItemDetail } from "../src/format.js";
import type { NexusKnowledgeItem } from "../src/nexusClient.js";

function makeItem(overrides: Partial<NexusKnowledgeItem> = {}): NexusKnowledgeItem {
  return {
    id: 1,
    title: "Critical advisory",
    summary: "Something important happened.",
    category: "Security",
    severity: "urgent",
    confidence: 0.87,
    importance_rank: 1,
    recommended_action: "Patch immediately.",
    evidence: [
      { source_name: "NVD", stance: "corroborates", url: "https://example.org/nvd", trust_score: 0.99 },
      { source_name: "Random Blog", stance: "contradicts", url: "https://example.org/blog", trust_score: 0.4 },
    ],
    ...overrides,
  };
}

describe("formatBriefing", () => {
  it("returns a clear empty-state message when there are no items, rather than an empty string", () => {
    expect(formatBriefing([])).toMatch(/no verified items/i);
  });

  it("includes the item count in the header", () => {
    const text = formatBriefing([makeItem(), makeItem({ id: 2 })]);
    expect(text).toContain("2 verified items");
  });

  it("uses singular 'item' for exactly one result, not '1 items'", () => {
    const text = formatBriefing([makeItem()]);
    expect(text).toContain("1 verified item:");
    expect(text).not.toContain("1 verified items");
  });

  it("includes confidence as a whole-number percentage, not a raw 0-1 fraction", () => {
    const text = formatBriefing([makeItem({ confidence: 0.87 })]);
    expect(text).toContain("87%");
    expect(text).not.toContain("0.87");
  });

  it("includes the recommended action so the agent can relay it without a second tool call", () => {
    const text = formatBriefing([makeItem({ recommended_action: "Patch immediately." })]);
    expect(text).toContain("Patch immediately.");
  });
});

describe("formatSearchResults", () => {
  it("names the query in the empty-state message so 'no results' is unambiguous about what was searched", () => {
    const text = formatSearchResults("nonexistent thing", []);
    expect(text).toContain('"nonexistent thing"');
    expect(text).toMatch(/no verified/i);
  });

  it("includes the query and result count in the header", () => {
    const text = formatSearchResults("react", [makeItem(), makeItem({ id: 2 })]);
    expect(text).toContain('"react"');
    expect(text).toContain("(2)");
  });
});

describe("formatItemDetail", () => {
  it("includes every evidence source with its stance and trust score", () => {
    const text = formatItemDetail(makeItem());
    expect(text).toContain("[corroborates] NVD (trust 99%)");
    expect(text).toContain("[contradicts] Random Blog (trust 40%)");
  });

  it("includes the evidence count in the section header", () => {
    const text = formatItemDetail(makeItem());
    expect(text).toContain("Evidence (2):");
  });

  it("includes category, severity, and confidence together on one line for quick scanning", () => {
    const text = formatItemDetail(makeItem({ category: "Security", severity: "urgent", confidence: 0.87 }));
    expect(text).toContain("Category: Security · Severity: urgent · Confidence: 87%");
  });
});
