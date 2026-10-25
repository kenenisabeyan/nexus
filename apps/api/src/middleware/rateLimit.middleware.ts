import rateLimit, { type Options } from "express-rate-limit";

// Was flagged in IMPLEMENTATION_LEDGER.md as a known, named pre-production
// gap after Milestone 0.
//
// Exported as a FACTORY, not a shared singleton instance. A singleton
// middleware instance shares one in-memory counter across every route it's
// mounted on — the first version of this file was a shared instance, and it
// caused a real, observed test failure: register() and login() were
// silently sharing one rate-limit budget, so an unrelated test later in the
// same file got a 429 instead of a successful login because an earlier
// test's register() calls had already eaten into the shared quota. Each
// call site gets its own independent counter here.
export function createAuthRateLimiter(overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 attempts per IP per window, per route
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Try again later." },
    ...overrides,
  });
}
