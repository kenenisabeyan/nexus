import sys
sys.path.insert(0, "/home/claude/static")
from template import confidence_bar, wrap

# ============================================================ BRIEFING
def briefing_content():
    items = [
        dict(urgent=True, tier="conflict", pct=99, sources=6, tag="Security Advisory", tagcls="alert",
             title="Critical: Prototype pollution vulnerability disclosed in a transitive dependency of next-auth",
             why="Affects 3 of your production services. Exploitable without authentication in default config.",
             who="Backend, Security", action="Patch to next-auth 5.2.3 or apply the documented workaround today.", time="14 min ago"),
        dict(urgent=False, tier="verified", pct=98, sources=9, tag="Release", tagcls="cyan",
             title="React 19.2 ships the compiler-aware useEffectEvent hook out of experimental",
             why="Removes a common source of stale-closure bugs in your existing effect code.",
             who="Frontend", action="No action required. Consider adopting in new components.", time="1 hr ago"),
        dict(urgent=False, tier="conflict", pct=41, sources=5, tag="AI Ecosystem", tagcls="",
             title="Vendor claims new inference framework is '3x faster' than vLLM on identical hardware",
             why="Two independent reproductions have not matched the claimed figure; one shows near parity.",
             who="AI Engineering", action="Treat as unresolved. Both sources shown below.", time="2 hr ago"),
        dict(urgent=False, tier="corroborated", pct=82, sources=4, tag="Community", tagcls="",
             title="Community RFC proposes deprecating the legacy Next.js Pages Router migration path",
             why="Relevant to your Q3 migration plan; timeline still under discussion.",
             who="Frontend, Platform", action="Worth reading before your migration kickoff.", time="5 hr ago"),
    ]
    # fix: first item marked urgent uses conflict-style border but tier for its confidence bar should be "verified" (99% confidence it's real & critical)
    items[0]["tier"] = "verified"

    cards = ""
    for it in items:
        urgent_cls = " urgent" if it["urgent"] else ""
        shield = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6000" stroke-width="2" style="margin-right:6px"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/></svg>' if it["urgent"] else ""
        cards += f'''
        <div class="card{urgent_cls}" style="padding:20px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;margin-bottom:11px;">
            {shield}<span class="tag {it['tagcls']}">{it['tag']}</span>
            <span class="mono" style="font-size:11px;color:#6B7690;margin-left:auto;">{it['time']}</span>
          </div>
          <h3 style="font-size:14.5px;font-weight:600;margin-bottom:7px;line-height:1.4;">{it['title']}</h3>
          <p style="font-size:13px;color:#9AA5BD;margin-bottom:13px;line-height:1.55;">{it['why']}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;">
            {confidence_bar(it['tier'], it['pct'], it['sources'])}
            <span class="mono" style="font-size:11px;color:#6B7690;">affects: {it['who']}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C4EE" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            <span style="font-size:12.5px;font-weight:500;color:#5FE2FF;">{it['action']}</span>
          </div>
        </div>'''
    return f'''
    <div style="max-width:760px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span class="mono" style="font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:#00C4EE;">Tuesday, August 4 · 7:02 AM</span>
        <span class="mono" style="font-size:11px;color:#6B7690;">2,014,382 events processed overnight → 12 surfaced</span>
      </div>
      <h2 class="page-title" style="margin-bottom:22px;">Your briefing, in 9 minutes</h2>
      {cards}
    </div>'''

