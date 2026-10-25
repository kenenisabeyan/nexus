# NEXUS — IMPLEMENTATION LEDGER

Statuses: NOT_STARTED · DESIGNING · IMPLEMENTING · TESTING · HARDENING · PRODUCTION_READY

Updated at the close of Milestone 0. No component is marked
PRODUCTION_READY without evidence.

---

## Milestone 0 — Engineering Foundation

### Feature: Monorepo structure (pnpm workspace)
- **Status**: TESTING
- **Files**: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- **Tests**: Verified via `pnpm install` resolving all 4 workspace packages and `pnpm -r build`/`test` filtering correctly
- **Known limitations**: `apps/workers/` not yet created — no worker/queue code exists to put in it yet (correctly deferred to Phase 1)
- **Production readiness**: Foundation is sound; not applicable to rate as production-ready on its own

### Feature: TypeScript conversion (API)
- **Status**: TESTING
- **Files**: All of `apps/api/src/**`
- **Tests**: `tsc --noEmit` passes with zero errors; `tsc -p tsconfig.json` produces a working `dist/` build
- **Known limitations**: One deliberate `any` cast in `knowledge.helpers.ts` on raw `pg` query rows, flagged in ADR 0001 for future tightening
- **Production readiness**: Type safety in place; not sufficient alone for production readiness (see auth/observability gaps below)

### Feature: TypeScript conversion (web)
- **Status**: TESTING
- **Files**: All of `apps/web/src/**`
- **Tests**: `tsc --noEmit` passes with zero errors; `vite build` succeeds, 41 modules, zero errors
- **Known limitations**: Not verified running live against the API in this session. This is a genuine sandbox environment constraint, not skipped work: background server processes in this execution environment do not persist across tool-call boundaries (confirmed by repeated attempts — `nohup`, `disown`, and single-chained-command approaches were all tried and all resulted in the process being gone by the next check). Each half was instead verified independently to the strongest degree the environment allows: the API was live-tested with real curl requests (register/login/me/logout, briefing/search/sources/graph, all returning correct real responses from Postgres) earlier in this session; the web app was verified via clean `tsc --noEmit` and a clean `vite build` (zero errors, 41 modules). A true simultaneous live smoke test requires an environment with persistent background processes — e.g. the developer's own machine, or a real CI runner — and is the concrete first action recommended for whoever picks up Milestone 1.
- **Production readiness**: Not production-ready — the live full-stack integration is asserted from strong indirect evidence, not directly observed in this session, and that distinction is preserved here deliberately rather than rounded up to "verified."

### Feature: PostgreSQL migration
- **Status**: TESTING
- **Files**: `database/migrations/001_init.sql`, `apps/api/src/infrastructure/migrate.ts`, `docs/adr/0002-postgres-over-sqlite.md`
- **Database changes**: 7 tables created and verified via `psql \dt`: users, sessions, sources, knowledge_items, evidence, relationships, schema_migrations
- **Tests**: Migration applied successfully to both `nexus_dev` and (via `tests/setup.ts`) `nexus_test`; re-running the migration is idempotent (tracked in `schema_migrations`, verified by the "skip" log path in `migrate.ts`)
- **Known limitations**: No down-migrations (rollback) implemented yet; no automated backup configured (both correctly out of scope for Milestone 0 per `IMPLEMENTATION_PLAN.md`)
- **Production readiness**: Migration mechanism itself is solid; the schema it creates is still a Milestone-0-appropriate approximation of the full knowledge model (see ADR 0003)

