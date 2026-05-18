// "use client";

// import { useEffect, useState } from "react";
// import { useTheme } from "../../../utils/themeProvider/Themeprovider";

// function ProgressBar({ value, color = "var(--accent)", max = 100 }) {
//   return (
//     <div className="progress-bar-wrap">
//       <div
//         className="progress-bar"
//         style={{
//           width: `${Math.min((value / (max || 1)) * 100, 100)}%`,
//           background: color,
//         }}
//       />
//     </div>
//   );
// }

// function Skeleton({ h = 20, w = "100%" }) {
//   return (
//     <div style={{ height: h, width: w, borderRadius: 6, background: "var(--bg-hover)", animation: "pulse 1.4s ease-in-out infinite" }} />
//   );
// }

// function InsightPill({ label, value, color = "var(--accent)" }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 16px", borderRadius: 10, background: "var(--bg-hover)", border: "1px solid var(--border)", flex: 1, minWidth: 100 }}>
//       <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>{label}</span>
//       <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "Syne, sans-serif" }}>{value}</span>
//     </div>
//   );
// }

// // ── Placement Pulse Banner ───────────────────────────────────────────────────
// function PlacementPulse({ data }) {
//   if (!data) return null;
//   const items = [
//     { icon: "📤", label: "Apps tracked", value: data.totalApps.toLocaleString() },
//     { icon: "📞", label: "Avg callback rate", value: `${data.callbackRate}%` },
//     { icon: "🔥", label: "Most active role", value: data.trendingRole },
//     { icon: "🏆", label: "Best platform", value: data.topPlatform },
//     { icon: "⏱️", label: "Avg days to offer", value: `${data.avgDaysToOffer}d` },
//     { icon: "👥", label: "Active this week", value: data.activeUsers },
//   ];
//   return (
//     <div style={{ marginBottom: 24, padding: "16px 20px", borderRadius: 12, background: "linear-gradient(135deg, rgba(16,185,129,0.07) 0%, var(--bg-card) 100%)", border: "1px solid var(--accent-border)" }}>
//       <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
//         ◈ This Week's Placement Pulse
//       </div>
//       <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
//         {items.map((item) => (
//           <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: "var(--bg-hover)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
//             <span>{item.icon}</span>
//             <span style={{ color: "var(--text-muted)" }}>{item.label}:</span>
//             <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.value}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ── Community Mood ───────────────────────────────────────────────────────────
// function CommunityMood({ mood, totalApps }) {
//   if (!mood) return null;
//   const hasEnoughData = totalApps >= 10;
//   if (!hasEnoughData) return (
//     <div className="card" style={{ marginBottom: 0 }}>
//       <div className="card-title">Community Reality Check</div>
//       <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
//         Need more community data to show reliable trends.
//       </div>
//     </div>
//   );
//   const items = [
//     { pct: mood.ghostedPct, label: "got ghosted", color: "var(--red)", icon: "👻" },
//     { pct: mood.interviewPct, label: "received interviews", color: "var(--yellow)", icon: "🎙️" },
//     { pct: mood.offerPct, label: "received offers", color: "var(--green)", icon: "🎉" },
//   ];
//   return (
//     <div className="card" style={{ marginBottom: 0 }}>
//       <div className="card-title">Community Reality Check</div>
//       <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>Brutally honest. This week across all users.</div>
//       <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//         {items.map((item) => (
//           <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
//             <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
//             <div style={{ flex: 1 }}>
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//                 <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.pct}% of users</span>
//                 <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.label}</span>
//               </div>
//               <ProgressBar value={item.pct} max={100} color={item.color} />
//             </div>
//           </div>
//         ))}
//       </div>
//       <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, background: "rgba(16,185,129,0.06)", border: "1px solid var(--accent-border)", fontSize: 12, color: "var(--text-secondary)" }}>
//         💡 If you're getting ghosted, you're not alone — most people are.
//       </div>
//     </div>
//   );
// }