# ============================================================ DASHBOARD
def dashboard_content():
    stats = [
        ("Trust Index", "94%", "Quarterly survey, n=1,204", "#00C4EE"),
        ("Time saved this week", "6.2 hrs", "vs. manual monitoring baseline", "#5FE2FF"),
        ("Open urgent items", "1", "next-auth advisory · unresolved", "#FF6000"),
        ("Sources monitored", "118", "+3 added this month", "#F8FAFC"),
    ]
    tiles = "".join(f'''
      <div class="card" style="padding:20px;">
        <div class="mono" style="font-size:10px;letter-spacing:0.6px;text-transform:uppercase;color:#6B7690;margin-bottom:10px;">{label}</div>
        <div style="font-size:27px;font-weight:600;color:{color};">{val}</div>
        <div style="font-size:12px;color:#8B96AC;margin-top:6px;">{sub}</div>
      </div>''' for label, val, sub, color in stats)

    bars = [11, 9, 14, 8, 12, 4, 6]
    days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    maxb = max(bars)
    bar_html = ""
    for d, v in zip(days, bars):
        h = int(v / maxb * 130)
        bar_html += f'''<div style="display:flex;flex-direction:column;align-items:center;flex:1;">
          <div style="width:26px;height:{h}px;border-radius:5px 5px 0 0;background:linear-gradient(180deg,#00C4EE,#0B84AC);box-shadow:0 0 14px rgba(0,196,238,0.35);margin-bottom:8px;"></div>
          <span class="mono" style="font-size:10.5px;color:#6B7690;">{d}</span></div>'''

    mix = [("Verified", 58, "#00C4EE"), ("Corroborated", 27, "#5FE2FF"), ("Provisional", 11, "#3B7A99"), ("Unresolved", 4, "#FF6000")]
    mix_html = ""
    for label, pct, color in mix:
        mix_html += f'''<div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:12px;color:#9AA5BD;">{label}</span><span class="mono" style="font-size:12px;color:{color};">{pct}%</span>
          </div>
          <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.06);">
            <div style="width:{pct}%;height:6px;border-radius:3px;background:{color};box-shadow:0 0 8px {color};"></div>
          </div></div>'''

    return f'''
    <div style="max-width:1080px;margin:0 auto;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;">{tiles}</div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
        <div class="card" style="padding:22px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:20px;">Items surfaced, last 7 days</div>
          <div style="display:flex;align-items:flex-end;gap:14px;height:150px;">{bar_html}</div>
        </div>
        <div class="card" style="padding:22px;">
          <div style="font-size:13px;font-weight:600;margin-bottom:18px;">Confidence mix, this week</div>
          {mix_html}
        </div>
      </div>
    </div>'''

# ============================================================ SEARCH
def search_content():
    results = [
        ("next-auth prototype pollution advisory — full technical breakdown", "verified", 99, 6, "Security Advisory"),
        ("How three teams patched the next-auth vulnerability in production", "corroborated", 87, 4, "Community"),
        ("next-auth 5.x migration guide (official documentation)", "verified", 100, 1, "Official Docs"),
    ]
    cards = "".join(f'''
      <div class="card" style="padding:17px;margin-bottom:12px;">
        <span class="tag">{kind}</span>
        <h3 style="font-size:14px;font-weight:600;margin:10px 0 10px;">{title}</h3>
        {confidence_bar(tier, pct, src)}
      </div>''' for title, tier, pct, src, kind in results)
    return f'''
    <div style="max-width:720px;margin:0 auto;">
      <div class="card glow" style="display:flex;align-items:center;gap:10px;padding:14px 18px;margin-bottom:22px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C4EE" stroke-width="2"><path d="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3"/></svg>
        <span style="font-size:14px;">next-auth vulnerability</span>
      </div>
      <p class="mono" style="font-size:11px;color:#6B7690;margin-bottom:16px;">3 results · ranked by confidence and relevance to your stack</p>
      {cards}
    </div>'''

# ============================================================ EXPLORER
def explorer_content():
    nodes = [
        ("core", "next-auth 5.x", 300, 190, 36, "#00C4EE", True),
        ("a", "Prototype Pollution CVE", 120, 70, 24, "#FF6000", False),
        ("b", "npm registry", 490, 60, 18, "#3A4560", False),
        ("c", "GitHub advisory", 520, 210, 18, "#3A4560", False),
        ("d", "5.2.3 patch release", 430, 320, 20, "#00C4EE", False),
        ("e", "Vercel deployment note", 170, 320, 18, "#3A4560", False),
        ("f", "3 affected repos (yours)", 90, 220, 20, "#FF6000", False),
    ]
    edges = [("core","a"),("core","b"),("core","c"),("core","d"),("core","e"),("a","f"),("a","c"),("d","c")]
    byid = {n[0]: n for n in nodes}
    lines = "".join(f'<line x1="{byid[a][2]}" y1="{byid[a][3]}" x2="{byid[b][2]}" y2="{byid[b][3]}" stroke="rgba(255,255,255,0.14)" stroke-width="1.5"/>' for a,b in edges)
    circles = ""
    for _id, label, x, y, r, color, core in nodes:
        glow = f'style="filter:drop-shadow(0 0 10px {color})"' if core or color=="#FF6000" else ""
        circles += f'''<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" {glow}/>
        <text x="{x}" y="{y+r+16}" text-anchor="middle" font-family="Poppins" font-size="11" fill="#9AA5BD">{label}</text>'''
    return f'''
    <div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr;gap:18px;">
      <div class="card" style="padding:22px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:3px;">next-auth 5.x — evidence network</div>
        <p class="mono" style="font-size:11px;color:#6B7690;margin-bottom:16px;">7 connected entities · updated 14 min ago</p>
        <svg viewBox="0 0 600 380" style="width:100%;height:360px;">{lines}{circles}</svg>
      </div>
      <div class="card" style="padding:22px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:14px;">Selected node</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:4px;">next-auth 5.x</div>
        <div style="font-size:12.5px;color:#8B96AC;margin-bottom:14px;">Authentication library · Node.js ecosystem</div>
        {confidence_bar("verified", 99, 6)}
        <div style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:12.5px;color:#9AA5BD;line-height:1.6;">
          First tracked by Nexus in March 2024. 41 verified events linked to this entity, including 3 major releases and 1 prior advisory.
        </div>
      </div>
    </div>'''

