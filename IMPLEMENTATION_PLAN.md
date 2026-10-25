# NEXUS — IMPLEMENTATION PLAN

---

## 11. RECOMMENDED PRODUCTION FOLDER STRUCTURE

The master prompt's monorepo structure (Section 16) is directionally correct but oversized for the current state of the project — adopting it wholesale today would create dozens of empty directories, which is itself a form of premature complexity the master prompt explicitly warns against (Section 44). The recommendation is to **grow into it incrementally**, starting from the existing `nexus-platform/` layout:

```text
nexus/                          # renamed from nexus-platform/ at Milestone 0
├── apps/
│   ├── web/                    # current frontend/, moved
│   └── api/                    # current backend/, moved + restructured:
│       ├── src/
│       │   ├── modules/
│       │   │   ├── briefing/   # existing routes, moved into module form
│       │   │   ├── search/
│       │   │   ├── sources/
│       │   │   └── knowledge/
│       │   ├── infrastructure/ # db.js moves here
│       │   └── server.ts       # server.js, converted to TS at Milestone 0
│       └── tests/               # new, empty until Milestone 1
├── packages/
│   ├── types/                  # new: shared TS types between api and web
│   └── database/                # new: schema + migrations, extracted from db.js
├── database/
│   └── migrations/              # new: replaces the current exec()-on-boot schema
├── docs/
│   └── adr/                     # new, starts with ADR-0001 (see Section 12)
├── .github/workflows/           # new, empty until CI is built (Milestone 0)
├── docker-compose.yml           # new: Postgres + API + web, local dev only
├── package.json                 # new root, pnpm workspace
├── pnpm-workspace.yaml
├── README.md                    # existing, updated
├── SECURITY.md                  # new
├── .env.example                 # new
└── ARCHITECTURE_STATUS.md / IMPLEMENTATION_PLAN.md / IMPLEMENTATION_LEDGER.md   # this audit
```

`apps/workers/` and the full `packages/` breadth (domain, events, ai, verification, observability, security, source-adapters/*) are **deliberately not created yet** — they are added at the milestone where their first real content exists, not before. An empty directory that exists only to match a diagram is a documentation smell, not architecture.

---

## 12. TECHNOLOGY DECISIONS AND JUSTIFICATIONS

Recorded here in summary; each gets a full ADR in `docs/adr/` at Milestone 0.

| Decision | Choice | Justification |
|---|---|---|
| Language | TypeScript across api and web | The existing prototype is plain JS; converting now, before the codebase grows, is far cheaper than converting later. This is the one "premature-seeming" investment worth making early because the cost only increases with time. |
| Primary database | PostgreSQL | SQLite is correct for a local prototype and wrong for anything with concurrent writers or a second environment. This is the single highest-priority infrastructure change coming out of this audit. |
| Vector search | pgvector on the same Postgres instance | Per master prompt Section 17 — no dedicated vector database until a benchmarked need exists. |
| Knowledge graph | Relational modeling in Postgres, not Neo4j, for now | Per master prompt Section 17 — introducing a graph database "because the product contains a knowledge graph" is exactly the premature-complexity trap the master prompt names explicitly. Revisit once real multi-hop traversal query patterns exist to benchmark. |
| Queue/events | Start with Postgres-backed job table or BullMQ (Redis) — not Kafka | Ingestion volume at Phase 1 (a handful of source adapters) does not justify Kafka's operational cost. Revisit at Phase 3+ if measured throughput requires it. |
| AI provider | Model gateway abstraction from day one, first concrete provider TBD at Milestone 3 | Per master prompt Section 8 (Rule 8: never couple to one provider) and Section 18. The abstraction is built before the first provider integration, not after. |
| Auth | Session-based auth with a standard library (e.g., Lucia or an equivalent), not a custom implementation | Custom auth is a common, avoidable security risk; this is a build-vs-buy decision resolved in favor of buy. |

---

## 13. PHASED IMPLEMENTATION ROADMAP

This follows the master prompt's Phase 0–8 structure directly, with the current state mapped against it:

| Phase | Master prompt scope | Current status |
|---|---|---|
| 0 — Engineering Foundation | Monorepo, TS, lint, CI, testing, Docker, config, secrets, DB, observability, auth foundation | **Not started.** This is the next work. |
| 1 — Core Knowledge Pipeline | Source adapters, ingestion, normalization, dedup, knowledge objects, Postgres, search, basic relationships | **Partially and superficially prototyped** — the shape of a knowledge object exists in SQLite with fabricated data; none of the pipeline stages that would populate it for real exist. |
| 2 — Verification | Provenance, evidence, confidence, source authority, conflict detection | **Schema shape exists (`evidence` table); computation does not.** |
| 3 — Knowledge Graph | Entities, relationships, graph queries, historical knowledge | **Minimal relational shape exists; no temporal/versioned model.** |
| 4 — AI Intelligence | Extraction, classification, summarization, impact analysis, recommendations | **Not started.** |
| 5 — Agentic System | Specialized agents | **Not started — correctly blocked on Phases 1–4.** |
| 6 — Professional Intelligence | Profiles, niche classification, relevance ranking, personalization | **Not started.** |
| 7 — AI Ecosystem Intelligence | AI model/agent/framework/research/pricing monitoring | **Not started.** |
| 8 — Production Hardening | Load/security testing, observability, DR, scaling, runbooks | **Not started.** |

---

## 14. FIRST MILESTONE SPECIFICATION

Per the master prompt's explicit instruction ("propose the first implementation milestone, implement it completely, run tests, fix failures, update the ledger, then continue"), this is a proposal awaiting approval, not yet started.

### Milestone 0: Engineering Foundation (proposed scope)

1. Convert `nexus-platform/backend` and `frontend` to TypeScript.
2. Establish the pnpm workspace monorepo structure from Section 11.
3. Replace SQLite with PostgreSQL, running locally via `docker-compose.yml`; write the first real migration (not an `exec()` schema-on-boot script).
4. Add a minimal but real CI pipeline (lint → typecheck → unit test) via GitHub Actions, even though there is only one test to run initially.
5. Add `.env.example`, basic secrets convention, and a `SECURITY.md`.
6. Write the first unit tests for the existing route handlers (currently zero exist) against the new Postgres schema.
7. **Resolve the nexus-ui / nexus-platform frontend split** named in Architecture Status Section 10.1: recommendation is to treat `nexus-platform/frontend`'s design system and routing as canonical (it is the only one connected to a real API), and either port the additional five screens from `nexus-ui` into it against real (still fabricated-but-structured) data, or explicitly archive `nexus-ui` as historical design exploration. This decision is flagged for approval, not made unilaterally here.
8. Add a real authentication foundation (library selection per Section 12), applied to at least one route, even though there is only a single implicit "user" today.

**Explicitly out of scope for Milestone 0**: any AI model integration, any source adapter, any agent. Milestone 0 is infrastructure only, per the master prompt's own Phase 0 definition.

**Definition of done for Milestone 0**: every item above merged, CI green, `IMPLEMENTATION_LEDGER.md` updated with each affected component moved from `NOT_STARTED` to its correct new status, and no component claimed as `PRODUCTION_READY` unless it independently meets the Section 45 bar.

This milestone is proposed and not started. Awaiting approval before implementation begins, per the master prompt's explicit instruction.
