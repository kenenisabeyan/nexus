import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { pool } from "../src/infrastructure/db.js";

const app = buildApp();

describe("Auth", () => {
  beforeEach(async () => {
    await pool.query("TRUNCATE sessions, users RESTART IDENTITY CASCADE");
  });

  it("registers a new user with a hashed password (not stored in plaintext)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@nexus.dev", password: "correcthorsebattery" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("alice@nexus.dev");
    expect(res.body.user.password_hash).toBeUndefined(); // never returned to the client

    const row = await pool.query("SELECT password_hash FROM users WHERE email = $1", ["alice@nexus.dev"]);
    expect(row.rows[0].password_hash).not.toBe("correcthorsebattery");
    expect(row.rows[0].password_hash.startsWith("$2")).toBe(true); // real bcrypt hash format
  });

  it("rejects registration with a password under 8 characters", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "bob@nexus.dev", password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects duplicate email registration", async () => {
    await request(app).post("/api/auth/register").send({ email: "dup@nexus.dev", password: "correcthorsebattery" });
    const res = await request(app).post("/api/auth/register").send({ email: "dup@nexus.dev", password: "anotherpassword" });
    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials and sets a session cookie", async () => {
    await request(app).post("/api/auth/register").send({ email: "carol@nexus.dev", password: "correcthorsebattery" });
    const res = await request(app).post("/api/auth/login").send({ email: "carol@nexus.dev", password: "correcthorsebattery" });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/nexus_session=/);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/HttpOnly/);
  });

  it("rejects login with the wrong password", async () => {
    await request(app).post("/api/auth/register").send({ email: "dave@nexus.dev", password: "correcthorsebattery" });
    const res = await request(app).post("/api/auth/login").send({ email: "dave@nexus.dev", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("returns 401 from a protected route with no session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user from a protected route with a valid session", async () => {
    await request(app).post("/api/auth/register").send({ email: "erin@nexus.dev", password: "correcthorsebattery" });
    const loginRes = await request(app).post("/api/auth/login").send({ email: "erin@nexus.dev", password: "correcthorsebattery" });
    const cookie = loginRes.headers["set-cookie"][0];

    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("erin@nexus.dev");
  });

  it("invalidates the session on logout", async () => {
    await request(app).post("/api/auth/register").send({ email: "frank@nexus.dev", password: "correcthorsebattery" });
    const loginRes = await request(app).post("/api/auth/login").send({ email: "frank@nexus.dev", password: "correcthorsebattery" });
    const cookie = loginRes.headers["set-cookie"][0];

    await request(app).post("/api/auth/logout").set("Cookie", cookie);
    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(meRes.status).toBe(401);
  });

  it("rate limits repeated login attempts from the same client", async () => {
    await request(app).post("/api/auth/register").send({ email: "grace@nexus.dev", password: "correcthorsebattery" });

    // The limiter allows 10 requests per 15-minute window; fire 11 and
    // expect the 11th to be rejected with 429, proving the middleware is
    // actually wired in and not just present in the file unused.
    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await request(app).post("/api/auth/login").send({ email: "grace@nexus.dev", password: "wrongpassword" });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
