import type { NexusKnowledgeItem } from "./nexusClient.js";

const SEVERITY_LABEL: Record<NexusKnowledgeItem["severity"], string> = {
  urgent: "🔴 URGENT",
  notable: "🔵 Notable",
  routine: "⚪ Routine",
};

export function formatBriefingItem(item: NexusKnowledgeItem): string {
  const confidencePct = Math.round(item.confidence * 100);
  return [
    `${item.importance_rank}. ${SEVERITY_LABEL[item.severity]} — ${item.title}`,
    `   ${item.summary}`,
    `   Confidence: ${confidencePct}% (${item.evidence.length} source${item.evidence.length === 1 ? "" : "s"}) · Action: ${item.recommended_action}`,
  ].join("\n");
}

export function formatBriefing(items: NexusKnowledgeItem[]): string {
  if (items.length === 0) {
    return "Nexus has no verified items in today's briefing.";
  }
  const header = `Nexus Daily Briefing — ${items.length} verified item${items.length === 1 ? "" : "s"}:\n`;
  return header + items.map(formatBriefingItem).join("\n\n");
}

export function formatSearchResults(query: string, items: NexusKnowledgeItem[]): string {
  if (items.length === 0) {
    return `No verified Nexus knowledge items match "${query}".`;
  }
  const header = `Nexus search results for "${query}" (${items.length}):\n`;
  return header + items.map(formatBriefingItem).join("\n\n");
}

export function formatItemDetail(item: NexusKnowledgeItem): string {
  const evidenceLines = item.evidence
    .map((e) => `  - [${e.stance}] ${e.source_name} (trust ${Math.round(e.trust_score * 100)}%): ${e.url}`)
    .join("\n");
  return [
    `${item.title}`,
    `Category: ${item.category} · Severity: ${item.severity} · Confidence: ${Math.round(item.confidence * 100)}%`,
    "",
    item.summary,
    "",
    `Recommended action: ${item.recommended_action}`,
    "",
    `Evidence (${item.evidence.length}):`,
    evidenceLines,
  ].join("\n");
}