// // ── Ghosting Analytics ───────────────────────────────────────────────────────
// function GhostingCard({ ghosting, totalApps }) {
//   if (!ghosting) return null;
//   const hasEnoughData = totalApps >= 5;
//   return (
//     <div className="card" style={{ marginBottom: 0 }}>
//       <div className="card-title">👻 Ghosting Analytics</div>
//       {!hasEnoughData ? (
//         <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>Need more data to show ghosting trends.</div>
//       ) : (
//         <>
//           <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
//             <InsightPill label="Ghosted apps" value={`${ghosting.ghostRate}%`} color="var(--red)" />
//             <InsightPill label="Avg ghost time" value={`${ghosting.avgGhostDays}+ days`} color="var(--yellow)" />
//             <InsightPill label="Most ghosted" value={ghosting.mostGhostedPlatform} color="var(--text-secondary)" />
//           </div>
//           <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
//             <strong style={{ color: "var(--text-secondary)" }}>{ghosting.ghostedApps}</strong> applications received no response after {ghosting.avgGhostDays}+ days.
//             If you haven't heard back in 2 weeks, assume it's a ghost — but follow up once.
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ── Rejection Breakdown ──────────────────────────────────────────────────────
// function RejectionCard({ rejectionStages, totalApps }) {
//   if (!rejectionStages) return null;
//   const total = Object.values(rejectionStages).reduce((a, b) => a + b, 0);
//   const hasEnoughData = total >= 3;
//   const stages = [
//     { key: "Resume screening", icon: "📄", color: "var(--red)" },
//     { key: "OA/Test round",    icon: "💻", color: "var(--yellow)" },
//     { key: "Interview",        icon: "🎙️", color: "var(--blue)" },
//     { key: "Other",            icon: "❓", color: "var(--text-muted)" },
//   ];
//   return (
//     <div className="card" style={{ marginBottom: 0 }}>
//       <div className="card-title">Rejection Breakdown</div>
//       <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>Where most people get cut in the process.</div>
//       {!hasEnoughData ? (
//         <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>Not enough rejection data yet.</div>
//       ) : (
//         <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//           {stages.map(({ key, icon, color }) => {
//             const count = rejectionStages[key] || 0;
//             const pct = total > 0 ? Math.round((count / total) * 100) : 0;
//             return (
//               <div key={key}>
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//                   <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{icon} {key}</span>
//                   <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{count} · {pct}%</span>
//                 </div>
//                 <ProgressBar value={pct} max={100} color={color} />
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function CommunityPage() {
//   const { theme } = useTheme();
//   const [activeTab, setActiveTab] = useState("overview");
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetch("/api/community/stats")
//       .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
//       .then((d) => { setData(d); setLoading(false); })
//       .catch((e) => { setError(e.message); setLoading(false); });
//   }, []);

//   const tabs = [
//     { id: "overview", label: "Overview" },
//     { id: "platforms", label: "Platforms" },
//     { id: "roles", label: "Role Heatmap" },
//     { id: "insights", label: "Insights" },
//   ];

//   const funnelSteps = data ? [
//     { label: "Applications sent",   value: data.avgAppsBeforeOffer,                                         icon: "📤", color: "var(--blue)"   },
//     { label: "Callbacks received",  value: Math.round(data.avgAppsBeforeOffer * (data.callbackRate / 100)), icon: "📞", color: "var(--accent)" },
//     { label: "Interviews attended", value: data.avgInterviewsBeforeOffer,                                   icon: "🎙️", color: "var(--yellow)" },
//     { label: "Offer received",      value: 1,                                                               icon: "🎉", color: "var(--green)"  },
//   ] : [];

//   return (
//     <>
//       <style>{`
//         @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
//       `}</style>

//       {/* ── Page header ─────────────────────────────────────────────────── */}
//       <div className="topbar">
//         <div>
//           <div className="page-title">Community Insights</div>
//           <div className="page-subtitle">
//             {loading
//               ? "Loading…"
//               : `${(data?.totalApps ?? 0).toLocaleString()} applications tracked · ${data?.activeUsers ?? 0} active users this week`}
//           </div>
//         </div>
//       </div>

//       {/* ── Error banner ────────────────────────────────────────────────── */}
//       {error && (
//         <div style={{ padding: "12px 16px", background: "var(--red-dim)", border: "1px solid rgba(248,113,113,.25)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 13, marginBottom: 20 }}>
//           ⚠️ Could not load data: {error}
//         </div>
//       )}

//       {/* ── Placement Pulse ─────────────────────────────────────────────── */}
//       {!loading && data && <PlacementPulse data={data} />}

//       {/* ── Stat cards ──────────────────────────────────────────────────── */}
//       <div className="stats-grid" style={{ marginBottom: 24 }}>
//         {loading
//           ? Array.from({ length: 6 }).map((_, i) => (
//               <div key={i} className="stat-card">
//                 <Skeleton h={10} w={80} />
//                 <div style={{ marginTop: 10 }}><Skeleton h={32} w={60} /></div>
//                 <div style={{ marginTop: 6 }}><Skeleton h={9} w={100} /></div>
//               </div>
//             ))
//           : data && (
//             <>
//               <div className="stat-card">
//                 <div className="stat-label">Total Apps Tracked</div>
//                 <div className="stat-value stat-accent">{data.totalApps.toLocaleString()}</div>
//                 <div className="stat-sub">all time, all users</div>
//               </div>
//               <div className="stat-card">
//                 <div className="stat-label">Apps This Week</div>
//                 <div className="stat-value stat-green">{data.weeklyApps.toLocaleString()}</div>
//                 <div className="stat-sub">last 7 days</div>
//               </div>
//               <div className="stat-card">
//                 <div className="stat-label">Avg Callback Rate</div>
//                 <div className="stat-value stat-yellow">{data.callbackRate}%</div>
//                 <div className="stat-sub">interviews ÷ apps</div>
//               </div>
//               <div className="stat-card">
//                 <div className="stat-label">Avg Apps to Offer</div>
//                 <div className="stat-value">{data.avgAppsBeforeOffer}</div>
//                 <div className="stat-sub">among users with offers</div>
//               </div>
//               <div className="stat-card">
//                 <div className="stat-label">Avg Days to Offer</div>
//                 <div className="stat-value stat-accent">{data.avgDaysToOffer}</div>
//                 <div className="stat-sub">from first application</div>
//               </div>
//               <div className="stat-card">
//                 <div className="stat-label">Active This Week</div>
//                 <div className="stat-value stat-green">{data.activeUsers}</div>
//                 <div className="stat-sub">unique users applied</div>
//               </div>
//             </>
//           )}
//       </div>

//       {/* ── Tabs ────────────────────────────────────────────────────────── */}
//       <div className="toggle-group" style={{ marginBottom: 20 }}>
//         {tabs.map((t) => (
//           <button key={t.id} className={`toggle-btn${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>
//             {t.label}
//           </button>
//         ))}
//       </div>

//       {/* ════════════════════  OVERVIEW  ════════════════════════════════ */}
//       {activeTab === "overview" && (
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

//           {/* Status breakdown */}
//           <div className="card">
//             <div className="card-title">Status Breakdown</div>
//             {loading ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//                 {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={14} />)}
//               </div>
//             ) : data ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//                 {[
//                   { key: "Applied",   color: "var(--blue)",   label: "Applied"   },
//                   { key: "Interview", color: "var(--yellow)", label: "Interview" },
//                   { key: "Offer",     color: "var(--green)",  label: "Offer"     },
//                   { key: "Rejected",  color: "var(--red)",    label: "Rejected"  },
//                 ].map(({ key, color, label }) => {
//                   const count = data.statusMap[key] || 0;
//                   const pct = data.totalApps > 0 ? Math.round((count / data.totalApps) * 100) : 0;
//                   return (
//                     <div key={key}>
//                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
//                         <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
//                         <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{count} · {pct}%</span>
//                       </div>
//                       <ProgressBar value={count} max={data.totalApps} color={color} />
//                     </div>
//                   );
//                 })}
//               </div>
//             ) : null}
//           </div>

//           {/* Placement funnel */}
//           <div className="card">
//             <div className="card-title">Avg Placement Journey</div>
//             {loading ? (
//               <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//                 {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={38} />)}
//               </div>
//             ) : data?.totalApps < 5 ? (
//               <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "20px 0", textAlign: "center" }}>
//                 Need more community data to show reliable journey stats.
//               </div>
//             ) : (
//               <div style={{ display: "flex", flexDirection: "column" }}>
//                 {funnelSteps.map((step, i) => (
//                   <div key={step.label}>
//                     <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0" }}>
//                       <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{step.icon}</span>
//                       <div style={{ flex: 1 }}>
//                         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//                           <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{step.label}</span>
//                           <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: step.color }}>{step.value}</span>
//                         </div>
//                         <ProgressBar value={step.value} max={funnelSteps[0]?.value || 1} color={step.color} />
//                       </div>
//                     </div>
//                     {i < funnelSteps.length - 1 && (
//                       <div style={{ marginLeft: 34, width: 2, height: 5, background: "var(--border)", borderRadius: 2 }} />
//                     )}
//                   </div>
//                 ))}
//                 <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
//                   Avg time to offer: <strong style={{ color: "var(--text-secondary)" }}>{data?.avgDaysToOffer ?? "—"} days</strong>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Leaderboard — full width — now with real usernames */}
//           <div className="card" style={{ gridColumn: "span 2" }}>
//             <div className="card-title">Most Active Users This Week</div>
//             <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>
//               Ranked by total applications tracked on LeaderLab.
//             </div>
//             {loading ? (
//               <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
//                 {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={80} />)}
//               </div>
//             ) : data?.streakLeaders?.length > 0 ? (
//               <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 }}>
//                 {data.streakLeaders.map((u, i) => (
//                   <div key={u.clerkUserId || u.username || i} style={{
//                     padding: "14px 16px", background: "var(--bg)", position: "relative",
//                     border: `1px solid ${i === 0 ? "var(--accent-border)" : "var(--border)"}`,
//                     borderRadius: "var(--radius-sm)",
//                   }}>
//                     {i === 0 && (
//                       <span style={{ position: "absolute", top: 8, right: 10, fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>TOP</span>
//                     )}
//                     <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
//                       <div style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "var(--accent)" : "var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: i === 0 ? "#fff" : "var(--text-muted)", flexShrink: 0 }}>
//                         {u.username?.[0]?.toUpperCase() || "?"}
//                       </div>
//                       <div style={{ fontSize: 11, color: i === 0 ? "var(--accent)" : "var(--text-muted)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                         {u.username}
//                       </div>
//                     </div>
//                     <div style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: i === 0 ? "var(--accent)" : "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>
//                       {u.totalApps}
//                     </div>
//                     <div style={{ fontSize: 11, color: "var(--text-muted)" }}>applications</div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="empty-state" style={{ padding: "30px 0" }}>
//                 <div className="empty-state-icon">📊</div>
//                 <p>Not enough data yet</p>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ════════════════════  PLATFORMS  ═══════════════════════════════ */}
//       {activeTab === "platforms" && (
//         <div className="card">
//           <div className="card-title">Platform Performance</div>
//           {loading ? (
//             <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//               {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={16} />)}
//             </div>
//           ) : data?.platforms?.length > 0 ? (
//             <>
//               <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
//                 {[...data.platforms].sort((a, b) => b.apps - a.apps).map((p) => {
//                   const rateColor = p.callbackRate >= 10 ? "var(--green)" : p.callbackRate >= 6 ? "var(--accent)" : "var(--yellow)";
//                   return (
//                     <div key={p.name}>
//                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
//                         <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{p.name}</span>
//                         <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
//                           <span style={{ color: rateColor, fontWeight: 600, marginRight: 8 }}>{p.callbackRate}%</span>
//                           ({p.apps.toLocaleString()} apps)
//                         </span>
//                       </div>
//                       <ProgressBar value={p.callbackRate} max={20} color={rateColor} />
//                     </div>
//                   );
//                 })}
//               </div>
//               <div className="insight-box" style={{ marginTop: 20, marginBottom: 0 }}>
//                 <strong>Top platform right now:</strong>{" "}
//                 <strong style={{ color: "var(--accent)" }}>
//                   {[...data.platforms].sort((a, b) => b.callbackRate - a.callbackRate)[0]?.name}
//                 </strong>{" "}
//                 has the highest callback rate in your community.
//               </div>
//               {/* Ghosting card inside platforms tab */}
//               <div style={{ marginTop: 16 }}>
//                 <GhostingCard ghosting={data.ghosting} totalApps={data.totalApps} />
//               </div>
//             </>
//           ) : (
//             <div className="empty-state">
//               <div className="empty-state-icon">📭</div>
//               <h3>No platform data yet</h3>
//               <p>Users need to log which platform they applied through.</p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ════════════════════  ROLE HEATMAP  ════════════════════════════ */}
//       {activeTab === "roles" && (
//         <div className="card">
//           <div className="card-title">Most Applied Roles</div>
//           {loading ? (
//             <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//               {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h={16} />)}
//             </div>
//           ) : data?.roles?.length > 0 ? (
//             <>
//               <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
//                 {data.roles.map((r) => {
//                   const rateColor = r.callbackRate >= 10 ? "var(--green)" : r.callbackRate >= 6 ? "var(--accent)" : "var(--yellow)";
//                   return (
//                     <div key={r.role}>
//                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
//                         <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }} title={r.role}>
//                           {r.role}
//                         </span>
//                         <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>
//                           <span style={{ color: rateColor, fontWeight: 600, marginRight: 8 }}>{r.callbackRate}% CB</span>
//                           {r.apps} apps
//                         </span>
//                       </div>
//                       <ProgressBar value={r.volume} max={100} color={rateColor} />
//                     </div>
//                   );
//                 })}
//               </div>
//               <div style={{ marginTop: 14, fontSize: 11, color: "var(--text-muted)" }}>
//                 CB = callback rate · bar width = share of total applications
//               </div>
//             </>
//           ) : (
//             <div className="empty-state">
//               <div className="empty-state-icon">🗂️</div>
//               <h3>No role data yet</h3>
//               <p>More applications needed to show role trends.</p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ════════════════════  INSIGHTS  ════════════════════════════════ */}
//       {activeTab === "insights" && (
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
//           <GhostingCard ghosting={data?.ghosting} totalApps={data?.totalApps ?? 0} />
//           <RejectionCard rejectionStages={data?.rejectionStages} totalApps={data?.totalApps ?? 0} />
//           <div style={{ gridColumn: "span 2" }}>
//             <CommunityMood mood={data?.communityMood} totalApps={data?.totalApps ?? 0} />
//           </div>
//         </div>
//       )}
//     </>
//   );
// }


"use client";

import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

function ProgressBar({ value, color = "var(--accent)", max = 100 }) {
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar" style={{ width: `${Math.min((value / (max || 1)) * 100, 100)}%`, background: color }} />
    </div>
  );
}

