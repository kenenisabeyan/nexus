# ADR 0001: TypeScript for both API and web

## Status
Accepted — implemented in Milestone 0.

## Context
The original prototype (`nexus-platform/`) was plain JavaScript on both the
Express backend and the React frontend. As the codebase grows toward the
28-agent architecture and multi-tenant data model described in the
whitepaper, the cost of catching type errors at compile time rather than in
production increases in value, and the cost of converting increases with
every file added.

## Decision
Convert both `apps/api` and `apps/web` to TypeScript now, before further
feature work, rather than deferring the conversion.

## Alternatives considered
- **Stay in JavaScript with JSDoc type annotations.** Rejected: JSDoc typing
  gives partial editor support but does not enforce type errors at build
  time the way `tsc` does, and the team already intends to use TypeScript
  per the master implementation prompt's technology baseline.
- **Defer conversion until Phase 3+.** Rejected: converting a larger
  codebase later is strictly more expensive than converting a ~20-file
  prototype now.

## Consequences
- All new code must be typed; `any` is not banned outright but is used
  sparingly (see `knowledge.helpers.ts` for the one deliberate `any` cast on
  raw `pg` query results, flagged for tightening in a later milestone).
- Build step is now required before `node` can run the API in production
  (`tsc` compiles to `dist/`); local development uses `tsx` for direct
  TypeScript execution without a separate build step.