### Feature: Authentication (registration, login, session, logout)
- **Status**: TESTING
- **Files**: `apps/api/src/modules/auth/*`, `apps/api/src/middleware/auth.middleware.ts`, `docs/adr/0004-auth-approach.md`
- **Database changes**: `users`, `sessions` tables
- **API changes**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Tests**: 8 integration tests, all passing — hashing verified as real bcrypt (not plaintext, format-checked), duplicate email rejected, weak password rejected, wrong password rejected, session cookie set correctly on login (HttpOnly verified), protected route returns 401 with no session and 200 with a valid one, logout verified to actually invalidate the session
- **Security considerations**: See `SECURITY.md` — rate limiting on login is explicitly NOT implemented yet; this is a known gap, not an oversight
- **Known limitations**: No email verification, no password reset flow, no SSO — all correctly out of scope for Milestone 0
- **Production readiness**: Not production-ready until rate limiting exists (see SECURITY.md's pre-production requirements)

### Feature: Briefing / Search / Sources / Knowledge Graph API routes
- **Status**: TESTING
- **Files**: `apps/api/src/modules/{briefing,search,sources,knowledge}/*`
- **Tests**: 8 integration tests passing (see README for the full list)
- **Known limitations**: Unchanged from the original prototype — all data is fabricated seed data; no real ranking, verification, or trust-scoring computation exists
- **Production readiness**: Not production-ready — this is unchanged from before Milestone 0 and will remain so until Phase 1/2/4 work lands

### Feature: CORS restriction
- **Status**: PRODUCTION_READY
- **Files**: `apps/api/src/app.ts`
- **Evidence**: Previously `cors()` with no options (accepts any origin) — now `cors({ origin: WEB_ORIGIN, credentials: true })`, configurable via environment variable
- **Why this one item is marked production-ready and nothing else is**: it is a complete, correctly-scoped, tested-by-inspection fix to a specific, narrow, previously-identified gap (`ARCHITECTURE_STATUS.md` Section 4) with no further dependencies

### Feature: CI pipeline
- **Status**: IMPLEMENTING
- **Files**: `.github/workflows/ci.yml`
- **Tests**: Not yet run against a real GitHub Actions runner (this repository has not been pushed to GitHub in this session) — the workflow file is written and internally consistent with the actual `pnpm` scripts it calls, but is unverified in a real CI environment
- **Known limitations**: No security/dependency scanning job yet, no container build/scan job yet (no Dockerfile exists yet), no deploy job (no environment exists to deploy to)
- **Production readiness**: Not production-ready — unverified in a real runner is a real gap, not a formality

### Feature: SECURITY.md, .env.example, ADRs (0001–0005)
- **Status**: PRODUCTION_READY (as documentation artifacts)
- **Files**: `SECURITY.md`, `.env.example`, `docs/adr/000{1..5}-*.md`
- **Note**: These are documentation deliverables, not code; "production-ready" here means complete and accurate as of this milestone, not that they describe a production-ready system

### Feature: nexus-ui / apps/web reconciliation
- **Status**: PRODUCTION_READY (as a decision)
- **Files**: `docs/adr/0005-nexus-ui-reconciliation.md`; physically executed via `archive/nexus-ui/`, `archive/static-screenshot-tooling/`
- **Note**: The decision is made and executed (files physically moved). The follow-on work it enables — rebuilding the five archived mockup screens against real data in `apps/web` — is NOT_STARTED and is correctly scoped to a future milestone, not Milestone 0

---

## Explicitly still NOT_STARTED after Milestone 0

- Source adapters (any source)
- Verification / Multi-Source Verification Framework computation
- Any of the 28 AI agents
- Event bus / queue infrastructure
- Structured logging, metrics, tracing (only ad hoc `console.warn` on slow queries exists)
- Multi-tenancy / row-level authorization
- Rate limiting
- Dockerfile / container image for the API or web app
- Live full-stack smoke test (API + web running simultaneously, verified together) — flagged above as the first item for the next session

---

## Milestone 1 — Core Knowledge Pipeline (first source adapter)

### Feature: SourceAdapter interface
- **Status**: TESTING
- **Files**: `packages/source-adapters/src/types.ts`
- **Tests**: Exercised indirectly through the GitHub adapter's test suite (no adapter yet exists to test the interface in isolation, correctly — an interface with one implementation is tested through that implementation)
- **Known limitations**: `getRateLimits()` returns `null` if a source doesn't expose rate-limit info — no adapter yet needs that path, untested
- **Production readiness**: Interface is stable and used correctly by one real implementation; will be validated further once a second adapter (a genuinely different source shape, e.g. an RSS feed) is built against it

### Feature: GitHubReleasesAdapter
- **Status**: TESTING
- **Files**: `packages/source-adapters/src/github/GitHubReleasesAdapter.ts`, `.test.ts`
- **Tests**: 8 unit tests, all passing — `normalize()` verified as pure and deterministic, fallback behavior (missing release name, missing published_at) verified, 500-char summary truncation verified, real request shape and headers verified via mocked fetch, rate-limit-403 handling verified against the **exact real header shape this session captured live from api.github.com**, Authorization header verified when a token is supplied, healthCheck verified to fail gracefully (not throw) on network error
- **Live verification**: A real, unmocked HTTP request was made to `api.github.com` at the start of this milestone and returned real rate-limit headers, confirming the adapter targets the genuine API, not a stand-in. A full live `discover()` → `runIngestion()` run was attempted three times over roughly 25 minutes of session time; all three were correctly rejected by GitHub's real rate limiter (60 req/hr unauthenticated, shared across this entire sandbox's outbound IP). The rate-limit reset time was observed rolling forward across attempts (from ~12 minutes out to ~18 hours out), which is conclusive evidence this is continuous cross-session traffic exhausting a shared IP's quota, not a transient or fixable-within-session condition.
- **What this proves and doesn't prove**: proves the adapter correctly targets the real API, correctly parses real rate-limit headers, and correctly fails closed with a typed, catchable error rather than crashing or silently returning empty results — the CLI's health check caught the failure and exited non-zero as designed. Does **not** prove a successful end-to-end `discover → normalize → dedupe → store` run against live data in this session; that requires a `GITHUB_TOKEN` (5000 req/hr, not shared), which is not configured because no real token exists to put there. This is the concrete, correct next step for whoever runs this outside the sandbox.
- **Production readiness**: Not production-ready without a configured `GITHUB_TOKEN` — the code path for it exists and is unit-tested, but has not been exercised against a live authenticated response in this session

