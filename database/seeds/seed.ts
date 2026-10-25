import { pool } from "../../apps/api/src/infrastructure/db.js";

// Same illustrative demo content as the original SQLite prototype — this is
// still fabricated, hand-authored data, not live-collected. See
// IMPLEMENTATION_LEDGER.md: every knowledge item's confidence/severity/rank
// remains a human-typed value until Phase 4 (AI Intelligence) exists.

async function seed() {
  await pool.query("TRUNCATE relationships, evidence, knowledge_items, sources RESTART IDENTITY CASCADE");

  const sourceRows: [string, string, number][] = [
    ["GitHub Releases", "code", 0.97],
    ["npm Security Advisories", "institutional", 0.98],
    ["React Official Blog", "institutional", 0.99],
    ["Node.js Foundation", "institutional", 0.99],
    ["Hacker News", "social", 0.62],
    ["r/webdev", "social", 0.55],
    ["X (verified maintainer)", "social", 0.71],
    ["National Vulnerability Database", "institutional", 0.99],
    ["Vercel Engineering Blog", "institutional", 0.93],
    ["Stack Overflow", "social", 0.68],
  ];
  const sourceIds: number[] = [];
  for (const [name, category, trust] of sourceRows) {
    const r = await pool.query<{ id: number }>(
      "INSERT INTO sources (name, category, trust_score) VALUES ($1, $2, $3) RETURNING id",
      [name, category, trust]
    );
    sourceIds.push(r.rows[0].id);
  }
  const [githubReleases, npmAdvisory, reactBlog, nodeBlog, hackerNews, reddit, xPost, cveDb, vercelBlog, stackOverflow] = sourceIds;

  const items = [
    {
      title: "Critical prototype-pollution vulnerability disclosed in a transitive dependency of Next.js middleware",
      summary: "A newly published advisory affects a widely used transitive dependency pulled in by Next.js middleware in versions prior to 15.2.3.",
      category: "Security", severity: "urgent", confidence: 0.96, importance_rank: 1,
      published_at: "2026-08-08T06:12:00Z",
      recommended_action: "Upgrade to Next.js 15.2.4 or apply the documented middleware isolation workaround before your next deploy.",
    },
    {
      title: "React 19.1 ships a stable compiler-driven memoization mode",
      summary: "The React team has promoted the React Compiler's automatic memoization from experimental to stable.",
      category: "Frontend", severity: "notable", confidence: 0.99, importance_rank: 2,
      published_at: "2026-08-07T14:00:00Z",
      recommended_action: "Safe to adopt incrementally; the compiler is opt-in per directory via the babel plugin config.",
    },
    {
      title: "Community reports a memory leak in a popular state-management library under React 19 strict mode",
      summary: "Multiple independent reports describe growing heap usage in long-running sessions.",
      category: "Frontend", severity: "notable", confidence: 0.74, importance_rank: 3,
      published_at: "2026-08-08T02:31:00Z",
      recommended_action: "Not yet confirmed by the maintainer. Monitor the linked issue before upgrading production apps.",
    },
    {
      title: "Node.js 22.8.0 released with permission model improvements",
      summary: "The permission model now supports granular filesystem allow-lists scoped per worker thread.",
      category: "Backend", severity: "routine", confidence: 0.98, importance_rank: 4,
      published_at: "2026-08-06T18:00:00Z",
      recommended_action: "No action required unless you rely on the permission model in production.",
    },
    {
      title: "Vercel deprecates Edge Config v1 API, migration required by Q1 2027",
      summary: "Vercel's engineering blog confirms Edge Config v1 will stop accepting writes on January 15, 2027.",
      category: "Cloud", severity: "notable", confidence: 0.95, importance_rank: 5,
      published_at: "2026-08-05T09:00:00Z",
      recommended_action: "Audit any usage of Edge Config in your deployment and plan migration before the deprecation window closes.",
    },
    {
      title: "Unverified claim: a popular ORM's new query planner is '10x faster' — independent benchmarks pending",
      summary: "A maintainer's X post claims a 10x query planning improvement. No independent reproduction published yet.",
      category: "Backend", severity: "routine", confidence: 0.41, importance_rank: 6,
      published_at: "2026-08-07T20:45:00Z",
      recommended_action: "Treat as provisional. Confidence will be upgraded automatically if independent benchmarks corroborate it.",
    },
    {
      title: "TypeScript 5.9 tightens narrowing for discriminated unions in switch statements",
      summary: "A subtle change in exhaustiveness checking may surface previously silent type errors.",
      category: "Frontend", severity: "notable", confidence: 0.97, importance_rank: 7,
      published_at: "2026-08-04T11:00:00Z",
      recommended_action: "Run `tsc --noEmit` after upgrading before merging; expect a small number of new, legitimate errors.",
    },
    {
      title: "GitHub Actions increases default token permissions restrictions for public repositories",
      summary: "Workflows in public repos now default to read-only GITHUB_TOKEN permissions unless explicitly elevated.",
      category: "Security", severity: "notable", confidence: 0.98, importance_rank: 8,
      published_at: "2026-08-03T15:20:00Z",
      recommended_action: "Review workflows that push tags or releases; they will need explicit `permissions:` blocks.",
    },
  ];

  const itemIds: number[] = [];
  for (const item of items) {
    const externalId = `seed:${item.title.slice(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const r = await pool.query<{ id: number }>(
      `INSERT INTO knowledge_items
        (title, summary, category, severity, confidence, importance_rank, published_at, recommended_action, external_id, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified') RETURNING id`,
      [item.title, item.summary, item.category, item.severity, item.confidence, item.importance_rank, item.published_at, item.recommended_action, externalId]
    );
    itemIds.push(r.rows[0].id);
  }

  const evidenceRows: [number, number, string, string][] = [
    [itemIds[0], npmAdvisory, "corroborates", "https://example.org/advisories/NEXUS-DEMO-2026-1142"],
    [itemIds[0], cveDb, "corroborates", "https://example.org/nvd/CVE-2026-DEMO-1142"],
    [itemIds[0], hackerNews, "corroborates", "https://example.org/hn/item/demo1"],
    [itemIds[1], reactBlog, "corroborates", "https://example.org/react-blog/compiler-stable"],
    [itemIds[1], githubReleases, "corroborates", "https://example.org/github/react/releases/19.1.0"],
    [itemIds[2], reddit, "corroborates", "https://example.org/reddit/webdev/demo2"],
    [itemIds[2], stackOverflow, "corroborates", "https://example.org/so/questions/demo2"],
    [itemIds[3], nodeBlog, "corroborates", "https://example.org/nodejs/blog/v22.8.0"],
    [itemIds[4], vercelBlog, "corroborates", "https://example.org/vercel/blog/edge-config-v2"],
    [itemIds[5], xPost, "corroborates", "https://example.org/x/demo/status/1"],
    [itemIds[6], githubReleases, "corroborates", "https://example.org/github/typescript/releases/5.9.0"],
    [itemIds[7], githubReleases, "corroborates", "https://example.org/github/actions/changelog"],
  ];
  for (const [itemId, sourceId, stance, url] of evidenceRows) {
    await pool.query("INSERT INTO evidence (item_id, source_id, stance, url) VALUES ($1, $2, $3, $4)", [
      itemId, sourceId, stance, url,
    ]);
  }

  const relRows: [number, number, string][] = [
    [itemIds[0], itemIds[1], "affects"],
    [itemIds[2], itemIds[1], "affects"],
    [itemIds[6], itemIds[1], "affects"],
  ];
  for (const [itemId, relatedId, type] of relRows) {
    await pool.query("INSERT INTO relationships (item_id, related_item_id, relationship_type) VALUES ($1, $2, $3)", [
      itemId, relatedId, type,
    ]);
  }

  console.log(`Seeded ${itemIds.length} knowledge items, ${sourceIds.length} sources, ${evidenceRows.length} evidence records.`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
