import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { pool } from "../src/infrastructure/db.js";

const app = buildApp();

describe("Knowledge routes", () => {
  let itemId: number;
  let sourceId: number;

  beforeAll(async () => {
    await pool.query("TRUNCATE relationships, evidence, knowledge_items, sources RESTART IDENTITY CASCADE");

    const source = await pool.query(
      "INSERT INTO sources (name, category, trust_score) VALUES ('Test Source', 'institutional', 0.9) RETURNING id"
    );
    sourceId = source.rows[0].id;

    const item = await pool.query(
      `INSERT INTO knowledge_items (title, summary, category, severity, confidence, importance_rank, published_at, recommended_action, verification_status)
       VALUES ('Test Item', 'A test summary', 'Testing', 'notable', 0.8, 1, now(), 'Do nothing', 'verified') RETURNING id`
    );
    itemId = item.rows[0].id;

    await pool.query("INSERT INTO evidence (item_id, source_id, stance, url) VALUES ($1, $2, 'corroborates', 'https://example.org')", [
      itemId, sourceId,
    ]);
  });

  it("excludes unverified items from the daily briefing", async () => {
    await pool.query(
      `INSERT INTO knowledge_items (title, summary, category, published_at, external_id, verification_status)
       VALUES ('Unverified Item', 'Freshly ingested, not yet reviewed', 'Testing', now(), 'test:unverified:1', 'unverified')`
    );
    const res = await request(app).get("/api/briefing");
    const titles = res.body.items.map((i: { title: string }) => i.title);
    expect(titles).not.toContain("Unverified Item");
  });

  it("returns the daily briefing ordered by importance rank", async () => {
    const res = await request(app).get("/api/briefing");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0].title).toBe("Test Item");
    expect(res.body.items[0].evidence).toHaveLength(1);
  });

  it("returns a single item with its evidence trail", async () => {
    const res = await request(app).get(`/api/items/${itemId}`);
    expect(res.status).toBe(200);
    expect(res.body.evidence[0].source_name).toBe("Test Source");
  });

  it("returns 404 for a non-existent item", async () => {
    const res = await request(app).get("/api/items/999999");
    expect(res.status).toBe(404);
  });

  it("returns 400 for a non-numeric item id (input validation)", async () => {
    const res = await request(app).get("/api/items/not-a-number");
    expect(res.status).toBe(400);
  });

  it("finds items by keyword search", async () => {
    const res = await request(app).get("/api/search?q=test");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it("excludes unverified items from search results (regression test — this was a real bug found during self-review, then lost in a full sandbox reset, now reapplied and reverified)", async () => {
    await pool.query(
      `INSERT INTO knowledge_items (title, summary, category, published_at, external_id, verification_status)
       VALUES ('Unverified Searchable Item', 'test summary content', 'Testing', now(), 'test:unverified:search:1', 'unverified')`
    );
    const res = await request(app).get("/api/search?q=unverified");
    expect(res.status).toBe(200);
    expect(res.body.results.find((r: { title: string }) => r.title === "Unverified Searchable Item")).toBeUndefined();
  });

  it("returns empty results for a non-matching search", async () => {
    const res = await request(app).get("/api/search?q=zzz_no_match_zzz");
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(0);
  });

  it("returns the source trust registry", async () => {
    const res = await request(app).get("/api/sources");
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("Test Source");
  });

  it("returns the graph as nodes and edges", async () => {
    const res = await request(app).get("/api/graph");
    expect(res.status).toBe(200);
    expect(res.body.nodes.length).toBeGreaterThan(0);
  });
});
