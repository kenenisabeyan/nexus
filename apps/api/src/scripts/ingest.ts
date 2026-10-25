import { GitHubReleasesAdapter, AtomFeedAdapter } from "@nexus/source-adapters";
import type { SourceAdapter } from "@nexus/source-adapters";
import { runIngestion } from "../modules/ingestion/ingestion.service.js";
import { pool } from "../infrastructure/db.js";

function parseArg(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

async function main() {
  const adapterName = parseArg("adapter", "github-releases");

  let adapter: SourceAdapter;
  if (adapterName === "github-releases") {
    const repo = parseArg("repo", "facebook/react")!;
    adapter = new GitHubReleasesAdapter({ repo, token: process.env.GITHUB_TOKEN });
  } else if (adapterName === "atom") {
    const feedUrl = parseArg("feed-url");
    const sourceName = parseArg("source-name", "Atom Feed")!;
    if (!feedUrl) {
      console.error("Usage: --adapter=atom --feed-url=<url> [--source-name=<name>]");
      process.exit(1);
    }
    adapter = new AtomFeedAdapter({ feedUrl, sourceName });
  } else {
    console.error(`Unknown adapter: ${adapterName}. Available: "github-releases", "atom".`);
    process.exit(1);
  }

  const health = await adapter.healthCheck();
  console.log(`Health check: ${health.healthy ? "OK" : "FAILED"} — ${health.detail}`);
  if (!health.healthy) {
    await pool.end();
    process.exit(1);
  }

  const rateLimit = await adapter.getRateLimits();
  if (rateLimit) {
    console.log(`Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining, resets ${rateLimit.resetAt}`);
  } else {
    console.log("Rate limit: not exposed by this source (expected for Atom feeds).");
  }

  console.log(`Running ingestion for ${adapter.sourceName}...`);
  const result = await runIngestion(adapter);

  console.log(`Discovered: ${result.discovered}`);
  console.log(`Inserted (new): ${result.inserted}`);
  console.log(`Skipped (already known): ${result.skippedDuplicates}`);
  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.length}`);
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