# ============================================================ TIMELINE
def timeline_content():
    events = [
        ("Jan 2026", "provisional", 55, "Early benchmarks suggest React Compiler reduces re-renders by ~30% in typical CRUD apps.", 2),
        ("Mar 2026", "corroborated", 78, "Three independent teams report consistent gains across production codebases.", 4),
        ("May 2026", "verified", 96, "React Compiler graduates to stable; Meta reports adoption across internal surfaces.", 7),
        ("Jul 2026", "verified", 98, "Ecosystem-wide adoption confirmed across Next.js, Remix, and React Router.", 11),
    ]
    dot_color = {"verified":"#00C4EE","corroborated":"#5FE2FF","provisional":"#3B7A99","conflict":"#FF6000"}
    rows = ""
    n = len(events)
    for i, (date, tier, pct, text, src) in enumerate(events):
        is_last = i == n - 1
        rail = "" if is_last else f'<div style="width:2px;flex:1;background:rgba(255,255,255,0.16);margin-top:4px;"></div>'
        rows += f'''
        <div style="display:flex;gap:20px;">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:4px;">
            <div style="width:14px;height:14px;border-radius:50%;background:#0B1120;border:2px solid {dot_color[tier]};box-shadow:0 0 8px {dot_color[tier]};flex-shrink:0;"></div>
            {rail}
          </div>
          <div style="padding-bottom:32px;flex:1;">
            <div class="mono" style="font-size:11px;color:#6B7690;margin-bottom:5px;">{date}</div>
            <div style="font-size:13.5px;margin-bottom:9px;line-height:1.55;">{text}</div>
            {confidence_bar(tier, pct, src)}
          </div>
        </div>'''
    return f'''
    <div style="max-width:720px;margin:0 auto;">
      <div class="mono" style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:#00C4EE;margin-bottom:6px;">Entity Timeline</div>
      <h2 class="page-title" style="margin-bottom:26px;">React Compiler — six months of verified history</h2>
      <div>{rows}</div>
    </div>'''

# ============================================================ RADAR
def radar_content():
    import math
    items = [
        ("React 19", "adopt", 20, 0.85), ("Next.js 15", "adopt", 55, 0.8), ("Bun", "trial", 100, 0.55),
        ("Effect-TS", "assess", 140, 0.3), ("Turbopack", "trial", 190, 0.6), ("Legacy Redux Thunk", "hold", 230, 0.15),
        ("Deno Deploy", "assess", 270, 0.35), ("tRPC v11", "adopt", 310, 0.82), ("GraphQL Yoga", "trial", 340, 0.5),
    ]
    ring_color = {"adopt":"#00C4EE","trial":"#5FE2FF","assess":"#3B7A99","hold":"#FF6000"}
    cx, cy, maxr = 260, 260, 220
    rings = "".join(f'<circle cx="{cx}" cy="{cy}" r="{r*maxr}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>' for r in [0.25,0.5,0.75,1])
    dots = ""
    for name, ring, ang, rn in items:
        rad = math.radians(ang)
        x = cx + math.cos(rad)*rn*maxr
        y = cy + math.sin(rad)*rn*maxr
        color = ring_color[ring]
        dots += f'''<circle cx="{x}" cy="{y}" r="7" fill="{color}" style="filter:drop-shadow(0 0 6px {color})"/>
        <text x="{x+12}" y="{y+4}" font-family="Poppins" font-size="11" fill="#F8FAFC">{name}</text>'''
    legend = "".join(f'''<div style="display:flex;align-items:center;gap:9px;margin-bottom:13px;">
        <span style="width:10px;height:10px;border-radius:50%;background:{ring_color[r]};box-shadow:0 0 6px {ring_color[r]};"></span>
        <span style="font-size:13px;text-transform:capitalize;">{r}</span></div>''' for r in ["adopt","trial","assess","hold"])
    return f'''
    <div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr;gap:18px;">
      <div class="card" style="padding:26px;display:flex;align-items:center;justify-content:center;">
        <svg width="520" height="520" viewBox="0 0 520 520">
          {rings}
          <line x1="{cx-maxr}" y1="{cy}" x2="{cx+maxr}" y2="{cy}" stroke="rgba(255,255,255,0.10)"/>
          <line x1="{cx}" y1="{cy-maxr}" x2="{cx}" y2="{cy+maxr}" stroke="rgba(255,255,255,0.10)"/>
          {dots}
        </svg>
      </div>
      <div class="card" style="padding:22px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:18px;">Ring legend</div>
        {legend}
        <div style="margin-top:14px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:#8B96AC;line-height:1.6;">
          Position is derived from verified adoption and sentiment signals across your configured stack — never from vendor marketing.
        </div>
      </div>
    </div>'''

