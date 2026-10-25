import { XMLParser } from "fast-xml-parser";
import type {
  SourceAdapter,
  RawDiscoveredItem,
  NormalizedKnowledgeCandidate,
  RateLimitStatus,
  HealthCheckResult,
} from "../types.js";

// A second, genuinely different-shaped source, chosen specifically to test
// whether the SourceAdapter interface actually generalizes or merely fits
// the one adapter it was designed against. GitHubReleasesAdapter is JSON
// over a REST API with header-based rate limiting; this is XML over a
// plain content feed with no rate-limit headers at all.
//
// Works against any standard Atom feed — GitHub is the concrete example
// used for live verification, since its release feeds are public and
// reachable from this environment without authentication.

interface AtomEntry {
  id: string;
  updated: string;
  title: string;
  link?: { "@_href"?: string } | Array<{ "@_href"?: string; "@_rel"?: string }>;
  content?: string | { "#text"?: string };
  author?: { name?: string };
}

interface AtomFeed {
  feed?: {
    entry?: AtomEntry | AtomEntry[];
  };
}

export interface AtomFeedAdapterOptions {
  feedUrl: string;
  sourceName: string;
  fetchImpl?: typeof fetch;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractLink(entry: AtomEntry): string {
  if (Array.isArray(entry.link)) {
    const alt = entry.link.find((l) => l["@_rel"] === "alternate") ?? entry.link[0];
    return alt?.["@_href"] ?? "";
  }
  return entry.link?.["@_href"] ?? "";
}

function extractContent(entry: AtomEntry): string {
  if (typeof entry.content === "string") return entry.content;
  return entry.content?.["#text"] ?? "";
}

export class AtomFeedAdapter implements SourceAdapter {
  readonly id: string;
  readonly sourceName: string;
  private readonly feedUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly parser = new XMLParser({ ignoreAttributes: false });

  constructor(options: AtomFeedAdapterOptions) {
    this.feedUrl = options.feedUrl;
    this.sourceName = options.sourceName;
    this.id = `atom:${options.sourceName.toLowerCase().replace(/\s+/g, "-")}`;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async discover(): Promise<RawDiscoveredItem[]> {
    const res = await this.fetchImpl(this.feedUrl, { redirect: "follow" });
    if (!res.ok) {
      throw new Error(`Atom feed request failed: ${res.status} ${res.statusText}`);
    }
    const xml = await res.text();
    const parsed = this.parser.parse(xml) as AtomFeed;
    const entries = parsed.feed?.entry;
    const list = Array.isArray(entries) ? entries : entries ? [entries] : [];

    return list.map((entry) => ({
      externalId: `${this.id}:${entry.id}`,
      url: extractLink(entry),
      raw: entry,
    }));
  }

  normalize(raw: RawDiscoveredItem): NormalizedKnowledgeCandidate {
    const entry = raw.raw as AtomEntry;
    const rawContent = extractContent(entry);
    const summary = decodeEntities(stripHtml(rawContent)).slice(0, 500) || "No description provided.";

    return {
      externalId: raw.externalId,
      originUrl: raw.url,
      title: `${this.sourceName}: ${entry.title}`,
      summary,
      category: "Releases",
      publishedAt: entry.updated,
    };
  }

  getMetadata() {
    return { id: this.id, sourceName: this.sourceName, category: "code" as const };
  }

  async getRateLimits(): Promise<RateLimitStatus | null> {
    // Plain Atom feeds do not expose rate-limit information the way
    // GitHub's REST API does — returning null here is the honest answer,
    // not a bug. This is the untested `null` path the GitHub adapter's own
    // tests never exercise; this adapter's tests do.
    return null;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const res = await this.fetchImpl(this.feedUrl, { method: "HEAD", redirect: "follow" });
      if (res.ok) return { healthy: true, detail: `Reached ${this.feedUrl}` };
      return { healthy: false, detail: `HTTP ${res.status} from ${this.feedUrl}` };
    } catch (err) {
      return { healthy: false, detail: `Network error: ${(err as Error).message}` };
    }
  }
}
