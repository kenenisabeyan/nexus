import React, { useState } from "react";
import {
  Inbox, LayoutDashboard, Search, Share2, History, Radar as RadarIcon,
  TrendingUp, Target, GraduationCap, Sparkles, Bell, ShieldAlert,
  ExternalLink, Play, ArrowRight, Send
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

/* ============================================================
   DESIGN TOKENS
   Ink #101828 · Deep #1F4E79 · Signal #2E75B6 · Paper #F6F7F9
   Verified #1C7C54 · Provisional #B7791F · Alert #B23A2E · Conflict #6B4C9A
   Display: Space Grotesk · Body: Inter · Data/Mono: IBM Plex Mono
============================================================ */
const C = {
  base: "#10172A",
  base2: "#161E37",
  panel: "rgba(255,255,255,0.035)",
  panelBorder: "rgba(255,255,255,0.09)",
  cyan: "#00C4EE",
  cyanDim: "rgba(0,196,238,0.35)",
  cyanBg: "rgba(0,196,238,0.10)",
  orange: "#FF6000",
  orangeBg: "rgba(255,96,0,0.12)",
  text: "#F8FAFC",
  textDim: "#9AA7C2",
  textFaint: "#5E6B87",
  line: "rgba(255,255,255,0.08)",
  chip: "rgba(255,255,255,0.05)",
  orangeSoft: "rgba(255,150,60,0.85)",
};

const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    .nx-display { font-family: 'Poppins', sans-serif; }
    .nx-body { font-family: 'Inter', sans-serif; }
    .nx-mono { font-family: 'IBM Plex Mono', monospace; }
    .nx-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .nx-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
    .nx-focus:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
    .nx-glass { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
    .nx-glow-pulse { animation: nxpulse 2.4s ease-in-out infinite; }
    @keyframes nxpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
  `}</style>
);

/* ============================================================
   SIGNATURE ELEMENT: Confidence Bar
   A four-tier evidentiary indicator that appears on every
   knowledge item across every surface of the product.
============================================================ */
const TIERS = {
  verified: { label: "Verified", color: C.cyan, segs: 4 },
  corroborated: { label: "Corroborated", color: C.cyan, segs: 3 },
  provisional: { label: "Provisional", color: C.cyan, segs: 2 },
  conflict: { label: "Unresolved conflict", color: C.orange, segs: 1 },
};

function ConfidenceBar({ tier = "verified", pct, sources, compact = false }) {
  const t = TIERS[tier];
  return (
    <div className="flex items-center gap-2" title={`${t.label} · ${pct}% confidence`}>
      <div className="flex gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: compact ? 6 : 9,
              height: compact ? 6 : 9,
              borderRadius: 2,
              background: i < t.segs ? t.color : "rgba(255,255,255,0.10)",
              boxShadow: i < t.segs ? `0 0 8px ${t.color === C.orange ? "rgba(255,96,0,0.65)" : "rgba(0,196,238,0.65)"}` : "none",
            }}
          />
        ))}
      </div>
      {!compact && (
        <span className="nx-mono text-[11px]" style={{ color: t.color }}>
          {t.label} · {pct}%
        </span>
      )}
      {sources !== undefined && !compact && (
        <span className="nx-mono text-[11px]" style={{ color: C.textDim }}>
          · {sources} sources
        </span>
      )}
    </div>
  );
}

function Tag({ children, tone = "default" }) {
  const styles = {
    default: { color: C.textDim, bg: "rgba(255,255,255,0.06)" },
    signal: { color: C.cyan, bg: C.cyanBg },
    alert: { color: C.orange, bg: C.orangeBg },
  };
  const s = styles[tone];
  return (
    <span
      className="nx-mono text-[10px] px-2 py-[3px] rounded uppercase tracking-wide"
      style={{ color: s.color, background: s.bg }}
    >
      {children}
    </span>
  );
}

/* ============================================================
   MOCK DATA
============================================================ */
const USER = { name: "Alex Chen", role: "Senior Full-Stack Engineer", stack: "React · Next.js · Node · PostgreSQL" };

const BRIEFING = [
  {
    id: 1, urgent: true, tier: "verified", pct: 99, sources: 6,
    title: "Critical: Prototype pollution vulnerability disclosed in a transitive dependency of next-auth",
    why: "Affects 3 of your production services. Exploitable without authentication in default config.",
    who: "Backend, Security", action: "Patch to next-auth 5.2.3 or apply the documented workaround today.",
    time: "14 min ago", tag: "Security Advisory", tagTone: "alert",
  },
  {
    id: 2, tier: "verified", pct: 98, sources: 9,
    title: "React 19.2 ships the compiler-aware `useEffectEvent` hook out of experimental",
    why: "Removes a common source of stale-closure bugs in your existing effect code.",
    who: "Frontend", action: "No action required. Consider adopting in new components.",
    time: "1 hr ago", tag: "Release", tagTone: "signal",
  },
  {
    id: 3, tier: "conflict", pct: 41, sources: 5,
    title: "Vendor claims new inference framework is '3x faster' than vLLM on identical hardware",
    why: "Two independent reproductions have not matched the claimed figure; one shows near parity.",
    who: "AI Engineering", action: "Treat as unresolved. Both sources shown below.",
    time: "2 hr ago", tag: "AI Ecosystem", tagTone: "default",
  },
  {
    id: 4, tier: "corroborated", pct: 82, sources: 4,
    title: "Community RFC proposes deprecating the legacy Next.js Pages Router migration path",
    why: "Relevant to your Q3 migration plan; timeline still under discussion.",
    who: "Frontend, Platform", action: "Worth reading before your migration kickoff.",
    time: "5 hr ago", tag: "Community", tagTone: "default",
  },
  {
    id: 5, tier: "provisional", pct: 63, sources: 2,
    title: "Early reports of elevated cold-start latency on a major cloud provider's new runtime tier",
    why: "Unconfirmed at scale. Watching for further corroboration overnight.",
    who: "Platform, SRE", action: "No action yet. Nexus will notify if this escalates.",
    time: "6 hr ago", tag: "Cloud", tagTone: "default",
  },
];

const TREND_DATA = [
  { m: "Feb", adoption: 22, sentiment: 61 }, { m: "Mar", adoption: 28, sentiment: 64 },
  { m: "Apr", adoption: 34, sentiment: 59 }, { m: "May", adoption: 41, sentiment: 68 },
  { m: "Jun", adoption: 52, sentiment: 71 }, { m: "Jul", adoption: 60, sentiment: 74 },
];

const DASHBOARD_ACTIVITY = [
  { d: "Mon", items: 11 }, { d: "Tue", items: 9 }, { d: "Wed", items: 14 },
  { d: "Thu", items: 8 }, { d: "Fri", items: 12 }, { d: "Sat", items: 4 }, { d: "Sun", items: 6 },
];

const RADAR_ITEMS = [
  { name: "React 19", ring: "adopt", angle: 20, r: 0.85, quadrant: "Frameworks" },
  { name: "Next.js 15", ring: "adopt", angle: 55, r: 0.8, quadrant: "Frameworks" },
  { name: "Bun", ring: "trial", angle: 100, r: 0.55, quadrant: "Runtime" },
  { name: "Effect-TS", ring: "assess", angle: 140, r: 0.3, quadrant: "Languages" },
  { name: "Turbopack", ring: "trial", angle: 190, r: 0.6, quadrant: "Build Tools" },
  { name: "Legacy Redux Thunk", ring: "hold", angle: 230, r: 0.15, quadrant: "State Mgmt" },
  { name: "Deno Deploy", ring: "assess", angle: 270, r: 0.35, quadrant: "Runtime" },
  { name: "tRPC v11", ring: "adopt", angle: 310, r: 0.82, quadrant: "APIs" },
  { name: "GraphQL Yoga", ring: "trial", angle: 340, r: 0.5, quadrant: "APIs" },
];
const RING_COLORS = { adopt: C.cyan, trial: "#5FD8F2", assess: C.textDim, hold: C.orange };

const TIMELINE = [
  { date: "Jan 2026", tier: "provisional", pct: 55, text: "Early benchmarks suggest React Compiler reduces re-renders by ~30% in typical CRUD apps.", sources: 2 },
  { date: "Mar 2026", tier: "corroborated", pct: 78, text: "Three independent teams report consistent gains across production codebases.", sources: 4 },
  { date: "May 2026", tier: "verified", pct: 96, text: "React Compiler graduates to stable; Meta reports adoption across internal surfaces.", sources: 7 },
  { date: "Jul 2026", tier: "verified", pct: 98, text: "Ecosystem-wide adoption confirmed across Next.js, Remix, and React Router.", sources: 11 },
];

const LEARNING_TRACKS = [
  { title: "React Server Components, from first principles", level: "Intermediate", time: "45 min", tier: "verified", pct: 97 },
  { title: "Reading a CVE like a security engineer", level: "Beginner", time: "20 min", tier: "verified", pct: 95 },
  { title: "Evaluating AI coding agent benchmarks critically", level: "Advanced", time: "35 min", tier: "corroborated", pct: 84 },
  { title: "Postgres indexing strategies for high-write workloads", level: "Intermediate", time: "30 min", tier: "verified", pct: 96 },
];

const SEARCH_RESULTS = [
  { title: "next-auth prototype pollution advisory — full technical breakdown", tier: "verified", pct: 99, sources: 6, kind: "Security Advisory" },
  { title: "How three teams patched the next-auth vulnerability in production", tier: "corroborated", pct: 87, sources: 4, kind: "Community" },
  { title: "next-auth 5.x migration guide (official documentation)", tier: "verified", pct: 100, sources: 1, kind: "Official Docs" },
];

const NAV = [
  { id: "briefing", label: "Daily Briefing", icon: Inbox },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "search", label: "Search", icon: Search },
  { id: "explorer", label: "Knowledge Explorer", icon: Share2 },
  { id: "timeline", label: "Knowledge Timeline", icon: History },
  { id: "radar", label: "Technology Radar", icon: RadarIcon },
  { id: "trends", label: "Trend Explorer", icon: TrendingUp },
  { id: "impact", label: "Impact Analysis", icon: Target },
  { id: "learning", label: "Learning Center", icon: GraduationCap },
  { id: "assistant", label: "AI Assistant", icon: Sparkles },
];

/* ============================================================
   SHARED CHROME
============================================================ */
function Sidebar({ view, setView }) {
  return (
    <aside
      className="w-[236px] shrink-0 flex flex-col nx-glass"
      style={{ background: "rgba(16,23,42,0.72)", borderRight: `1px solid ${C.line}` }}
    >
      <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: C.line }}>
        <div
          className="w-7 h-7 rounded-[8px] mr-2.5 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${C.cyan}, #0A6E8C)`, boxShadow: `0 0 16px ${C.cyanDim}` }}
        >
          <span className="nx-display text-[13px] font-bold" style={{ color: C.base }}>N</span>
        </div>
        <span className="nx-display text-[15.5px] font-semibold tracking-tight" style={{ color: C.text }}>Nexus</span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full nx-glow-pulse" style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />
      </div>
      <nav className="flex-1 py-3 px-2.5 nx-scrollbar overflow-y-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = view === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className="nx-focus w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] mb-1 text-left transition-all relative overflow-hidden"
              style={{
                background: active ? "rgba(0,196,238,0.10)" : "transparent",
                color: active ? C.text : C.textDim,
                boxShadow: active ? `inset 0 0 0 1px ${C.cyanDim}` : "none",
              }}
            >
              {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />}
              <Icon size={16} strokeWidth={2} style={{ color: active ? C.cyan : C.textDim }} />
              <span className="nx-body text-[13px] font-medium">{n.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t" style={{ borderColor: C.line }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-[8px]" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center nx-display text-[11px] font-semibold"
            style={{ background: `linear-gradient(135deg, ${C.cyan}, #0A6E8C)`, color: C.base }}
          >
            AC
          </div>
          <div className="leading-tight">
            <div className="nx-body text-[12.5px] font-medium" style={{ color: C.text }}>{USER.name}</div>
            <div className="nx-mono text-[10.5px]" style={{ color: C.textFaint }}>{USER.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ title, subtitle }) {
  return (
    <header
      className="h-16 flex items-center justify-between px-7 shrink-0 nx-glass"
      style={{ borderBottom: `1px solid ${C.line}`, background: "rgba(16,23,42,0.55)" }}
    >
      <div>
        <h1 className="nx-display text-[17px] font-semibold" style={{ color: C.text }}>{title}</h1>
        {subtitle && <p className="nx-body text-[12.5px] mt-0.5" style={{ color: C.textDim }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-[8px]"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.line}` }}
        >
          <Search size={13} style={{ color: C.cyan }} />
          <span className="nx-body text-[12.5px]" style={{ color: C.textDim }}>Search the knowledge graph…</span>
        </div>
        <button
          className="nx-focus relative w-8 h-8 rounded-[8px] flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.line}` }}
        >
          <Bell size={15} style={{ color: C.textDim }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full nx-glow-pulse"
            style={{ background: C.orange, boxShadow: `0 0 6px ${C.orange}` }}
          />
        </button>
      </div>
    </header>
  );
}

function Card({ children, className = "", style = {}, glow = false }) {
  return (
    <div
      className={`rounded-[12px] nx-glass ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${glow ? C.cyanDim : C.panelBorder}`,
        boxShadow: glow
          ? `0 8px 32px rgba(0,0,0,0.45), 0 0 24px rgba(0,196,238,0.12), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   VIEW 1 — DAILY BRIEFING
============================================================ */
function BriefingView() {
  return (
    <div className="max-w-[760px] mx-auto px-8 py-8">
      <div className="flex items-baseline justify-between mb-1">
        <p className="nx-mono text-[11px] uppercase tracking-wider" style={{ color: C.cyan }}>Tuesday, August 4 · 7:02 AM</p>
        <p className="nx-mono text-[11px]" style={{ color: C.textDim }}>2,014,382 events processed overnight → 12 surfaced</p>
      </div>
      <h2 className="nx-display text-[22px] font-semibold mb-6" style={{ color: C.text }}>Your briefing, in 9 minutes</h2>
      <div className="flex flex-col gap-3">
        {BRIEFING.map((item) => (
          <Card key={item.id} className="p-5" style={item.urgent ? { borderColor: C.orange, borderWidth: 1.5 } : {}}>
            <div className="flex items-center gap-2 mb-2.5">
              {item.urgent && <ShieldAlert size={14} style={{ color: C.orange }} />}
              <Tag tone={item.tagTone}>{item.tag}</Tag>
              <span className="nx-mono text-[11px] ml-auto" style={{ color: C.textDim }}>{item.time}</span>
            </div>
            <h3 className="nx-body text-[14.5px] font-semibold mb-1.5 leading-snug" style={{ color: C.text }}>{item.title}</h3>
            <p className="nx-body text-[13px] mb-3 leading-relaxed" style={{ color: C.textDim }}>{item.why}</p>
            <div className="flex items-center justify-between mb-3">
              <ConfidenceBar tier={item.tier} pct={item.pct} sources={item.sources} />
              <span className="nx-mono text-[11px]" style={{ color: C.textDim }}>affects: {item.who}</span>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: C.line }}>
              <ArrowRight size={13} style={{ color: C.cyan }} />
              <span className="nx-body text-[12.5px] font-medium" style={{ color: C.cyan }}>{item.action}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   VIEW 2 — DASHBOARD
============================================================ */
function StatTile({ label, value, sub, accent }) {
  return (
    <Card className="p-5">
      <p className="nx-mono text-[10.5px] uppercase tracking-wide mb-2" style={{ color: C.textDim }}>{label}</p>
      <p className="nx-display text-[26px] font-semibold" style={{ color: accent || C.text }}>{value}</p>
      <p className="nx-body text-[12px] mt-1" style={{ color: C.textDim }}>{sub}</p>
    </Card>
  );
}

function DashboardView() {
  return (
    <div className="px-8 py-8 max-w-[1080px] mx-auto">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Trust Index" value="94%" sub="Quarterly survey, n=1,204" accent={C.cyan} />
        <StatTile label="Time saved this week" value="6.2 hrs" sub="vs. manual monitoring baseline" accent={C.cyan} />
        <StatTile label="Open urgent items" value="1" sub="next-auth advisory · unresolved" accent={C.orange} />
        <StatTile label="Sources monitored" value="118" sub="+3 added this month" accent={C.text} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 col-span-2">
          <p className="nx-body text-[13px] font-semibold mb-4" style={{ color: C.text }}>Items surfaced, last 7 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DASHBOARD_ACTIVITY}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: C.textDim, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.textDim, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, border: `1px solid ${C.line}`, background: "#0D1424", color: C.text, borderRadius: 8 }} itemStyle={{ color: C.text }} labelStyle={{ color: C.textDim }} />
              <Bar dataKey="items" fill={C.cyan} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <p className="nx-body text-[13px] font-semibold mb-4" style={{ color: C.text }}>Confidence mix, this week</p>
          <div className="flex flex-col gap-3">
            {[
              { tier: "verified", n: 58, label: "Verified" },
              { tier: "corroborated", n: 27, label: "Corroborated" },
              { tier: "provisional", n: 11, label: "Provisional" },
              { tier: "conflict", n: 4, label: "Unresolved" },
            ].map((r) => (
              <div key={r.tier}>
                <div className="flex justify-between mb-1">
                  <span className="nx-body text-[12px]" style={{ color: C.textDim }}>{r.label}</span>
                  <span className="nx-mono text-[12px]" style={{ color: TIERS[r.tier].color }}>{r.n}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: C.chip }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${r.n}%`, background: TIERS[r.tier].color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   VIEW 3 — SEARCH
============================================================ */
function SearchView() {
  return (
    <div className="max-w-[720px] mx-auto px-8 py-8">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-[6px] border mb-6" style={{ borderColor: C.cyan, background: C.text }}>
        <Search size={16} style={{ color: C.cyan }} />
        <span className="nx-body text-[14px]" style={{ color: C.text }}>next-auth vulnerability</span>
      </div>
      <p className="nx-mono text-[11px] mb-4" style={{ color: C.textDim }}>3 results · ranked by confidence and relevance to your stack</p>
      <div className="flex flex-col gap-3">
        {SEARCH_RESULTS.map((r, i) => (
          <Card key={i} className="p-4">
            <Tag>{r.kind}</Tag>
            <h3 className="nx-body text-[14px] font-semibold mt-2 mb-2" style={{ color: C.text }}>{r.title}</h3>
            <ConfidenceBar tier={r.tier} pct={r.pct} sources={r.sources} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   VIEW 4 — KNOWLEDGE EXPLORER (node-link graph)
============================================================ */
function ExplorerView() {
  const nodes = [
    { id: "core", label: "next-auth 5.x", x: 300, y: 180, r: 34, color: C.base2, text: "white" },
    { id: "a", label: "Prototype Pollution CVE", x: 130, y: 70, r: 22, color: C.orangeBg, text: C.orange },
    { id: "b", label: "npm registry", x: 470, y: 70, r: 18, color: C.chip, text: C.textDim },
    { id: "c", label: "GitHub advisory", x: 500, y: 200, r: 18, color: C.chip, text: C.textDim },
    { id: "d", label: "5.2.3 patch release", x: 420, y: 300, r: 20, color: C.cyanBg, text: C.cyan },
    { id: "e", label: "Vercel deployment note", x: 180, y: 300, r: 18, color: C.chip, text: C.textDim },
    { id: "f", label: "3 affected repos (yours)", x: 100, y: 210, r: 20, color: C.orangeBg, text: C.orange },
  ];
  const edges = [["core", "a"], ["core", "b"], ["core", "c"], ["core", "d"], ["core", "e"], ["a", "f"], ["a", "c"], ["d", "c"]];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <div className="px-8 py-8 max-w-[1080px] mx-auto">
      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2 p-5">
          <p className="nx-body text-[13px] font-semibold mb-1" style={{ color: C.text }}>next-auth 5.x — evidence network</p>
          <p className="nx-mono text-[11px] mb-4" style={{ color: C.textDim }}>7 connected entities · updated 14 min ago</p>
          <svg viewBox="0 0 600 380" className="w-full h-[340px]">
            <defs>
              <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {edges.map(([a, b], i) => (
              <line key={i} x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y} stroke="rgba(0,196,238,0.25)" strokeWidth={1.5} />
            ))}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} stroke={n.id === "core" ? C.cyan : C.line} strokeWidth={n.id === "core" ? 2 : 1} filter={n.id === "core" ? "url(#nodeGlow)" : undefined} />
                <text x={n.x} y={n.y + n.r + 15} textAnchor="middle" fontFamily="Inter" fontSize="11" fill={C.textDim}>
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </Card>
        <Card className="p-5">
          <p className="nx-body text-[13px] font-semibold mb-3" style={{ color: C.text }}>Selected node</p>
          <p className="nx-body text-[13.5px] font-semibold mb-1" style={{ color: C.text }}>next-auth 5.x</p>
          <p className="nx-body text-[12.5px] mb-3" style={{ color: C.textDim }}>Authentication library · Node.js ecosystem</p>
          <ConfidenceBar tier="verified" pct={99} sources={6} />
          <div className="mt-4 pt-4 border-t nx-body text-[12.5px] leading-relaxed" style={{ borderColor: C.line, color: C.textDim }}>
            First tracked by Nexus in March 2024. 41 verified events linked to this entity, including 3 major releases and 1 prior advisory.
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   VIEW 5 — KNOWLEDGE TIMELINE
============================================================ */
function TimelineView() {
  return (
    <div className="max-w-[720px] mx-auto px-8 py-8">
      <p className="nx-mono text-[11px] uppercase tracking-wide mb-1" style={{ color: C.cyan }}>Entity Timeline</p>
      <h2 className="nx-display text-[20px] font-semibold mb-6" style={{ color: C.text }}>React Compiler — six months of verified history</h2>
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: C.line }} />
        {TIMELINE.map((t, i) => (
          <div key={i} className="relative mb-7">
            <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: TIERS[t.tier].color, background: C.text }} />
            <p className="nx-mono text-[11px] mb-1" style={{ color: C.textDim }}>{t.date}</p>
            <p className="nx-body text-[13.5px] mb-2 leading-relaxed" style={{ color: C.text }}>{t.text}</p>
            <ConfidenceBar tier={t.tier} pct={t.pct} sources={t.sources} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   VIEW 6 — TECHNOLOGY RADAR
============================================================ */
function RadarView() {
  const cx = 260, cy = 260, maxR = 220;
  const polar = (angleDeg, rNorm) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + Math.cos(rad) * rNorm * maxR, y: cy + Math.sin(rad) * rNorm * maxR };
  };
  const rings = [
    { r: 0.25, label: "Adopt" }, { r: 0.5, label: "Trial" },
    { r: 0.75, label: "Assess" }, { r: 1, label: "Hold" },
  ];
  return (
    <div className="px-8 py-8 max-w-[1080px] mx-auto">
      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2 p-6 flex items-center justify-center">
          <svg width="520" height="520" viewBox="0 0 520 520">
            <defs>
              <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {rings.slice().reverse().map((ring) => (
              <circle key={ring.label} cx={cx} cy={cy} r={ring.r * maxR} fill="none" stroke={C.line} strokeWidth={1} />
            ))}
            <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke={C.line} />
            <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke={C.line} />
            {RADAR_ITEMS.map((item, i) => {
              const p = polar(item.angle, item.r);
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={7} fill={RING_COLORS[item.ring]} filter="url(#dotGlow)" />
                  <text x={p.x + 11} y={p.y + 4} fontFamily="Inter" fontSize="11" fill={C.text}>{item.name}</text>
                </g>
              );
            })}
          </svg>
        </Card>
        <Card className="p-5">
          <p className="nx-body text-[13px] font-semibold mb-4" style={{ color: C.text }}>Ring legend</p>
          {["adopt", "trial", "assess", "hold"].map((r) => (
            <div key={r} className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: RING_COLORS[r] }} />
              <span className="nx-body text-[13px] capitalize" style={{ color: C.text }}>{r}</span>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
            <p className="nx-body text-[12px] leading-relaxed" style={{ color: C.textDim }}>
              Position is derived from verified adoption and sentiment signals across your configured stack — never from vendor marketing.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   VIEW 7 — TREND EXPLORER
============================================================ */
function TrendsView() {
  return (
    <div className="max-w-[840px] mx-auto px-8 py-8">
      <p className="nx-mono text-[11px] uppercase tracking-wide mb-1" style={{ color: C.cyan }}>Trend Explorer</p>
      <h2 className="nx-display text-[20px] font-semibold mb-1" style={{ color: C.text }}>Server Components adoption vs. sentiment</h2>
      <p className="nx-body text-[13px] mb-6" style={{ color: C.textDim }}>Derived from 3,400+ verified events across the flagship developer ecosystem</p>
      <Card className="p-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={TREND_DATA}>
            <defs>
              <linearGradient id="adoptionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={C.line} vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.textDim, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.textDim, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, border: `1px solid ${C.line}`, background: "#0D1424", color: C.text, borderRadius: 8 }} itemStyle={{ color: C.text }} labelStyle={{ color: C.textDim }} />
            <Area type="monotone" dataKey="adoption" stroke={C.cyan} fill="url(#adoptionGrad)" strokeWidth={2} name="Adoption %" />
            <Line type="monotone" dataKey="sentiment" stroke="#7FE3F7" strokeWidth={2} strokeDasharray="4 3" dot={false} name="Sentiment score" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
          <div className="flex items-center gap-2"><span className="w-2.5 h-0.5" style={{ background: C.cyan }} /><span className="nx-body text-[12px]" style={{ color: C.textDim }}>Adoption</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-0.5" style={{ background: "#7FE3F7" }} /><span className="nx-body text-[12px]" style={{ color: C.textDim }}>Sentiment</span></div>
          <ConfidenceBar tier="verified" pct={94} sources={12} compact={false} />
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   VIEW 8 — IMPACT ANALYSIS
============================================================ */
function ImpactView() {
  const rows = [
    { area: "Authentication service", severity: "Critical", detail: "Direct dependency on the affected next-auth version." },
    { area: "Admin dashboard", severity: "Critical", detail: "Shares the same session middleware." },
    { area: "Public marketing site", severity: "None", detail: "Does not use next-auth." },
  ];
  const sevColor = { Critical: C.orange, Moderate: C.orangeSoft, None: C.cyan };
  return (
    <div className="max-w-[780px] mx-auto px-8 py-8">
      <p className="nx-mono text-[11px] uppercase tracking-wide mb-1" style={{ color: C.cyan }}>Impact Analysis</p>
      <h2 className="nx-display text-[20px] font-semibold mb-4" style={{ color: C.text }}>next-auth prototype pollution — impact on your stack</h2>
      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between">
          <ConfidenceBar tier="verified" pct={99} sources={6} />
          <Tag tone="alert">Critical · action required</Tag>
        </div>
      </Card>
      <div className="flex flex-col gap-3 mb-6">
        {rows.map((r, i) => (
          <Card key={i} className="p-4 flex items-center justify-between">
            <div>
              <p className="nx-body text-[13.5px] font-semibold" style={{ color: C.text }}>{r.area}</p>
              <p className="nx-body text-[12.5px] mt-0.5" style={{ color: C.textDim }}>{r.detail}</p>
            </div>
            <span className="nx-mono text-[11px] px-2.5 py-1 rounded" style={{ color: sevColor[r.severity], background: C.chip }}>{r.severity}</span>
          </Card>
        ))}
      </div>
      <Card className="p-5" style={{ background: "rgba(0,196,238,0.05)", borderStyle: "dashed", borderColor: C.cyanDim }}>
        <p className="nx-body text-[13px] font-semibold mb-1" style={{ color: C.text }}>Recommended next step</p>
        <p className="nx-body text-[13px]" style={{ color: C.textDim }}>Patch to next-auth 5.2.3 in the authentication service and admin dashboard before end of day.</p>
      </Card>
    </div>
  );
}

/* ============================================================
   VIEW 9 — LEARNING CENTER
============================================================ */
function LearningView() {
  return (
    <div className="px-8 py-8 max-w-[900px] mx-auto">
      <h2 className="nx-display text-[20px] font-semibold mb-1" style={{ color: C.text }}>Learning Center</h2>
      <p className="nx-body text-[13px] mb-6" style={{ color: C.textDim }}>Verified, foundational material — not a video recommendation feed</p>
      <div className="grid grid-cols-2 gap-4">
        {LEARNING_TRACKS.map((t, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag>{t.level}</Tag>
              <span className="nx-mono text-[11px]" style={{ color: C.textDim }}>{t.time}</span>
            </div>
            <h3 className="nx-body text-[14px] font-semibold mb-3 leading-snug" style={{ color: C.text }}>{t.title}</h3>
            <div className="flex items-center justify-between">
              <ConfidenceBar tier={t.tier} pct={t.pct} compact />
              <Play size={15} style={{ color: C.cyan }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   VIEW 10 — AI ASSISTANT
============================================================ */
function AssistantView() {
  return (
    <div className="max-w-[720px] mx-auto px-8 py-8 flex flex-col h-full">
      <h2 className="nx-display text-[18px] font-semibold mb-1" style={{ color: C.text }}>Nexus AI Assistant</h2>
      <p className="nx-body text-[12.5px] mb-6" style={{ color: C.textDim }}>Grounded strictly in verified, retrieved evidence — never unconstrained generation</p>
      <div className="flex-1 flex flex-col gap-4 mb-4">
        <div className="self-end max-w-[80%] px-4 py-2.5 rounded-[10px]" style={{ background: C.base2 }}>
          <p className="nx-body text-[13.5px] text-white">Is it safe to upgrade next-auth today, or should I wait?</p>
        </div>
        <div className="max-w-[85%]">
          <Card className="p-4">
            <p className="nx-body text-[13.5px] leading-relaxed mb-3" style={{ color: C.text }}>
              Yes — the 5.2.3 patch has been verified against the official advisory and corroborated by two independent teams
              who deployed it to production without regressions. Your authentication service and admin dashboard are both affected
              by the underlying issue, so upgrading today is recommended rather than optional.
            </p>
            <ConfidenceBar tier="verified" pct={99} sources={6} />
            <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: C.line }}>
              <ExternalLink size={12} style={{ color: C.cyan }} />
              <span className="nx-mono text-[11px]" style={{ color: C.cyan }}>View 6 supporting sources</span>
            </div>
          </Card>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 rounded-[8px] border" style={{ borderColor: C.line }}>
        <input className="nx-focus flex-1 nx-body text-[13.5px] outline-none" placeholder="Ask about anything in your knowledge graph…" style={{ color: C.text }} />
        <Send size={16} style={{ color: C.cyan }} />
      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP
============================================================ */
const TITLES = {
  briefing: ["Daily Briefing", "12 items surfaced from 2,014,382 events"],
  dashboard: ["Dashboard", "Your knowledge domain, at a glance"],
  search: ["Search", "Precise and semantic search across the knowledge graph"],
  explorer: ["Knowledge Explorer", "Navigate the graph visually, entity by entity"],
  timeline: ["Knowledge Timeline", "How a single fact evolved, verified step by step"],
  radar: ["Technology Radar", "Adopt, trial, assess, hold — based on evidence, not hype"],
  trends: ["Trend Explorer", "Adoption and sentiment over time"],
  impact: ["Impact Analysis", "What a development means for your specific stack"],
  learning: ["Learning Center", "Verified material for building depth"],
  assistant: ["AI Assistant", "Conversational access to the knowledge graph"],
};

export default function NexusProductDesign() {
  const initial = (() => {
    try {
      const p = new URLSearchParams(window.location.search).get("view");
      return p && TITLES[p] ? p : "briefing";
    } catch (e) { return "briefing"; }
  })();
  const [view, setView] = useState(initial);
  const ViewComponent = {
    briefing: BriefingView, dashboard: DashboardView, search: SearchView,
    explorer: ExplorerView, timeline: TimelineView, radar: RadarView,
    trends: TrendsView, impact: ImpactView, learning: LearningView, assistant: AssistantView,
  }[view];
  const [title, subtitle] = TITLES[view];

  return (
    <div
      className="w-full h-full flex nx-body"
      style={{
        background: `radial-gradient(1200px 800px at 15% -10%, rgba(0,196,238,0.09), transparent 60%), radial-gradient(900px 700px at 100% 100%, rgba(255,96,0,0.05), transparent 55%), linear-gradient(180deg, ${C.base}, ${C.base2})`,
        color: C.text,
      }}
    >
      <FontStyle />
      <Sidebar view={view} setView={setView} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto nx-scrollbar">
          <ViewComponent />
        </main>
      </div>
    </div>
  );
}