# ============================================================ TRENDS
def trends_content():
    data = [22,28,34,41,52,60]
    sent = [61,64,59,68,71,74]
    months = ["Feb","Mar","Apr","May","Jun","Jul"]
    w, h = 640, 220
    def pts(vals, vmax=100):
        step = w/(len(vals)-1)
        return " ".join(f"{i*step:.0f},{h-(v/vmax*h):.0f}" for i,v in enumerate(vals))
    area_pts = pts(data)
    line_pts = pts(sent)
    area_path = f"M0,{h} L{area_pts} L{w},{h} Z"
    return f'''
    <div style="max-width:840px;margin:0 auto;">
      <div class="mono" style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:#00C4EE;margin-bottom:6px;">Trend Explorer</div>
      <h2 class="page-title">Server Components adoption vs. sentiment</h2>
      <p class="page-desc">Derived from 3,400+ verified events across the flagship developer ecosystem</p>
      <div class="card" style="padding:26px;">
        <svg viewBox="0 0 {w} {h+30}" style="width:100%;height:280px;">
          <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00C4EE" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#00C4EE" stop-opacity="0"/>
          </linearGradient></defs>
          {"".join(f'<line x1="0" y1="{h*i/4:.0f}" x2="{w}" y2="{h*i/4:.0f}" stroke="rgba(255,255,255,0.06)"/>' for i in range(5))}
          <path d="{area_path}" fill="url(#ag)"/>
          <polyline points="{area_pts}" fill="none" stroke="#00C4EE" stroke-width="2.5"/>
          <polyline points="{line_pts}" fill="none" stroke="#5FE2FF" stroke-width="2" stroke-dasharray="4 3"/>
          {"".join(f'<text x="{i*(w/(len(months)-1)):.0f}" y="{h+22}" font-family="Liberation Mono" font-size="11" fill="#6B7690" text-anchor="middle">{m}</text>' for i,m in enumerate(months))}
        </svg>
        <div style="display:flex;align-items:center;gap:22px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:2px;background:#00C4EE;"></span><span style="font-size:12px;color:#9AA5BD;">Adoption</span></div>
          <div style="display:flex;align-items:center;gap:7px;"><span style="width:12px;height:2px;background:#5FE2FF;"></span><span style="font-size:12px;color:#9AA5BD;">Sentiment</span></div>
          {confidence_bar("verified", 94, 12)}
        </div>
      </div>
    </div>'''

