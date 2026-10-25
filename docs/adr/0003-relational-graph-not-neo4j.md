# ADR 0003: Relational modeling for the knowledge graph, not Neo4j, for now

## Status
Accepted for Milestone 0–3. Explicitly revisitable.

## Context
The whitepaper describes a "Living Professional Knowledge Graph." The
master implementation prompt explicitly warns against introducing a graph
database "merely because the product contains a knowledge graph" (Section
17) and instructs that graph-database adoption be benchmarked against real
query patterns, not assumed.

## Decision
Model entities and relationships as relational tables in PostgreSQL
(`knowledge_items`, `relationships`) through at least Phase 3 (Knowledge
Graph phase in `IMPLEMENTATION_PLAN.md`). Revisit Neo4j (or another graph
database) only once real multi-hop traversal query patterns exist in
production and can be benchmarked against the relational approach.

## Alternatives considered
- **Adopt Neo4j immediately.** Rejected per the master prompt's explicit
  instruction and because no real traversal-heavy query pattern exists yet
  to justify the operational cost of running a second database engine.
- **Use a relational graph extension (e.g. Apache AGE on Postgres).**
  Deferred, not rejected: worth evaluating at the point this ADR is
  revisited, as it would avoid a second database engine while adding
  Cypher-like query capability.

## Consequences
- Multi-hop queries (e.g. "everything three relationships away from X") are
  currently expensive (recursive CTEs) rather than native, and this cost is
  accepted deliberately for now.
- The relational schema does not yet model temporal validity
  (`valid_from`/`valid_to`) or relationship confidence scores — both are
  scoped to the Phase 3 Knowledge Graph milestone, not Milestone 0.
