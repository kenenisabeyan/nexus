import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import type { GraphResponse, GraphNode } from "@nexus/types";

const SEVERITY_COLOR: Record<string, string> = {
  urgent: "#c43c2d",
  notable: "#2e75b6",
  routine: "#93a4b3",
};

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

// Simple deterministic circular layout, computed from the real graph data.
// Not a physics-based force simulation — that's a reasonable next step, not
// something worth faking with a heavier dependency for a prototype.
function layout(nodes: GraphNode[], width: number, height: number): PositionedNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 70;
  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

export default function Explorer() {
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 760, height: 560 });
  const navigate = useNavigate();

  useEffect(() => {
    api.graph().then(setGraph).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setSize({ width: w, height: Math.max(480, w * 0.72) });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!graph) return <div className="status-line">Loading knowledge graph…</div>;

  const positioned = layout(graph.nodes, size.width, size.height);
  const byId: Record<number, PositionedNode> = Object.fromEntries(positioned.map((n) => [n.id, n]));

  return (
    <>
      <p className="page-eyebrow">Living knowledge graph</p>
      <h1 className="page-title">Knowledge Explorer</h1>
      <p className="page-sub">
        Every node is a verified knowledge item; every edge is a real relationship
        pulled from the graph, not a decorative connection. Hover a node for detail.
      </p>

      <div ref={containerRef} style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--paper)" }}>
        <svg width="100%" height={size.height} viewBox={`0 0 ${size.width} ${size.height}`}>
          {graph.edges.map((e, i) => {
            const a = byId[e.source];
            const b = byId[e.target];
            if (!a || !b) return null;
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9d5e0" strokeWidth={1.5} />;
          })}
          {positioned.map((n) => (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => navigate(`/items/${n.id}`)}
              style={{ cursor: "pointer" }}
            >
              <circle
                r={hovered === n.id ? 12 : 9}
                fill={(n.severity && SEVERITY_COLOR[n.severity]) || "#93a4b3"}
                stroke="#fff"
                strokeWidth={2}
                style={{ transition: "r 0.12s" }}
              />
            </g>
          ))}
        </svg>
      </div>

      <div style={{ marginTop: 20 }}>
        {hovered !== null && byId[hovered] ? (
          <Link to={`/items/${hovered}`} className="briefing-item" style={{ padding: "14px 0", gridTemplateColumns: "56px 1fr" }}>
            <div />
            <div>
              <h2 className="item-title" style={{ fontSize: 16 }}>{byId[hovered].title}</h2>
              <span className="item-meta">
                {byId[hovered].category} · confidence {Math.round((byId[hovered].confidence ?? 0.85) * 100)}%
              </span>
            </div>
          </Link>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>Hover any node to preview it, click to open the full item.</p>
        )}
      </div>
    </>
  );
}
