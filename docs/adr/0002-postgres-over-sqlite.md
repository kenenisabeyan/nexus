# ADR 0002: PostgreSQL over SQLite

## Status
Accepted — implemented in Milestone 0.

## Context
The original prototype used `better-sqlite3` against a single file on disk.
This is appropriate for a local, single-process demo and wrong for anything
with concurrent writers, multiple environments (dev/staging/prod), or a
path to the multi-tenant model described in the whitepaper.

## Decision
Migrate to PostgreSQL 16, with a real, tracked migration system
(`apps/api/src/infrastructure/migrate.ts` + `database/migrations/*.sql`)
replacing the previous `exec()`-on-boot schema definition.

## Alternatives considered
- **Keep SQLite, add `litestream` or similar for replication.** Rejected:
  solves durability but not concurrent-write throughput, and the team
  already expects to need Postgres-native features (pgvector, proper
  concurrent transactions) in Phase 1+.
- **Jump straight to a managed cloud Postgres (RDS/Cloud SQL).** Rejected
  for Milestone 0 specifically: no staging or production environment exists
  yet to justify cloud infrastructure spend; local Postgres via
  `docker-compose.yml` (or, in this sandboxed environment, via `apt`) is
  sufficient until Milestone 0's deployment work begins.

## Consequences
- `docker-compose.yml` added for local development.
- A real migration runner exists and is tested (`pnpm migrate` applies
  tracked, ordered `.sql` files exactly once, recorded in a
  `schema_migrations` table).
- Every table now has explicit `CHECK` constraints on enum-like columns
  (`severity`, `stance`, `relationship_type`, `category`), which SQLite's
  looser typing did not enforce as strictly.