function Skeleton({ h = 20, w = "100%" }) {
  return (
    <div style={{ height: h, width: w, borderRadius: 6, background: "var(--bg-hover)", animation: "pulse 1.4s ease-in-out infinite" }} />
  );
}

// ── Current user position banner ─────────────────────────────────────────────
function MyPositionBanner({ rank, percentileAhead, totalUsers, currentUserEntry }) {
  if (!rank || percentileAhead === null) return null;

  const getBandLabel = (pct) => {
    if (pct >= 80) return { text: "Top 20% of all users", color: "var(--green)" };
    if (pct >= 60) return { text: "Ahead of most users", color: "var(--accent)" };
    if (pct >= 40) return { text: "Right in the middle", color: "var(--yellow)" };
    if (pct >= 20) return { text: "Room to grow", color: "var(--yellow)" };
    return { text: "Just getting started", color: "var(--text-muted)" };
  };

  const band = getBandLabel(percentileAhead);

  return (
    <div style={{
      marginBottom: 16,
      padding: "14px 18px",
      borderRadius: "var(--radius)",
      background: "var(--accent-dim)",
      border: "1px solid var(--accent-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "var(--accent)", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontFamily: "'Syne', sans-serif", fontSize: 14,
          fontWeight: 800, color: "#050f0c", flexShrink: 0,
        }}>
          #{rank}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Syne', sans-serif" }}>
            Your position
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            You&apos;re ahead of{" "}
            <span style={{ color: band.color, fontWeight: 700 }}>{percentileAhead}% of users</span>
            {" "}· {band.text}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
            {currentUserEntry?.totalApps ?? 0}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.6px" }}>Apps</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "var(--green)", lineHeight: 1 }}>
            {currentUserEntry?.activeDays ?? 0}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.6px" }}>Active Days</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
            {totalUsers}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.6px" }}>Total Users</div>
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard with pagination ───────────────────────────────────────────────
function Leaderboard({ leaderboard, loading, currentUserRank }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil((leaderboard?.length || 0) / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageData = leaderboard?.slice(start, start + PAGE_SIZE) || [];

  // Jump to current user's page on load
  useEffect(() => {
    if (currentUserRank) {
      setPage(Math.ceil(currentUserRank / PAGE_SIZE));
    }
  }, [currentUserRank]);

  const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Leaderboard</div>
        {leaderboard?.length > 0 && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {leaderboard.length} users
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
        Ranked by total applications tracked
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={52} />)}
        </div>
      ) : pageData.length === 0 ? (
        <div className="empty-state" style={{ padding: "30px 0" }}>
          <p>No users yet</p>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr 80px 80px",
            gap: 8,
            padding: "0 12px 8px",
            borderBottom: "1px solid var(--border)",
          }}>
            {["Rank", "User", "Apps", "Active Days"].map((h) => (
              <div key={h} style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {pageData.map((u) => {
              const isMe = u.isCurrentUser;
              return (
                <div key={u.clerkUserId} style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 80px 80px",
                  gap: 8,
                  padding: "11px 12px",
                  borderBottom: "1px solid var(--border)",
                  background: isMe ? "var(--accent-dim)" : "transparent",
                  borderLeft: isMe ? "2px solid var(--accent)" : "2px solid transparent",
                  borderRadius: isMe ? 6 : 0,
                  transition: "background 0.1s",
                }}>
                  {/* Rank */}
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: MEDAL[u.rank] ? 16 : 13,
                    fontWeight: 700,
                    color: u.rank === 1 ? "var(--yellow)"
                      : u.rank === 2 ? "var(--text-secondary)"
                      : u.rank === 3 ? "var(--yellow)"
                      : "var(--text-muted)",
                    display: "flex", alignItems: "center",
                  }}>
                    {MEDAL[u.rank] || `#${u.rank}`}
                  </div>

                  {/* User */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isMe ? "var(--accent)" : u.rank <= 3 ? "var(--accent-dim)" : "var(--bg-hover)",
                      border: `1px solid ${isMe ? "var(--accent)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      color: isMe ? "#050f0c" : "var(--text-muted)",
                      flexShrink: 0,
                    }}>
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: isMe ? 700 : 500,
                        color: isMe ? "var(--accent)" : "var(--text-primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {u.username}{isMe && <span style={{ fontSize: 10, marginLeft: 6, color: "var(--accent)", opacity: 0.7 }}>you</span>}
                      </div>
                    </div>
                  </div>

                  {/* Apps */}
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14, fontWeight: 800,
                    color: isMe ? "var(--accent)" : "var(--text-primary)",
                    display: "flex", alignItems: "center",
                  }}>
                    {u.totalApps}
                  </div>

                  {/* Active Days */}
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14, fontWeight: 800,
                    color: "var(--green)",
                    display: "flex", alignItems: "center",
                  }}>
                    {u.activeDays}
                    <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 3, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>d</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: "5px 12px" }}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  const isActive = p === page;
                  // Show first, last, and pages around current
                  const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                  const showDots = !show && (p === 2 || p === totalPages - 1);
                  if (showDots) return <span key={p} style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 2px" }}>…</span>;
                  if (!show) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 28, height: 28, borderRadius: "var(--radius-sm)",
                        border: isActive ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                        background: isActive ? "var(--accent-dim)" : "transparent",
                        color: isActive ? "var(--accent)" : "var(--text-muted)",
                        fontSize: 12, fontWeight: isActive ? 700 : 400,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: "5px 12px" }}
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Placement Pulse Banner ────────────────────────────────────────────────────
function PlacementPulse({ data }) {
  if (!data) return null;
  const items = [
    { icon: "📤", label: "Apps tracked", value: data.totalApps.toLocaleString() },
    { icon: "📞", label: "Avg callback", value: `${data.callbackRate}%` },
    { icon: "🔥", label: "Trending role", value: data.trendingRole },
    { icon: "🏆", label: "Best platform", value: data.topPlatform },
    { icon: "⏱️", label: "Avg to offer", value: `${data.avgDaysToOffer}d` },
    { icon: "👥", label: "Active this week", value: data.activeUsers },
  ];
  return (
    <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: "var(--radius)", background: "linear-gradient(135deg, var(--accent-dim) 0%, var(--bg-card) 100%)", border: "1px solid var(--accent-border)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
        ◈ This Week's Placement Pulse
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "var(--bg-hover)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            <span>{item.icon}</span>
            <span style={{ color: "var(--text-muted)" }}>{item.label}:</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Community Mood ────────────────────────────────────────────────────────────
function CommunityMood({ mood, totalApps }) {
  if (!mood || totalApps < 10) return null;
  const items = [
    { pct: mood.ghostedPct, label: "got ghosted", color: "var(--red)", icon: "👻" },
    { pct: mood.interviewPct, label: "received interviews", color: "var(--yellow)", icon: "🎙️" },
    { pct: mood.offerPct, label: "received offers", color: "var(--green)", icon: "🎉" },
  ];
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-title">Community Reality Check</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>This week across all users.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.pct}% of users</span>
                <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.label}</span>
              </div>
              <ProgressBar value={item.pct} max={100} color={item.color} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Platform Performance ──────────────────────────────────────────────────────
function PlatformSection({ platforms }) {
  if (!platforms?.length) return null;
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-title">Platform Performance</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[...platforms].sort((a, b) => b.apps - a.apps).map((p) => {
          const rateColor = p.callbackRate >= 10 ? "var(--green)" : p.callbackRate >= 6 ? "var(--accent)" : "var(--yellow)";
          return (
            <div key={p.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  <span style={{ color: rateColor, fontWeight: 600, marginRight: 8 }}>{p.callbackRate}%</span>
                  ({p.apps} apps)
                </span>
              </div>
              <ProgressBar value={p.callbackRate} max={20} color={rateColor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Role Heatmap ──────────────────────────────────────────────────────────────
function RoleSection({ roles }) {
  if (!roles?.length) return null;
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-title">Most Applied Roles</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {roles.map((r) => {
          const rateColor = r.callbackRate >= 10 ? "var(--green)" : r.callbackRate >= 6 ? "var(--accent)" : "var(--yellow)";
          return (
            <div key={r.role}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{r.role}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>
                  <span style={{ color: rateColor, fontWeight: 600, marginRight: 8 }}>{r.callbackRate}% CB</span>
                  {r.apps} apps
                </span>
              </div>
              <ProgressBar value={r.volume} max={100} color={rateColor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Status Breakdown ──────────────────────────────────────────────────────────
function StatusSection({ statusMap, totalApps, loading }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-title">Status Breakdown</div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={14} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "Applied", color: "var(--blue)", label: "Applied" },
            { key: "Interview", color: "var(--yellow)", label: "Interview" },
            { key: "Offer", color: "var(--green)", label: "Offer" },
            { key: "Rejected", color: "var(--red)", label: "Rejected" },
          ].map(({ key, color, label }) => {
            const count = statusMap?.[key] || 0;
            const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{count} · {pct}%</span>
                </div>
                <ProgressBar value={count} max={totalApps} color={color} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/community/stats")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const currentUserEntry = data?.leaderboard?.find((u) => u.isCurrentUser);

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div className="topbar">
        <div>
          <div className="page-title">Community</div>
          <div className="page-subtitle">
            {loading
              ? "Loading…"
              : `${(data?.totalApps ?? 0).toLocaleString()} applications tracked · ${data?.activeUsers ?? 0} active this week`}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "var(--red-dim)", border: "1px solid rgba(248,113,113,.25)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 13, marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Pulse */}
      {!loading && data && <PlacementPulse data={data} />}

      {/* Stat cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card">
                <Skeleton h={10} w={80} />
                <div style={{ marginTop: 10 }}><Skeleton h={32} w={60} /></div>
                <div style={{ marginTop: 6 }}><Skeleton h={9} w={100} /></div>
              </div>
            ))
          : data && (
            <>
              <div className="stat-card">
                <div className="stat-label">Total Apps</div>
                <div className="stat-value stat-accent">{data.totalApps.toLocaleString()}</div>
                <div className="stat-sub">all time</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">This Week</div>
                <div className="stat-value stat-green">{data.weeklyApps.toLocaleString()}</div>
                <div className="stat-sub">last 7 days</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Callback Rate</div>
                <div className="stat-value stat-yellow">{data.callbackRate}%</div>
                <div className="stat-sub">community avg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg to Offer</div>
                <div className="stat-value">{data.avgDaysToOffer}d</div>
                <div className="stat-sub">from first app</div>
              </div>
            </>
          )}
      </div>

      {/* My position */}
      {!loading && data && (
        <MyPositionBanner
          rank={data.currentUserRank}
          percentileAhead={data.percentileAhead}
          totalUsers={data.totalUsers}
          currentUserEntry={currentUserEntry}
        />
      )}

      {/* Leaderboard — paginated */}
      <Leaderboard
        leaderboard={data?.leaderboard}
        loading={loading}
        currentUserRank={data?.currentUserRank}
      />

      {/* Rest of content — flat, no tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 0 }}>
        <StatusSection statusMap={data?.statusMap} totalApps={data?.totalApps} loading={loading} />
        <CommunityMood mood={data?.communityMood} totalApps={data?.totalApps ?? 0} />
      </div>

      <PlatformSection platforms={data?.platforms} />
      <RoleSection roles={data?.roles} />
    </>
  );
}