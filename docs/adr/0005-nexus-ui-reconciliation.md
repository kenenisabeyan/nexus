# ADR 0005: `apps/web` (formerly `nexus-platform/frontend`) is the canonical frontend; `nexus-ui` is archived

## Status
Accepted — decision made as part of Milestone 0, per the item flagged for
approval in `IMPLEMENTATION_PLAN.md` Section 14, item 7.

## Context
Two disconnected frontend artifacts existed prior to Milestone 0 (see
`ARCHITECTURE_STATUS.md`, Section 1.3):
1. `nexus-platform/frontend` — 5 pages, wired to a real (if seeded) backend,
   one design system (Fraunces/Inter/IBM Plex Mono).
2. `nexus-ui/nexus_product_design.jsx` — 10 static mockup screens
   (Dashboard, Briefing, Explorer, Search, Impact, Learning, Radar,
   Timeline, Trends, Assistant), wired to nothing, a different font stack
   (Poppins/Inter/IBM Plex Mono).

Continuing to develop both in parallel risks wasted effort and a visually
inconsistent product.

## Decision
`apps/web` (the TypeScript-converted descendant of `nexus-platform/frontend`)
is the canonical, actively developed frontend. Its design system (Fraunces
display face, the confidence-ring signature component, the briefing-list
layout pattern) is the one to extend for all future screens.

`nexus-ui/nexus_product_design.jsx` is archived as historical design
reference, not deleted. It contains genuinely useful visual ideas for five
screens `apps/web` does not yet have (Dashboard, Impact Analysis, Learning
Center, Technology Radar, AI Assistant) — these are candidates for
future milestones, rebuilt against `apps/web`'s design system and real API
data, not ported as static mockups.

## Alternatives considered
- **Rebuild `apps/web` around `nexus-ui`'s visual design instead.**
  Rejected: `nexus-ui` has no backend integration at all; adopting it as
  canonical would mean re-wiring five working pages for a purely cosmetic
  gain, with no functional benefit, during a milestone explicitly scoped to
  infrastructure rather than product surface.
- **Maintain both indefinitely.** Rejected: this is the wasted-effort risk
  named in the original audit; maintaining two design systems for one
  product has no upside.

## Consequences
- `nexus-ui/` and `static/` (its screenshot tooling) are retained in the
  repository under an `archive/` prefix for design reference, excluded from
  the build and from CI.
- Any future work to add the Dashboard, Impact Analysis, Learning Center,
  Technology Radar, or AI Assistant screens to `apps/web` should treat
  `nexus-ui`'s mockups as a visual starting point, not as code to be wired
  up directly — they were never built against the real data shapes in
  `@nexus/types`.
