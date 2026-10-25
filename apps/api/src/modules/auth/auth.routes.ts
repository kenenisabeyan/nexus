import { Router } from "express";
import { registerUser, loginUser, logoutSession, AuthError } from "./auth.service.js";
import { SESSION_COOKIE, requireAuth, type AuthedRequest } from "../../middleware/auth.middleware.js";
import { createAuthRateLimiter } from "../../middleware/rateLimit.middleware.js";

export const authRouter = Router();

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = `HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${isProduction ? "; Secure" : ""}`;

// Two independent limiters, not one shared instance — see
// rateLimit.middleware.ts for why that distinction matters.
const registerRateLimiter = createAuthRateLimiter();
const loginRateLimiter = createAuthRateLimiter();

authRouter.post("/register", registerRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "email and password are required" });
    }
    const user = await registerUser(email, password);
    res.status(201).json({ user });
  } catch (err) {
    if (err instanceof AuthError) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/login", loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "email and password are required" });
    }
    const { user, sessionId } = await loginUser(email, password);
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${sessionId}; ${cookieOptions}`);
    res.json({ user });
  } catch (err) {
    if (err instanceof AuthError) return res.status(401).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/logout", async (req, res) => {
  const cookie = req.headers.cookie ?? "";
  const match = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (match) {
    const sessionId = decodeURIComponent(match.split("=").slice(1).join("="));
    await logoutSession(sessionId);
  }
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});