# ============================================================ IMPACT
def impact_content():
    rows = [
        ("Authentication service", "Critical", "Direct dependency on the affected next-auth version.", "#FF6000"),
        ("Admin dashboard", "Critical", "Shares the same session middleware.", "#FF6000"),
        ("Public marketing site", "None", "Does not use next-auth.", "#00C4EE"),
    ]
    rows_html = "".join(f'''
      <div class="card" style="padding:16px 18px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-size:13.5px;font-weight:600;">{area}</div><div style="font-size:12.5px;color:#8B96AC;margin-top:3px;">{detail}</div></div>
        <span class="mono" style="font-size:11px;padding:5px 11px;border-radius:6px;background:rgba(255,255,255,0.06);color:{color};">{sev}</span>
      </div>''' for area, sev, detail, color in rows)
    return f'''
    <div style="max-width:780px;margin:0 auto;">
      <div class="mono" style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:#00C4EE;margin-bottom:6px;">Impact Analysis</div>
      <h2 class="page-title" style="margin-bottom:20px;">next-auth prototype pollution — impact on your stack</h2>
      <div class="card" style="padding:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;">
        {confidence_bar("verified", 99, 6)}
        <span class="tag alert">Critical · action required</span>
      </div>
      {rows_html}
      <div class="card" style="padding:18px;margin-top:6px;border-style:dashed;border-color:rgba(0,196,238,0.35);">
        <div style="font-size:13px;font-weight:600;margin-bottom:6px;">Recommended next step</div>
        <div style="font-size:13px;color:#9AA5BD;">Patch to next-auth 5.2.3 in the authentication service and admin dashboard before end of day.</div>
      </div>
    </div>'''

# ============================================================ LEARNING
def learning_content():
    tracks = [
        ("React Server Components, from first principles", "Intermediate", "45 min", "verified", 97),
        ("Reading a CVE like a security engineer", "Beginner", "20 min", "verified", 95),
        ("Evaluating AI coding agent benchmarks critically", "Advanced", "35 min", "corroborated", 84),
        ("Postgres indexing strategies for high-write workloads", "Intermediate", "30 min", "verified", 96),
    ]
    cards = "".join(f'''
      <div class="card" style="padding:20px;">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:14px;">
          <span class="tag">{level}</span><span class="mono" style="font-size:11px;color:#6B7690;">{time}</span>
        </div>
        <div style="font-size:14px;font-weight:600;margin-bottom:16px;line-height:1.4;">{title}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          {confidence_bar(tier, pct, label=True)}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00C4EE" stroke-width="2"><path d="M6 4l14 8-14 8z"/></svg>
        </div>
      </div>''' for title, level, time, tier, pct in tracks)
    return f'''
    <div style="max-width:900px;margin:0 auto;">
      <h2 class="page-title">Learning Center</h2>
      <p class="page-desc">Verified, foundational material — not a video recommendation feed</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">{cards}</div>
    </div>'''

# ============================================================ ASSISTANT
def assistant_content():
    return f'''
    <div style="max-width:720px;margin:0 auto;display:flex;flex-direction:column;height:820px;">
      <h2 style="font-size:18px;font-weight:600;margin-bottom:4px;">Nexus AI Assistant</h2>
      <p style="font-size:12.5px;color:#8B96AC;margin-bottom:26px;">Grounded strictly in verified, retrieved evidence — never unconstrained generation</p>
      <div style="flex:1;">
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
          <div style="max-width:80%;padding:11px 16px;border-radius:12px 12px 2px 12px;background:linear-gradient(135deg,#00C4EE,#0B84AC);">
            <span style="font-size:13.5px;color:#04141C;">Is it safe to upgrade next-auth today, or should I wait?</span>
          </div>
        </div>
        <div style="max-width:85%;">
          <div class="card" style="padding:18px;">
            <p style="font-size:13.5px;line-height:1.6;color:#E4E9F2;margin-bottom:14px;">
              Yes — the 5.2.3 patch has been verified against the official advisory and corroborated by two independent teams
              who deployed it to production without regressions. Your authentication service and admin dashboard are both affected
              by the underlying issue, so upgrading today is recommended rather than optional.
            </p>
            {confidence_bar("verified", 99, 6)}
            <div style="display:flex;align-items:center;gap:7px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C4EE" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
              <span class="mono" style="font-size:11px;color:#00C4EE;">View 6 supporting sources</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="display:flex;align-items:center;gap:10px;padding:14px 18px;">
        <span style="flex:1;font-size:13.5px;color:#6B7690;">Ask about anything in your knowledge graph…</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00C4EE" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
      </div>
    </div>'''

PAGES = {
    "briefing": briefing_content, "dashboard": dashboard_content, "search": search_content,
    "explorer": explorer_content, "timeline": timeline_content, "radar": radar_content,
    "trends": trends_content, "impact": impact_content, "learning": learning_content,
    "assistant": assistant_content,
}

if __name__ == "__main__":
    import os
    os.makedirs("/home/claude/static/html", exist_ok=True)
    for name, fn in PAGES.items():
        html = wrap(name, fn())
        with open(f"/home/claude/static/html/{name}.html", "w") as f:
            f.write(html)
    print("generated", len(PAGES), "html files")