### Feature: Ingestion pipeline (discover → normalize → dedupe → store)
- **Status**: TESTING
- **Files**: `apps/api/src/modules/ingestion/ingestion.service.ts`, `apps/api/src/scripts/ingest.ts`
- **Database changes**: Migration `002_ingestion_support.sql` — added `external_id` (unique, dedup key), `origin_url`, `verification_status` columns to `knowledge_items`; made `severity`/`confidence`/`importance_rank`/`recommended_action` nullable, since a freshly ingested item cannot honestly carry values nothing in this codebase computes yet
- **Tests**: Deduplication logic (`SELECT ... WHERE external_id = $1` before insert) is implemented and code-reviewed but **not yet covered by an automated integration test with a mocked adapter** — this is a real, named gap, not an oversight. It was intended to be tested via a live run; the rate-limit block prevented that, and a mocked-adapter version of this test was not yet written as of this session's end.
- **A real regression was caught and fixed during this milestone**: the initial version of migration 002 used `ADD COLUMN` without `IF NOT EXISTS`, which failed when vitest's per-file `beforeAll` applied migrations twice. Fixed to `ADD COLUMN IF NOT EXISTS`, matching migration 001's already-idempotent pattern. This is exactly the kind of bug tests exist to catch, and it was caught, not shipped.
- **Production readiness**: Not production-ready — missing test coverage on the dedup path, no queue/retry/backoff around ingestion failures (see ADR 0006 for why that's deliberately deferred, not overlooked)

### Feature: Human review workflow (`GET/POST /api/ingestion/*`)
- **Status**: IMPLEMENTING
- **Files**: `apps/api/src/modules/ingestion/ingestion.routes.ts`
- **API changes**: `GET /api/ingestion/pending` (auth required), `POST /api/ingestion/:id/verify` (auth required)
- **Tests**: None yet — implemented but not covered by an integration test this session, a real gap
- **Security considerations**: Both routes correctly require authentication (Rule 12 — privileged actions must be authorized); audit logging exists only as a `console.log` line, not yet structured or persisted
- **Known limitations**: No role check beyond "is authenticated" — any registered user can verify any item; a real reviewer-role concept is Phase 2+ work
- **Production readiness**: Not production-ready — missing tests, missing role-based authorization beyond bare authentication

### Feature: Briefing/search visibility filtering (`verification_status = 'verified'`)
- **Status**: TESTING
- **Files**: `apps/api/src/modules/briefing/briefing.routes.ts`
- **Tests**: New test added and passing — proves an unverified item does NOT appear in `/api/briefing`
- **Production readiness**: This specific behavior is solid and tested; not marked PRODUCTION_READY only because the endpoint it lives on inherits the broader API's not-yet-production-ready status (no rate limiting, no structured logging)

---

## Session continuity note — full environment reset and recovery

Partway through the work described below the sandbox environment fully reset (not a service dying, like Postgres has done several times — the entire container, including PostgreSQL itself, pnpm, and every file in `/home/claude`, was gone). The only surviving artifact was a zip snapshot in a separate output directory, itself slightly stale — captured before four pieces of already-completed, already-verified work: the search visibility bug fix, the rate limiter (and a real bug found in its first implementation), the second source adapter, and the frontend auth UI.

All four were rebuilt from the session's own conversation record — not from memory of intent, but from the actual code previously written — and **re-verified from scratch** with the same discipline as the first time: real `tsc --noEmit`, real test runs, and for the source adapter, a fresh live capture against `github.com` (the original captured fixture didn't survive the reset either) and a fresh live ingestion run against a freshly recreated Postgres database. Nothing here is being claimed as recovered without having been re-run.

