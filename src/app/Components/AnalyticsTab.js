"use client";

import { useMemo, useState, useEffect } from "react";
import InsightsEngine from "./analytics/Insightsengine";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Recharts reset ────────────────────────────────────────────────────────
const RECHARTS_RESET = `
  .recharts-wrapper,.recharts-wrapper *,.recharts-surface,.recharts-surface *,
  svg.recharts-surface,.recharts-layer,.recharts-layer *,
  .recharts-responsive-container,.recharts-responsive-container * {
    outline: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  .recharts-wrapper,.recharts-wrapper:focus,.recharts-wrapper:focus-within,
  .recharts-surface:focus,svg.recharts-surface:focus {
    outline: none !important; box-shadow: none !important; background: transparent !important;
  }
  .recharts-wrapper > div { outline: none !important; background: transparent !important; }
  .recharts-surface,.recharts-surface > rect:first-child { fill: transparent !important; background: transparent !important; }
  .recharts-sector:focus,.recharts-bar-rectangle:focus,.recharts-curve:focus,.recharts-dot:focus { outline: none !important; stroke: none !important; }
  .recharts-rectangle.recharts-tooltip-cursor { fill: rgba(255,255,255,0.04) !important; }
  .recharts-pie-sector path:focus,.recharts-pie-sector path:active { outline: none !important; stroke: none !important; }
`;

const THRESHOLDS = {
  PLATFORM_CHART: 3,
  DONUT_CHART: 5,
  WEEKLY_CHART: 3,
  GHOST_RATE: 5,
  ROLE_INSIGHTS: 5,
  CONSISTENCY: 7,
  HEALTH_SCORE: 3,
};

const STATUS_COLORS = {
  Applied: "#3b82f6",
  Interview: "#f59e0b",
  Offer: "#22c55e",
  Rejected: "#ef4444",
};

// ── Mobile detection hook ─────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function pct(num, denom) {
  if (!denom) return null;
  return ((num / denom) * 100).toFixed(1);
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

const tooltipStyle = {
  background: "rgba(14,14,18,0.97)",
  border: "1px solid rgba(108,99,255,0.2)",
  borderRadius: 10,
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  padding: "10px 14px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  color: "#f0f0f2",
  outline: "none",
};

const tooltipLabelStyle = {
  color: "#f0f0f2",
  fontWeight: 700,
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  marginBottom: 4,
};

function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={tooltipStyle}>
      {label && <div style={tooltipLabelStyle}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#a5b4fc", marginTop: 2 }}>
          <span style={{ color: "#8b8b9a", marginRight: 6 }}>{p.name}:</span>
          {formatter ? formatter(p.value, p.name) : p.value}
        </div>
      ))}
    </div>
  );
}

