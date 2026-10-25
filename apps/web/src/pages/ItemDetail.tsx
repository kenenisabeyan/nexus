import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import ConfidenceRing from "../ConfidenceRing.js";
import type { KnowledgeItemDetail } from "@nexus/types";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<KnowledgeItemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setItem(null);
    api.item(id).then(setItem).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!item) return <div className="status-line">Loading item…</div>;

  return (
    <>
      <Link to="/" className="detail-back">&larr; Back to briefing</Link>

      <div className="detail-header">
        <ConfidenceRing value={item.confidence ?? 0.85} size={60} />
        <div>
          <p className="page-eyebrow">{item.category} · {item.severity ?? "notable"}</p>
          <h1 className="page-title" style={{ fontSize: 28 }}>{item.title}</h1>
        </div>
      </div>

      <p className="detail-summary">{item.summary}</p>

      <div className="action-box">
        <p className="action-box-label">Recommended action</p>
        <p>{item.recommended_action || "Review newly verified intelligence update."}</p>
      </div>

      <p className="section-label">Evidence ({item.evidence.length} sources)</p>
      <div>
        {item.evidence.map((e, i) => (
          <div className="evidence-row" key={i}>
            <span>
              <span className={`stance-dot stance-${e.stance}`} />
              <span className="evidence-source">{e.source_name}</span>
            </span>
            <span className="evidence-trust">trust {Math.round(e.trust_score * 100)}%</span>
          </div>
        ))}
      </div>

      {item.related.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 32 }}>Related knowledge</p>
          <div>
            {item.related.map((r) => (
              <Link to={`/items/${r.id}`} className="related-row" key={r.id}>
                <span className="related-type">{r.relationship_type}</span>
                {r.title}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
