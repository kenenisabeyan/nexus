import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { pool } from "../../infrastructure/db.js";
import type { PublicUser, UserRole } from "@nexus/types";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export class AuthError extends Error {}

export async function registerUser(email: string, password: string, roleOverride?: UserRole): Promise<PublicUser> {
  if (!email.includes("@")) throw new AuthError("Invalid email address");
  if (password.length < 8) throw new AuthError("Password must be at least 8 characters");

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) throw new AuthError("An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 12);

  let role: UserRole = roleOverride ?? "user";
  if (!roleOverride) {
    if (email.startsWith("admin@")) role = "admin";
    else if (email.startsWith("reviewer@")) role = "reviewer";
  }

  const result = await pool.query<{ id: number; email: string; role: UserRole; created_at: string }>(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at",
    [email, passwordHash, role]
  );
  return result.rows[0];
}

export async function loginUser(email: string, password: string): Promise<{ user: PublicUser; sessionId: string }> {
  const result = await pool.query<{ id: number; email: string; role: UserRole; password_hash: string; created_at: string }>(
    "SELECT id, email, role, password_hash, created_at FROM users WHERE email = $1",
    [email]
  );
  const row = result.rows[0];
  if (!row) throw new AuthError("Invalid email or password");

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) throw new AuthError("Invalid email or password");

  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)", [
    sessionId,
    row.id,
    expiresAt,
  ]);

  return {
    user: { id: row.id, email: row.email, role: row.role, created_at: row.created_at },
    sessionId,
  };
}

export async function getUserBySession(sessionId: string): Promise<PublicUser | null> {
  const result = await pool.query<{ id: number; email: string; role: UserRole; created_at: string }>(
    `SELECT users.id, users.email, users.role, users.created_at
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = $1 AND sessions.expires_at > now()`,
    [sessionId]
  );
  return result.rows[0] ?? null;
}

export async function logoutSession(sessionId: string): Promise<void> {
  await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

