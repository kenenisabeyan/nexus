import { GitHubReleasesAdapter, AtomFeedAdapter } from "@nexus/source-adapters";
import type { SourceAdapter } from "@nexus/source-adapters";
import { runIngestion } from "../modules/ingestion/ingestion.service.js";
import { logger } from "../infrastructure/logger.js";

const DEFAULT_INTERVAL_MINUTES = 15;

function getIntervalMs(): number {
  const envVal = process.env.INGESTION_INTERVAL_MINUTES;
  const parsed = envVal ? parseInt(envVal, 10) : DEFAULT_INTERVAL_MINUTES;
  return (isNaN(parsed) || parsed < 1 ? DEFAULT_INTERVAL_MINUTES : parsed) * 60 * 1000;
}

function getAdapters(): SourceAdapter[] {
  const adapters: SourceAdapter[] = [
    new GitHubReleasesAdapter({
      repo: process.env.GITHUB_INGEST_REPO || "facebook/react",
      token: process.env.GITHUB_TOKEN,
    }),
  ];

  if (process.env.ATOM_FEED_URL) {
    adapters.push(
      new AtomFeedAdapter({
        feedUrl: process.env.ATOM_FEED_URL,
        sourceName: process.env.ATOM_SOURCE_NAME || "Configured Atom Feed",
      })
    );
  }

  return adapters;
}

export async function runIngestionCycle(): Promise<void> {
  const adapters = getAdapters();
  logger.info("Starting scheduled ingestion cycle", { adapterCount: adapters.length });

  for (const adapter of adapters) {
    try {
      const health = await adapter.healthCheck();
      if (!health.healthy) {
        logger.warn(`Skipping ingestion for ${adapter.sourceName}: health check failed`, { detail: health.detail });
        continue;
      }

      logger.info(`Running ingestion cycle for ${adapter.sourceName}...`);
      const result = await runIngestion(adapter);

      logger.info(`Ingestion completed for ${adapter.sourceName}`, {
        discovered: result.discovered,
        inserted: result.inserted,
        skipped: result.skippedDuplicates,
        errorCount: result.errors.length,
      });
    } catch (err) {
      logger.error(`Error executing ingestion cycle for ${adapter.sourceName}`, err);
    }
  }
}

function startScheduler(): void {
  const intervalMs = getIntervalMs();
  logger.info(`Nexus Background Ingestion Scheduler started. Interval: ${intervalMs / 1000 / 60} minutes.`);

  // Initial immediate run
  runIngestionCycle().catch((err) => logger.error("Fatal error in initial ingestion cycle", err));

  // Recurring loop
  setInterval(() => {
    runIngestionCycle().catch((err) => logger.error("Fatal error in recurring ingestion cycle", err));
  }, intervalMs);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("scheduler.js") || process.argv[1]?.endsWith("scheduler.ts")) {
  startScheduler();
}
