// A deliberately thin wrapper — no new logic lives here, only HTTP calls to
// the real Nexus API endpoints already built and tested in apps/api. This
// mirrors the same shapes as apps/web/src/api.ts, kept separate because a
// plugin package should not depend on the web app.

export interface NexusClientOptions {
  apiUrl: string;
  fetchImpl?: typeof fetch;
}

export interface NexusEvidence {
  source_name: string;
  stance: "corroborates" | "contradicts";
  url: string;
  trust_score: number;
}

export interface NexusKnowledgeItem {
  id: number;
  title: string;
  summary: string;
  category: string;
  severity: "urgent" | "notable" | "routine";
  confidence: number;
  importance_rank: number;
  recommended_action: string;
  evidence: NexusEvidence[];
}

export class NexusApiError extends Error {}

export class NexusClient {
  private readonly apiUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: NexusClientOptions) {
    this.apiUrl = options.apiUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getDailyBriefing(): Promise<NexusKnowledgeItem[]> {
    const res = await this.fetchImpl(`${this.apiUrl}/briefing`);
    if (!res.ok) throw new NexusApiError(`Nexus briefing request failed: ${res.status}`);
    const data = (await res.json()) as { items: NexusKnowledgeItem[] };
    return data.items;
  }

  async search(query: string): Promise<NexusKnowledgeItem[]> {
    const res = await this.fetchImpl(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new NexusApiError(`Nexus search request failed: ${res.status}`);
    const data = (await res.json()) as { results: NexusKnowledgeItem[] };
    return data.results;
  }

  async getItem(id: number): Promise<NexusKnowledgeItem> {
    const res = await this.fetchImpl(`${this.apiUrl}/items/${id}`);
    if (res.status === 404) throw new NexusApiError(`Nexus knowledge item ${id} not found`);
    if (!res.ok) throw new NexusApiError(`Nexus item request failed: ${res.status}`);
    return (await res.json()) as NexusKnowledgeItem;
  }
}
