import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import ConfidenceRing from "../ConfidenceRing.js";
import type { BriefingResponse } from "@nexus/types";

function tagClass(sev: string) {
  if (sev === "urgent") return "tag tag-urgent";
  if (sev === "notable") return "tag tag-notable";
  return "tag tag-routine";
}

export default function Briefing() {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.briefing().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="error-banner">
        Couldn't reach the Nexus API at /api/briefing — is the backend running on port 4000? ({error})
      </div>
    );
  }
  if (!data) return <div className="status-line">Loading today's briefing…</div>;

  return (
    <>
      <p className="page-eyebrow">
        {new Date(data.generated_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <h1 className="page-title">Daily Briefing</h1>
      <p className="page-sub">
        {data.items.length} verified items since your last visit. Ranked by professional impact, not chronology.
      </p>
      <div className="briefing-list">
        {data.items.map((item) => (
          <Link to={`/items/${item.id}`} className="briefing-item" key={item.id}>
            <div className="briefing-rank">{String(item.importance_rank).padStart(2, "0")}</div>
            <ConfidenceRing value={item.confidence ?? 0.85} />
            <div>
              <h2 className="item-title">{item.title}</h2>
              <p className="item-summary">{item.summary}</p>
              <div className="item-meta">
                <span className={tagClass(item.severity ?? "notable")}>{item.severity ?? "notable"}</span>
                <span>{item.category}</span>
                <span>·</span>
                <span>{item.evidence.length} sources</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