// ── Locked Card ───────────────────────────────────────────────────────────
function LockedCard({ title, unlockAt, current, icon = "🔒" }) {
  const remaining = Math.max(0, unlockAt - current);
  const progress = Math.min(100, (current / unlockAt) * 100);
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "24px 20px",
      marginBottom: 16,
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "radial-gradient(circle, #6c63ff 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
        Apply to <strong style={{ color: "#6c63ff" }}>{remaining} more</strong> job{remaining !== 1 ? "s" : ""} to unlock.
      </div>
      <div style={{ height: 4, background: "rgba(108,99,255,0.12)", borderRadius: 99, overflow: "hidden", maxWidth: 200, margin: "0 auto" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #6c63ff, #22c55e)", borderRadius: 99, transition: "width 0.5s" }} />
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>{current} / {unlockAt} applications</div>
    </div>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────
function ChartCard({ title, children, badge, style }) {
  return (
    <div tabIndex={-1} style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "20px",
      marginBottom: 16,
      outline: "none",
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
          color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px",
        }}>{title}</div>
        {badge && (
          <div style={{
            fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
            background: "rgba(108,99,255,0.12)", color: "#6c63ff",
            fontFamily: "'DM Sans', sans-serif",
          }}>{badge}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, color, muted }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: muted ? "var(--text-muted)" : (color || "var(--text-primary)"), fontSize: 28 }}>
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ── Health Score ──────────────────────────────────────────────────────────
function HealthScore({ stats }) {
  const isMobile = useIsMobile();
  if (stats.total < THRESHOLDS.HEALTH_SCORE) {
    return <LockedCard title="Placement Health Score" unlockAt={THRESHOLDS.HEALTH_SCORE} current={stats.total} icon="❤️" />;
  }

  const volumeScore = Math.min(100, stats.total * 4);
  const callbackScore = Math.min(100, parseFloat(stats.callbackRate) * 3);
  const consistencyScore = stats.consistencyScore;
  const ghostPenalty = Math.max(0, 100 - stats.ghostRate);
  const offerScore = Math.min(100, parseFloat(stats.offerRate) * 10);

  const raw = volumeScore * 0.2 + callbackScore * 0.25 + consistencyScore * 0.2 + ghostPenalty * 0.2 + offerScore * 0.15;
  const score = Math.round(Math.min(99, Math.max(1, raw)));

  const getGrade = (s) => {
    if (s >= 80) return { label: "Excellent", color: "#22c55e" };
    if (s >= 60) return { label: "Good", color: "#6c63ff" };
    if (s >= 40) return { label: "Fair", color: "#f59e0b" };
    return { label: "Needs Work", color: "#ef4444" };
  };
  const grade = getGrade(score);

  const components = [
    { label: "Volume", value: Math.round(volumeScore) },
    { label: "Callback Rate", value: Math.round(callbackScore) },
    { label: "Consistency", value: Math.round(consistencyScore) },
    { label: "Response Rate", value: Math.round(ghostPenalty) },
    { label: "Offer Conv.", value: Math.round(offerScore) },
  ];

  const R = 44, C = 2 * Math.PI * R;
  const filled = (score / 100) * C;
  const ringSize = isMobile ? 100 : 130;
  const cx = ringSize / 2;

  return (
    <ChartCard title="Placement Health Score" badge={grade.label}>
      <div style={{ display: "flex", gap: isMobile ? 16 : 24, alignItems: "center", flexWrap: isMobile ? "nowrap" : "wrap" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(108,99,255,0.1)" strokeWidth={8} />
            <circle cx={cx} cy={cx} r={R} fill="none" stroke={grade.color} strokeWidth={8}
              strokeDasharray={`${filled} ${C}`} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cx})`}
              style={{ transition: "stroke-dasharray 0.8s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: grade.color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>/ 100</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {components.map((c) => (
            <div key={c.label} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: isMobile ? 10 : 11, color: "var(--text-secondary)" }}>{c.label}</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.value}/100</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${c.value}%`,
                  background: c.value >= 70 ? "#22c55e" : c.value >= 40 ? "#6c63ff" : "#ef4444",
                  borderRadius: 99, transition: "width 0.6s",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// ── Ghost Rate ────────────────────────────────────────────────────────────
function GhostRateCard({ stats }) {
  if (stats.total < THRESHOLDS.GHOST_RATE) {
    return <LockedCard title="Ghost Rate" unlockAt={THRESHOLDS.GHOST_RATE} current={stats.total} icon="👻" />;
  }

  const { ghostCount, ghostRate, total } = stats;
  const isHigh = ghostRate > 50;

  return (
    <ChartCard title="Ghost Rate" badge={isHigh ? "High" : "Normal"}>
      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: isHigh ? "#ef4444" : "#f59e0b", fontFamily: "'Syne', sans-serif" }}>
            {ghostRate.toFixed(0)}<span style={{ fontSize: 22 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>no response</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, borderLeft: `2px solid ${isHigh ? "#ef4444" : "#f59e0b"}`, paddingLeft: 12 }}>
            <strong style={{ color: "var(--text-primary)" }}>{ghostCount} of {total}</strong> applications received no response after 14 days.
            {isHigh ? " Try personalising your outreach or targeting roles with higher match." : " Within normal range — keep applying consistently."}
          </div>
          <div style={{ marginTop: 12, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${ghostRate}%`, background: isHigh ? "#ef4444" : "#f59e0b", borderRadius: 99, transition: "width 0.6s" }} />
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

// ── Consistency ───────────────────────────────────────────────────────────
function ConsistencyCard({ stats }) {
  const isMobile = useIsMobile();
  if (stats.total < THRESHOLDS.CONSISTENCY) {
    return <LockedCard title="Application Consistency" unlockAt={THRESHOLDS.CONSISTENCY} current={stats.total} icon="📅" />;
  }

  const { weeksActive, weeksTotal, maxGapDays, avgPerActiveWeek, consistencyScore } = stats.consistencyData;
  const isConsistent = consistencyScore >= 60;

  return (
    <ChartCard title="Application Consistency">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { label: "Active Weeks", value: `${weeksActive}/${weeksTotal}`, color: "#6c63ff" },
          { label: "Avg / Week", value: avgPerActiveWeek.toFixed(1), color: "#3b82f6" },
          { label: "Longest Gap", value: maxGapDays > 0 ? `${maxGapDays}d` : "—", color: maxGapDays > 10 ? "#ef4444" : "#22c55e" },
        ].map((m) => (
          <div key={m.label} style={{
            flex: 1, minWidth: isMobile ? 70 : 80,
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "10px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: m.color, fontFamily: "'Syne', sans-serif" }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
      {maxGapDays > 10 && (
        <div style={{ fontSize: 12, color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 12px" }}>
          ⚠ You had a {maxGapDays}-day gap. Consistent daily effort leads to better outcomes.
        </div>
      )}
      {isConsistent && (
        <div style={{ fontSize: 12, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "8px 12px" }}>
          ✓ Strong consistency — you're applying regularly across weeks.
        </div>
      )}
    </ChartCard>
  );
}

// ── Resume Performance ────────────────────────────────────────────────────
function ResumePerformanceCard({ stats }) {
  const { resumePerf } = stats;
  if (!resumePerf || resumePerf.length < 2) {
    return (
      <ChartCard title="Resume Performance">
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Use multiple resume versions to compare performance.</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Tag applications with a resume version to unlock this.</div>
        </div>
      </ChartCard>
    );
  }

  const best = resumePerf.reduce((a, b) => parseFloat(a.rate) > parseFloat(b.rate) ? a : b);
  return (
    <ChartCard title="Resume Performance">
      {resumePerf.map((r) => (
        <div key={r.name} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{r.name}</span>
              {r.name === best.name && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>BEST</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.total} apps</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: parseFloat(r.rate) > 15 ? "#22c55e" : "var(--text-primary)" }}>{r.rate}%</span>
            </div>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${Math.min(100, parseFloat(r.rate) * 3)}%`,
              background: r.name === best.name ? "linear-gradient(90deg, #22c55e, #6c63ff)" : "linear-gradient(90deg, #6c63ff, #3b82f6)",
              borderRadius: 99, transition: "width 0.6s",
            }} />
          </div>
        </div>
      ))}
    </ChartCard>
  );
}

