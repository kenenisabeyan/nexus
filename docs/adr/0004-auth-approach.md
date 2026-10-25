# ADR 0004: Session-based auth with bcrypt, not a third-party auth-as-a-service

## Status
Accepted — implemented in Milestone 0.

## Context
The master implementation prompt requires "secure authentication" as a
Milestone 0 foundation item, and separately warns generally against
reinventing well-understood security-critical infrastructure.

## Decision
Implement authentication directly: bcrypt password hashing (cost 12),
server-side session tokens stored in Postgres, HttpOnly cookies. Do not
adopt a third-party auth-as-a-service provider yet.

## Alternatives considered
- **Adopt an auth-as-a-service provider (e.g. Auth0, Clerk).** Deferred,
  not rejected outright: appropriate to revisit once SSO/enterprise
  requirements (named explicitly in the whitepaper's Authentication chapter)
  become real near-term requirements rather than long-term roadmap items.
  Introducing a paid third-party dependency for a pre-revenue, single-tenant
  Milestone 0 system is premature.
- **Stateless JWTs instead of server-side sessions.** Rejected: server-side
  sessions allow immediate revocation (logout actually invalidates access;
  a leaked JWT would remain valid until expiry regardless of logout). This
  trade-off favors sessions for a product whose trust model is a stated
  core differentiator.
- **Roll a custom password hashing scheme.** Rejected outright — bcrypt is
  the correct choice; custom cryptography is a well-known anti-pattern.

## Consequences
- Every session requires a database round-trip to validate (`getUserBySession`).
  This is an accepted cost at current scale; if session-validation latency
  becomes measurable, a short-TTL cache in front of this lookup is the
  correct next step, not a switch to stateless tokens.
- No SSO/SAML/OIDC support exists yet. This is correctly deferred to the
  Enterprise Strategy work described in the whitepaper, not Milestone 0.
