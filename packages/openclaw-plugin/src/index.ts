import { Type, type Static } from "typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { NexusClient, NexusApiError } from "./nexusClient.js";
import { formatBriefing, formatSearchResults, formatItemDetail } from "./format.js";

interface NexusPluginConfig {
  apiUrl?: string;
}

const SearchParams = Type.Object({ query: Type.String({ description: "Search keywords" }) });
const ItemDetailParams = Type.Object({ id: Type.Number({ description: "Nexus knowledge item ID" }) });

export default definePluginEntry({
  id: "nexus",
  name: "Nexus",
  description: "Verified professional knowledge intelligence — daily briefing, search, and evidence trails.",
  register(api) {
    const config = (api.config ?? {}) as NexusPluginConfig;
    const apiUrl = config.apiUrl ?? process.env.NEXUS_API_URL ?? "http://localhost:4000/api";
    const client = new NexusClient({ apiUrl });

    api.registerTool({
      name: "nexus_daily_briefing",
      label: "Nexus Daily Briefing",
      description:
        "Get today's Nexus daily briefing: verified, ranked professional knowledge items with confidence scores and evidence.",
      parameters: Type.Object({}),
      async execute() {
        try {
          const items = await client.getDailyBriefing();
          const text = formatBriefing(items);
          return {
            content: [{ type: "text", text }],
            details: { itemCount: items.length, summary: text.slice(0, 200) },
          };
        } catch (err) {
          const message = err instanceof NexusApiError ? err.message : "Failed to reach the Nexus API.";
          return { content: [{ type: "text", text: `Nexus error: ${message}` }], details: { itemCount: 0, summary: message } };
        }
      },
    });

    api.registerTool({
      name: "nexus_search",
      label: "Nexus Search",
      description: "Search Nexus's verified knowledge base by keyword, technology, or category.",
      parameters: SearchParams,
      // The explicit Static<typeof SearchParams> annotation is required here,
      // not decorative — registerTool's parameter type is a union
      // (AnyAgentTool | OpenClawPluginToolFactory), and TypeScript cannot
      // reliably infer a generic's type argument through contextual typing
      // against a union, so `params` silently widens to `unknown` without it.
      async execute(_id, params: Static<typeof SearchParams>) {
        try {
          const items = await client.search(params.query);
          const text = formatSearchResults(params.query, items);
          return {
            content: [{ type: "text", text }],
            details: { resultCount: items.length, summary: text.slice(0, 200) },
          };
        } catch (err) {
          const message = err instanceof NexusApiError ? err.message : "Failed to reach the Nexus API.";
          return { content: [{ type: "text", text: `Nexus error: ${message}` }], details: { resultCount: 0, summary: message } };
        }
      },
    });

    api.registerTool({
      name: "nexus_item_detail",
      label: "Nexus Item Detail",
      description: "Get the full evidence trail and recommended action for a single Nexus knowledge item by ID.",
      parameters: ItemDetailParams,
      async execute(_id, params: Static<typeof ItemDetailParams>) {
        try {
          const item = await client.getItem(params.id);
          const text = formatItemDetail(item);
          return {
            content: [{ type: "text", text }],
            details: { found: true, summary: text.slice(0, 200) },
          };
        } catch (err) {
          const message = err instanceof NexusApiError ? err.message : "Failed to reach the Nexus API.";
          return { content: [{ type: "text", text: `Nexus error: ${message}` }], details: { found: false, summary: message } };
        }
      },
    });
  },
});