// ── Role Insights ─────────────────────────────────────────────────────────
function RoleInsightsCard({ stats }) {
  if (stats.total < THRESHOLDS.ROLE_INSIGHTS) {
    return <LockedCard title="Role Insights" unlockAt={THRESHOLDS.ROLE_INSIGHTS} current={stats.total} icon="🎯" />;
  }
  const { rolePerf } = stats;
  if (!rolePerf || rolePerf.length < 2) {
    return (
      <ChartCard title="Role Insights">
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
          Apply to more distinct roles to see performance comparisons.
        </div>
      </ChartCard>
    );
  }
  const best = rolePerf[0];
  const worst = rolePerf[rolePerf.length - 1];
  return (
    <ChartCard title="Role Insights">
      {best && parseFloat(best.rate) > 0 && worst && best.name !== worst.name && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, borderLeft: "2px solid #6c63ff", paddingLeft: 12, marginBottom: 16 }}>
          <strong style={{ color: "var(--text-primary)" }}>{best.name}</strong> roles perform{" "}
          <strong style={{ color: "#22c55e" }}>
            {parseFloat(worst.rate) > 0 ? `${(parseFloat(best.rate) / parseFloat(worst.rate)).toFixed(1)}x` : "significantly"} better
          </strong>{" "}than <strong style={{ color: "var(--text-primary)" }}>{worst.name}</strong>.
        </div>
      )}
      {rolePerf.map((r) => (
        <div key={r.name} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: parseFloat(r.rate) > 20 ? "#22c55e" : "var(--text-primary)" }}>
              {r.rate}% <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 11 }}>({r.total})</span>
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, parseFloat(r.rate) * 3)}%`, background: r === best ? "#22c55e" : "#6c63ff", borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </ChartCard>
  );
}

// ── Funnel ────────────────────────────────────────────────────────────────
function Funnel({ byStatus, total }) {
  const isMobile = useIsMobile();
  const steps = [
    { label: "Applied", key: "Applied", color: "#3b82f6" },
    { label: "Interview", key: "Interview", color: "#f59e0b" },
    { label: "Offer", key: "Offer", color: "#22c55e" },
  ];
  return (
    <ChartCard title="Application Funnel">
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
        {steps.map((step, i) => {
          const count = byStatus[step.key] || 0;
          const prevCount = i === 0 ? total : byStatus[steps[i - 1].key] || 0;
          const convRate = i > 0 && prevCount > 0 ? pct(count, prevCount) : null;
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: isMobile ? 70 : 90 }}>
              <div style={{ flex: 1 }}>
                {convRate !== null && (
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginBottom: 4 }}>{convRate}% conv.</div>
                )}
                <div style={{
                  height: isMobile ? 44 : 52,
                  background: step.color,
                  opacity: 0.18 + (count / (total || 1)) * 0.72,
                  borderRadius: i === 0 ? "8px 0 0 8px" : i === steps.length - 1 ? "0 8px 8px 0" : 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${step.color}`,
                  borderRight: i < steps.length - 1 ? "none" : undefined,
                }}>
                  <span style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#fff" }}>{count}</span>
                </div>
                <div style={{ fontSize: isMobile ? 10 : 11, color: "var(--text-muted)", textAlign: "center", marginTop: 6 }}>{step.label}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 0, height: 0,
                  borderTop: `${isMobile ? 22 : 26}px solid transparent`,
                  borderBottom: `${isMobile ? 22 : 26}px solid transparent`,
                  borderLeft: `${isMobile ? 10 : 14}px solid ${step.color}`,
                  opacity: 0.45, flexShrink: 0, zIndex: 1,
                }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
        Rejected: {byStatus.Rejected || 0}
      </div>
    </ChartCard>
  );
}

