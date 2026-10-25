# ADR 0006: Synchronous, on-demand ingestion for Milestone 1 — no queue yet

## Status
Accepted — implemented in Milestone 1.

## Context
The master implementation prompt's full pipeline (Section 26) includes a
Queue stage between Discovery and Normalization. Section 44 simultaneously
warns against introducing infrastructure (Kafka, dedicated workers) before
a measured need exists.

## Decision
For Milestone 1, with exactly one source adapter and no scheduled polling
requirement yet, ingestion runs synchronously via a CLI script
(`pnpm --filter @nexus/api ingest -- --adapter=github-releases --repo=facebook/react`)
that calls `runIngestion()` directly. No queue, no worker process, no
scheduler exists yet.

## Alternatives considered
- **Introduce BullMQ/Redis now.** Rejected: there is exactly one adapter
  and no scheduled/recurring execution requirement yet. Queue
  infrastructure earns its complexity once (a) multiple adapters need to
  run concurrently without blocking each other, or (b) ingestion needs to
  run on a schedule rather than on demand — neither is true yet.
- **Kafka.** Rejected outright per Section 44 — no throughput requirement
  within an order of magnitude of justifying it.

## Consequences
- Ingestion is currently a manual, on-demand operation (`pnpm ingest`), not
  a background service. This is honestly reflected in
  `IMPLEMENTATION_LEDGER.md` — "ingestion" is not the same claim as
  "continuous ingestion."
- The `runIngestion()` function is written adapter-agnostically
  (`SourceAdapter` in, `IngestionResult` out) specifically so that wrapping
  it in a queue consumer later (Milestone 2+, once a second adapter or a
  scheduling requirement exists) requires no change to this function
  itself — only a new caller.
