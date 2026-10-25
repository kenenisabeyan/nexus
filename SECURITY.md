# Security Policy

## Current state (Milestone 0 — honest snapshot)

This project is pre-production. The security posture described below
reflects what is **actually implemented and tested**, not the target state
described in the whitepaper. See `ARCHITECTURE_STATUS.md` Section 4 for the
full gap analysis.

### Implemented and tested
- Password hashing via bcrypt (cost factor 12), never stored or returned in plaintext
- Server-side sessions (random 256-bit tokens), not client-readable JWTs, so a session can be revoked server-side on logout
- Session cookies are `HttpOnly` and `SameSite=Lax`; `Secure` is enabled automatically when `NODE_ENV=production`
- CORS restricted to a single configured origin (`WEB_ORIGIN`), not wildcard
- Parameterized SQL queries throughout (no string-concatenated SQL anywhere in the codebase)
- Input validation on route parameters (e.g. non-numeric item IDs rejected with 400, not passed to the database)

### Explicitly not implemented yet
- Rate limiting (any endpoint, including login — brute-force protection is not yet in place)
- CSRF protection beyond `SameSite=Lax`
- Audit logging of privileged actions
- Dependency/container vulnerability scanning in CI
- Secrets management beyond `.env` files (no Vault/KMS integration)
- Multi-tenancy / row-level authorization (there is currently exactly one class of authenticated user with no ownership model on `knowledge_items`)
- Any of the AI-specific defenses in the master implementation prompt (Section 20: prompt injection, indirect prompt injection, tool abuse) — not applicable yet because no AI pipeline exists

## Reporting a vulnerability

This is an internal development-stage project without a public deployment.
Report issues directly to the project maintainer rather than via a public
issue tracker until a production deployment exists.

## Before production deployment

The following are hard requirements before this system handles real user
data in production, not optional hardening:
1. Rate limiting on all authentication endpoints
2. Dependency and container scanning in CI
3. A secrets management solution (not `.env` files)
4. An incident response runbook (`docs/runbooks/`, not yet created)
5. A documented data retention and deletion policy