// ── Status Donut ──────────────────────────────────────────────────────────
function StatusDonutChart({ byStatus, total }) {
  const isMobile = useIsMobile();
  if (total < THRESHOLDS.DONUT_CHART) {
    return <LockedCard title="Status Distribution" unlockAt={THRESHOLDS.DONUT_CHART} current={total} icon="🥧" />;
  }

  const data = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || "#6c63ff" }));

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    if (percent < 0.08) return null;
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const chartHeight = isMobile ? 180 : 220;
  const outerR = isMobile ? 70 : 90;
  const innerR = isMobile ? 42 : 58;

  return (
    <ChartCard title="Status Distribution" style={{ flex: 1, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={chartHeight} style={{ background: "transparent", outline: "none" }}>
        <PieChart style={{ outline: "none" }} tabIndex={-1}>
          <Pie isAnimationActive={false} data={data} cx="50%" cy="50%"
            innerRadius={innerR} outerRadius={outerR}
            paddingAngle={3} dataKey="value" labelLine={false} label={renderLabel} stroke="none" tabIndex={-1}>
            {data.map((e, i) => <Cell key={i} fill={e.fill} tabIndex={-1} />)}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={(v) => `${v} apps`} />} />
          <Legend iconType="circle" iconSize={7}
            formatter={(v) => <span style={{ fontSize: isMobile ? 10 : 12, color: "var(--text-secondary)" }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Work Type Donut ───────────────────────────────────────────────────────
const WORK_COLORS = ["#6c63ff", "#3b82f6", "#f59e0b", "#22c55e", "#ec4899"];

function WorkTypeChart({ byWorkType, total }) {
  const isMobile = useIsMobile();
  if (total < THRESHOLDS.DONUT_CHART) {
    return <LockedCard title="Work Type Split" unlockAt={THRESHOLDS.DONUT_CHART} current={total} icon="🏢" />;
  }

  const data = Object.entries(byWorkType)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, fill: WORK_COLORS[i % WORK_COLORS.length] }));

  const chartHeight = isMobile ? 180 : 220;
  const outerR = isMobile ? 70 : 85;
  const innerR = isMobile ? 38 : 50;

  return (
    <ChartCard title="Work Type Split" style={{ flex: 1, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={chartHeight} style={{ background: "transparent", outline: "none" }}>
        <PieChart style={{ outline: "none" }} tabIndex={-1}>
          <Pie isAnimationActive={false} data={data} cx="50%" cy="50%"
            innerRadius={innerR} outerRadius={outerR}
            paddingAngle={4} dataKey="value" stroke="none" tabIndex={-1}>
            {data.map((e, i) => <Cell key={i} fill={e.fill} tabIndex={-1} />)}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={(v) => `${v} (${pct(v, total)}%)`} />} />
          <Legend iconType="circle" iconSize={7}
            formatter={(v) => <span style={{ fontSize: isMobile ? 10 : 12, color: "var(--text-secondary)" }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Platform Bar ──────────────────────────────────────────────────────────
function PlatformChart({ platformPerf, total }) {
  const isMobile = useIsMobile();
  if (total < THRESHOLDS.PLATFORM_CHART || !platformPerf || platformPerf.length === 0) {
    return <LockedCard title="Platform Success Rate" unlockAt={THRESHOLDS.PLATFORM_CHART} current={total} icon="📊" />;
  }

  const data = platformPerf.map((p) => ({ name: p.name, rate: parseFloat(p.rate), total: p.total }));
  const yWidth = isMobile ? 80 : 100;

  return (
    <ChartCard title="Platform Success Rate">
      <ResponsiveContainer width="100%" height={Math.max(140, data.length * 40)} style={{ background: "transparent", outline: "none" }}>
        <BarChart data={data} layout="vertical" style={{ outline: "none" }} tabIndex={-1}>
          <defs>
            <linearGradient id="gPlatform" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6c63ff" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#555562", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#8b8b9a", fontSize: isMobile ? 10 : 12 }} axisLine={false} tickLine={false} width={yWidth} />
          <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
          <Bar isAnimationActive={false} dataKey="rate" name="Success Rate" fill="url(#gPlatform)" radius={[0, 6, 6, 0]} barSize={16} tabIndex={-1} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Weekly Trend ──────────────────────────────────────────────────────────
function WeeklyTrendChart({ weeks, total }) {
  const isMobile = useIsMobile();
  if (total < THRESHOLDS.WEEKLY_CHART || !weeks || weeks.length === 0) {
    return <LockedCard title="Weekly Application Trend" unlockAt={THRESHOLDS.WEEKLY_CHART} current={total} icon="📈" />;
  }

  const data = weeks.map(([key, d]) => ({
    week: new Date(key).toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
    applied: d.applied,
    interviews: d.interviews || 0,
  }));

  return (
    <ChartCard title="Weekly Application Trend">
      <ResponsiveContainer width="100%" height={isMobile ? 180 : 220} style={{ background: "transparent", outline: "none" }}>
        <AreaChart data={data} style={{ outline: "none" }} tabIndex={-1} margin={{ left: -10, right: 8 }}>
          <defs>
            <linearGradient id="gApplied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gInterview" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: "#555562", fontSize: isMobile ? 9 : 11 }} axisLine={false} tickLine={false}
            interval={isMobile ? 1 : 0} />
          <YAxis tick={{ fill: "#555562", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={7}
            formatter={(v) => <span style={{ fontSize: isMobile ? 10 : 11, color: "var(--text-secondary)" }}>{v}</span>} />
          <Area isAnimationActive={false} type="monotone" dataKey="applied" name="Applied" stroke="#3b82f6" strokeWidth={2} fill="url(#gApplied)" dot={false} />
          <Area isAnimationActive={false} type="monotone" dataKey="interviews" name="Interviews" stroke="#f59e0b" strokeWidth={2} fill="url(#gInterview)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── computeStats ──────────────────────────────────────────────────────────
function computeStats(filtered) {
  const total = filtered.length;
  if (total === 0) return null;

  const byStatus = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
  const byPlatform = {};
  const byWorkType = {};
  const weeklyData = {};
  const resumeData = {};
  const roleData = {};

  let totalResponseDays = 0, responseCount = 0;
  const now = new Date();

  filtered.forEach((app) => {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;

    if (app.platform) {
      if (!byPlatform[app.platform]) byPlatform[app.platform] = { total: 0, interviews: 0, offers: 0 };
      byPlatform[app.platform].total++;
      if (app.status === "Interview") byPlatform[app.platform].interviews++;
      if (app.status === "Offer") byPlatform[app.platform].offers++;
    }

    if (app.workType) byWorkType[app.workType] = (byWorkType[app.workType] || 0) + 1;

    const dateForWeek = app.dateApplied || app.createdAt;
    if (dateForWeek) {
      const week = getWeekKey(dateForWeek);
      if (!weeklyData[week]) weeklyData[week] = { applied: 0, interviews: 0, offers: 0 };
      weeklyData[week].applied++;
      if (app.status === "Interview") weeklyData[week].interviews++;
      if (app.status === "Offer") weeklyData[week].offers++;
    }

    if (app.resumeVersion) {
      if (!resumeData[app.resumeVersion]) resumeData[app.resumeVersion] = { total: 0, callbacks: 0 };
      resumeData[app.resumeVersion].total++;
      if (app.status === "Interview" || app.status === "Offer") resumeData[app.resumeVersion].callbacks++;
    }

    if (app.role) {
      const r = app.role.toLowerCase();
      const roleKey = r.includes("backend") ? "Backend"
        : r.includes("frontend") ? "Frontend"
        : r.includes("full") ? "Fullstack"
        : r.includes("data") ? "Data"
        : r.includes("ml") || r.includes("ai") ? "ML/AI"
        : "Other";
      if (!roleData[roleKey]) roleData[roleKey] = { total: 0, callbacks: 0 };
      roleData[roleKey].total++;
      if (app.status === "Interview" || app.status === "Offer") roleData[roleKey].callbacks++;
    }

    if (app.statusHistory && app.statusHistory.length > 1) {
      const first = new Date(app.statusHistory[0].date);
      const second = new Date(app.statusHistory[1].date);
      const days = Math.round((second - first) / (1000 * 60 * 60 * 24));
      if (days >= 0) { totalResponseDays += days; responseCount++; }
    }
  });

  const ghostCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const ghostCount = filtered.filter((a) => {
    if (a.status !== "Applied") return false;
    return new Date(a.dateApplied || a.createdAt) < ghostCutoff;
  }).length;
  const ghostRate = total > 0 ? (ghostCount / total) * 100 : 0;

  const platformPerf = Object.entries(byPlatform)
    .map(([name, d]) => ({
      name, total: d.total, responses: d.interviews + d.offers,
      rate: d.total > 0 ? pct(d.interviews + d.offers, d.total) : "0.0",
    }))
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));

  const resumePerf = Object.entries(resumeData)
    .map(([name, d]) => ({ name, total: d.total, rate: d.total > 0 ? pct(d.callbacks, d.total) : "0.0" }))
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));

  const rolePerf = Object.entries(roleData)
    .filter(([, d]) => d.total >= 2)
    .map(([name, d]) => ({ name, total: d.total, rate: d.total > 0 ? pct(d.callbacks, d.total) : "0.0" }))
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));

  const weeks = Object.entries(weeklyData).sort((a, b) => a[0].localeCompare(b[0]));
  const weeksTotal = weeks.length;
  const weeksActive = weeks.filter(([, d]) => d.applied > 0).length;
  const avgPerActiveWeek = weeksActive > 0 ? filtered.length / weeksActive : 0;

  let maxGapDays = 0;
  const activeDates = filtered
    .map((a) => new Date(a.dateApplied || a.createdAt))
    .filter(Boolean)
    .sort((a, b) => a - b);
  for (let i = 1; i < activeDates.length; i++) {
    const gap = Math.round((activeDates[i] - activeDates[i - 1]) / (1000 * 60 * 60 * 24));
    if (gap > maxGapDays) maxGapDays = gap;
  }

  const consistencyScore = weeksTotal > 0
    ? Math.round((weeksActive / weeksTotal) * 100 * (1 - Math.min(1, maxGapDays / 30)))
    : 0;

  return {
    total,
    byStatus,
    byWorkType,
    platformPerf,
    resumePerf,
    rolePerf,
    weeks: weeks.slice(-8),
    callbackRate: pct(byStatus.Interview + byStatus.Offer, total) ?? "0.0",
    offerRate: pct(byStatus.Offer, total) ?? "0.0",
    rejectionRate: pct(byStatus.Rejected, total) ?? "0.0",
    ghostCount,
    ghostRate,
    avgResponseDays: responseCount > 0 ? Math.round(totalResponseDays / responseCount) : null,
    consistencyScore,
    consistencyData: { weeksActive, weeksTotal, maxGapDays, avgPerActiveWeek },
    responseByCompanyType: [],
  };
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Analytics({ applications }) {
  const [timeFilter, setTimeFilter] = useState("all");
  const isMobile = useIsMobile();

  const filtered = useMemo(() => {
    if (timeFilter === "all") return applications;
    const cutoff = new Date();
    if (timeFilter === "7d") cutoff.setDate(cutoff.getDate() - 7);
    if (timeFilter === "30d") cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setHours(0, 0, 0, 0);
    // ✅ Fixed: check both dateApplied AND createdAt, prefer dateApplied
    return applications.filter((a) => {
      const date = a.dateApplied ? new Date(a.dateApplied) : new Date(a.createdAt);
      return date >= cutoff;
    });
  }, [applications, timeFilter]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);

  if (!stats) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>📭</div>
        <h3>No data to analyze</h3>
        <p>
          {timeFilter !== "all"
            ? `No applications in the last ${timeFilter === "7d" ? "7 days" : "30 days"}. Try "All time".`
            : "Add your first application to start tracking."}
        </p>
        {timeFilter !== "all" && (
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => setTimeFilter("all")}>
            View All Time
          </button>
        )}
      </div>
    );
  }

  // Donut charts: stacked on mobile, side-by-side on desktop
  const donutSection = isMobile ? (
    <>
      <StatusDonutChart byStatus={stats.byStatus} total={stats.total} />
      <WorkTypeChart byWorkType={stats.byWorkType} total={stats.total} />
    </>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <StatusDonutChart byStatus={stats.byStatus} total={stats.total} />
      <WorkTypeChart byWorkType={stats.byWorkType} total={stats.total} />
    </div>
  );

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: RECHARTS_RESET }} />

      {/* Time filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { value: "7d", label: "Last 7d" },
          { value: "30d", label: "Last 30d" },
          { value: "all", label: "All time" },
        ].map((opt) => (
          <button key={opt.value} onClick={() => setTimeFilter(opt.value)} style={{
            padding: isMobile ? "5px 10px" : "6px 14px",
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${timeFilter === opt.value ? "rgba(108,99,255,0.4)" : "var(--border)"}`,
            background: timeFilter === opt.value ? "rgba(108,99,255,0.12)" : "transparent",
            color: timeFilter === opt.value ? "#6c63ff" : "var(--text-muted)",
            fontSize: isMobile ? 11 : 12, fontWeight: 500, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", outline: "none",
          }}>
            {opt.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
          {stats.total} app{stats.total !== 1 ? "s" : ""}
        </span>
      </div>

      <HealthScore stats={stats} />

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Callback Rate" value={`${stats.callbackRate}%`} sub="Interview + Offer" color="#6c63ff" />
        <MetricCard label="Offer Rate" value={`${stats.offerRate}%`} sub="Of all applications" color="#22c55e" />
        <MetricCard label="Ghost Rate" value={`${stats.ghostRate.toFixed(0)}%`} sub="No reply 14d+" color={stats.ghostRate > 50 ? "#ef4444" : "#f59e0b"} />
        <MetricCard label="Total Applied" value={stats.total} sub="In selected period" color="#3b82f6" />
      </div>

      <GhostRateCard stats={stats} />
      <Funnel byStatus={stats.byStatus} total={stats.total} />
      <ConsistencyCard stats={stats} />

      {donutSection}

      <WeeklyTrendChart weeks={stats.weeks} total={stats.total} />
      <PlatformChart platformPerf={stats.platformPerf} total={stats.total} />
      <ResumePerformanceCard stats={stats} />
      <RoleInsightsCard stats={stats} />

      <InsightsEngine applications={applications} />
    </div>
  );
}