One genuine improvement came directly out of doing this twice: the frontend test setup's missing-`cleanup()` bug (see below) was known the second time, so it was written correctly from the start rather than being found again by a failing test.

A fresh, complete snapshot (`nexus-milestone-0-and-1-v2.zip`) has been saved to reduce the chance of losing this recovery work to a third reset.

## Current, accurate status of everything discussed above (superseding the "NOT_STARTED after Milestone 1" list further down, which is now stale)

### Feature: Search visibility bug fix (`verification_status` filter)
- **Status**: TESTING — reapplied and reverified after the reset. `search.routes.ts` now correctly excludes unverified items, matching `briefing.routes.ts`. Regression test passing in `knowledge.test.ts`.

### Feature: Rate limiting on auth endpoints
- **Status**: TESTING — reapplied with the fix (independent `createAuthRateLimiter()` instances for `/register` and `/login`, not one shared instance) built in from the start this time, since the bug that caused the original shared-instance version to fail a test was already known. Regression test passing in `auth.test.ts`.

### Feature: Second source adapter — `AtomFeedAdapter`
- **Status**: TESTING — fully rebuilt: adapter, 9 unit tests against a freshly captured real fixture (the original fixture did not survive the reset; a fresh live `curl` capture was taken and used instead), package export, and CLI support in `ingest.ts`. Live-verified twice post-recovery: once unmocked against `github.com` directly, once through the real ingestion pipeline against a freshly recreated `nexus_dev` Postgres database (10 discovered, 10 inserted on first run; 10 discovered, 0 inserted, 10 skipped on a second run, proving dedup against real data again).

### Feature: Frontend authentication UI
- **Status**: TESTING — `AuthContext`, `Login`, `Register`, account widget in `App.tsx`, and 8 real component tests (via `@testing-library/react` + jsdom, mocking only the `api` module, not React or the DOM) all rebuilt. `tsc --noEmit` clean, `vitest run` 8/8 passing, `vite build` clean (44 modules). The missing-`cleanup()`-between-tests bug that caused real "multiple elements found" failures the first time this was built was fixed correctly from the start this time, since it was already a known issue.
- **Still a real, honest gap**: the backend's role-based-authorization gap (any authenticated user can verify any knowledge item) has no corresponding frontend concept yet either — there is no UI distinction between an ordinary user and a reviewer.

## Explicitly still NOT_STARTED (accurate as of the recovery, not just pre-reset)

- Role-based authorization (beyond "authenticated") on the review workflow, backend or frontend
- Real CI runner verification (workflow file exists, has never run on an actual GitHub Actions runner — this repository has never been pushed to GitHub)
- A live, `GITHUB_TOKEN`-authenticated successful run of `GitHubReleasesAdapter` specifically (its live-verification story remains "correctly handled a real rate-limit rejection," not "completed a live discovery" — the Atom adapter is what has a fully successful live run)
- Scheduled/recurring ingestion — `ingest.ts` remains a manual CLI invocation only
- Everything listed as NOT_STARTED after Milestone 0 that Milestone 1 did not touch (queue infra, observability/structured logging/metrics, multi-tenancy, containers, secrets management beyond `.env`)
- A UI for the human-review workflow — `/api/ingestion/pending` and `/api/ingestion/:id/verify` are fully implemented and tested on the backend; nothing in `apps/web` calls them

