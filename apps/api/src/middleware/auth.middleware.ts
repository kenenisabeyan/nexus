import type { Request, Response, NextFunction } from "express";
import { getUserBySession } from "../modules/auth/auth.service.js";
import type { PublicUser } from "@nexus/types";

export interface AuthedRequest extends Request {
  user?: PublicUser;
}

const SESSION_COOKIE = "nexus_session";

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const match = header.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

// Attaches req.user if a valid session cookie is present, but does not
// reject the request — used on routes that behave differently for
// authenticated vs anonymous users without making auth mandatory.
export async function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const sessionId = parseCookie(req.headers.cookie, SESSION_COOKIE);
  if (sessionId) {
    req.user = (await getUserBySession(sessionId)) ?? undefined;
  }
  next();
}

// Rejects the request with 401 unless a valid session is present.
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const sessionId = parseCookie(req.headers.cookie, SESSION_COOKIE);
  if (!sessionId) return res.status(401).json({ error: "Authentication required" });

  const user = await getUserBySession(sessionId);
  if (!user) return res.status(401).json({ error: "Session invalid or expired" });

  req.user = user;
  next();
}

export { SESSION_COOKIE };
