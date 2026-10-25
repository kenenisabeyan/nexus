import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import ConfidenceRing from "../ConfidenceRing.js";
import type { KnowledgeItemDetail } from "@nexus/types";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<KnowledgeItemDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(value: string) {
    setQ(value);
    if (!value.trim()) {
      setResults(null);
      return;
    }
    try {
      const data = await api.search(value);
      setResults(data.results);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <p className="page-eyebrow">Knowledge base</p>
      <h1 className="page-title">Search</h1>
      <p className="page-sub">Query the full verified knowledge base by keyword, technology, or category.</p>

      <input
        className="search-input"
        placeholder="Try “security”, “React”, or “Node.js”…"
        value={q}
        onChange={(e) => runSearch(e.target.value)}
        autoFocus
      />

      {error && <div className="error-banner">{error}</div>}

      {results && results.length === 0 && (
        <div className="empty-state">No verified knowledge items match “{q}” yet.</div>
      )}

      {results && results.length > 0 && (
        <div className="briefing-list">
          {results.map((item) => (
            <Link to={`/items/${item.id}`} className="briefing-item" key={item.id}>
              <div className="briefing-rank">{String(item.importance_rank ?? 5).padStart(2, "0")}</div>
              <ConfidenceRing value={item.confidence ?? 0.85} />
              <div>
                <h2 className="item-title">{item.title}</h2>
                <p className="item-summary">{item.summary}</p>
                <div className="item-meta">
                  <span>{item.category}</span>
                  <span>·</span>
                  <span>{item.evidence.length} sources</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