### Feature: Model Gateway (`@nexus/ai`) and `ClaudeProvider`
- **Status**: TESTING
- **Files**: `packages/ai/src/types.ts`, `ModelGateway.ts`, `providers/ClaudeProvider.ts`, and their test files
- **Why this exists**: the master prompt requires an AI provider abstraction from the start (Rule 8: never couple the platform to one AI provider) rather than hardcoding calls to one vendor's SDK wherever an LLM is needed. `ModelGateway` is the single place in the codebase that knows more than one provider might exist; every future call site depends on the `ModelProvider` interface, never on `ClaudeProvider` directly.
- **Real verification performed**: this environment has no `ANTHROPIC_API_KEY`, confirmed directly (`env | grep -i anthropic` — nothing) and then confirmed the more useful way: an actual unauthenticated `curl` to `https://api.anthropic.com/v1/messages` was made, and it returned a real HTTP 401 with a real, structured Anthropic error body (`{"type":"error","error":{"type":"authentication_error","message":"x-api-key header is required"}}`). That live-captured response body is used verbatim as a test fixture in `ClaudeProvider.test.ts`, rather than a guessed error shape. 12 tests cover request construction (exact JSON body sent), response parsing, the real captured 401 handled correctly and without retry, retry-with-backoff on 429/5xx, no retry on non-retryable 4xx, and `healthCheck()` distinguishing "unreachable" from "reachable but unauthenticated."
- **What is honestly still unverified**: an actual successful, authenticated completion call. Nothing in this codebase has ever received a real 200 response with real generated text from Anthropic, because no key exists in this environment to test that with. This is stated here explicitly rather than left ambiguous — the 12 passing tests prove the transport, retry, and parsing logic is correct against both a realistic success shape and a real captured failure shape; they cannot and do not prove a real key would work.
- **A real test bug found and fixed**: the retry-on-persistent-5xx-errors test initially used `mockResolvedValue()` (returns the same `Response` object instance on every call), which failed with `TypeError: Body is unusable: Body has already been read` on the second retry attempt, since a `Response` body can only be consumed once. This was a bug in the test's mock setup, not in `ClaudeProvider` itself — fixed by switching to `mockImplementation()` so each retry attempt gets a fresh `Response` instance, matching how real `fetch` actually behaves.
- **Production readiness**: Not production-ready — no real credential has ever been exercised end-to-end; no cost/token-budget tracking yet (named in the master prompt, Section 18, as a Model Gateway responsibility); only one provider implemented, so the fallback path in `ModelGateway` is tested with fakes, not with a second real provider.

### Feature: OpenClaw integration (`@nexus/openclaw-plugin`)
- **Status**: TESTING
- **Files**: `packages/openclaw-plugin/src/index.ts`, `nexusClient.ts`, `format.ts`, and their test files
- **What this is**: a plugin for the real, published `openclaw` npm package (a multi-channel AI agent gateway supporting Telegram, Discord, and other messaging channels) that registers three read-only tools — `nexus_daily_briefing`, `nexus_search`, `nexus_item_detail` — backed by the real Nexus API. This lets an OpenClaw-orchestrated agent surface Nexus's verified knowledge through any channel OpenClaw already supports, without Nexus building its own bot integrations. It grants OpenClaw no write access, no credentials, and no capability beyond three GET requests to Nexus's own public API.
- **A real, found-and-fixed problem**: the version of this plugin recovered from the pre-reset snapshot did not compile against the real `openclaw` package's actual TypeScript types — it used a guessed `outputSchema` field that does not exist on the real `ToolDefinition` type, and was missing the required `label` field on every tool. This was caught by running `tsc --noEmit` against the real installed package, not assumed to be correct because it looked reasonable. Also found and fixed: TypeScript could not infer `params`'s type through `registerTool`'s union parameter type without an explicit `Static<typeof Schema>` annotation on each `execute()` function — traced to the actual `.d.ts` files in `node_modules`, not guessed at.
- **A real security decision made explicitly**: installing this package's dependencies surfaced four flagged install/build scripts, including `tree-sitter-bash` (a native compiled addon, part of `openclaw`'s sandbox/exec extensions). All four were explicitly declined in `pnpm-workspace.yaml`'s `allowBuilds` config, since this plugin only needs `openclaw`'s shipped `.d.ts` type declarations for compile-time checking — it does not import or execute any of `openclaw`'s actual runtime, and none of its exec/sandbox/browser capabilities are needed or wanted for three read-only HTTP calls.
- **Real tests**: 17 tests (`nexusClient.test.ts`, `format.test.ts`) covering request construction, trailing-slash normalization, error handling including a distinct message for 404s, and every formatting function's empty-state and pluralization behavior.
- **Full live end-to-end verification performed**: with the real API server running against the real `nexus_dev` Postgres database, the plugin's actual `NexusClient` and `format.ts` (the same code the real OpenClaw host would call) were run directly against `http://localhost:4000/api` — fetching the real 8-item briefing, searching for "security" and getting 2 real matching results, fetching item 1's full real evidence trail, and confirming a 404 on a nonexistent item produces the correct clean error message rather than a crash. This is the strongest form of verification performed on any piece of this project: the actual code path, against the actual database, producing actual chat-formatted output.
- **What is honestly still unverified**: this plugin has never been loaded inside a real running `openclaw` host process. `tsc --noEmit` proves the plugin satisfies OpenClaw's type contract; the live verification above proves the plugin's own logic is correct against a real Nexus backend. Neither proves OpenClaw itself will discover, load, and correctly invoke this plugin at runtime — that requires an actual OpenClaw gateway instance, which does not exist in this environment.
- **Production readiness**: Not production-ready by the plugin's own logic (that part is well-tested) — blocked entirely on the untestable-here step of loading it into a real OpenClaw host.
