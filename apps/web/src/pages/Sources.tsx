import { useEffect, useState } from "react";
import { api } from "../api.js";
import type { Source } from "@nexus/types";

export default function Sources() {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.sources().then(setSources).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!sources) return <div className="status-line">Loading trust registry…</div>;

  return (
    <>
      <p className="page-eyebrow">Dynamic Trust Scoring</p>
      <h1 className="page-title">Source Registry</h1>
      <p className="page-sub">
        Every source Nexus draws on is continuously re-scored based on its historical track record. Higher trust sources are weighted more heavily during verification.
      </p>
      <div>
        {sources.map((s) => (
          <div className="source-row" key={s.id}>
            <div>
              <div style={{ fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase" }}>
                {s.category}
              </div>
            </div>
            <div className="trust-bar-track">
              <div className="trust-bar-fill" style={{ width: `${s.trust_score * 100}%` }} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, textAlign: "right" }}>
              {Math.round(s.trust_score * 100)}% trust
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
