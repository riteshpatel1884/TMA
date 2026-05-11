"use client";

import { useMemo, useState } from "react";
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
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

// ── Kill ALL Recharts focus outlines & white backgrounds globally ─────────
const RECHARTS_RESET = `
  /* Nuclear option: remove every outline/bg from recharts tree */
  .recharts-wrapper,
  .recharts-wrapper *,
  .recharts-surface,
  .recharts-surface *,
  svg.recharts-surface,
  .recharts-layer,
  .recharts-layer *,
  .recharts-responsive-container,
  .recharts-responsive-container * {
    outline: none !important;
    -webkit-tap-highlight-color: transparent !important;
    -webkit-focus-ring-color: transparent !important;
  }
  .recharts-wrapper,
  .recharts-wrapper:focus,
  .recharts-wrapper:focus-within,
  .recharts-wrapper:focus-visible,
  .recharts-wrapper:active,
  .recharts-surface:focus,
  .recharts-surface:active,
  svg.recharts-surface:focus,
  svg.recharts-surface:active {
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  /* The inner <div> recharts wraps the SVG in */
  .recharts-wrapper > div {
    outline: none !important;
    background: transparent !important;
  }
  /* SVG itself and background rect */
  .recharts-surface,
  .recharts-surface > rect:first-child {
    fill: transparent !important;
    background: transparent !important;
  }
  /* Kill all interactive element focus rings */
  .recharts-sector:focus,
  .recharts-sector:focus-visible,
  .recharts-bar-rectangle:focus,
  .recharts-bar-rectangle:focus-visible,
  .recharts-curve:focus,
  .recharts-dot:focus,
  .recharts-dot:focus-visible,
  .recharts-symbols:focus {
    outline: none !important;
    stroke: none !important;
  }
  /* Kill the grey/white hover rectangle on bar charts */
  .recharts-rectangle.recharts-tooltip-cursor {
    fill: rgba(255,255,255,0.04) !important;
  }
  /* Pie sector active stroke (white ring on click) */
  .recharts-pie-sector path:focus,
  .recharts-pie-sector path:active {
    outline: none !important;
    stroke: none !important;
  }
`;

const MIN_DATA_THRESHOLD = 5;

function pct(num, denom) {
  if (!denom) return null;
  return ((num / denom) * 100).toFixed(1);
}

function fmtResponseDays(d) {
  if (d === null || d === undefined) return "—";
  if (d === 0) return "< 1 day";
  return `${d}d`;
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

// ── Shared tooltip style (dark, no white bg) ──────────────────────────────
const tooltipStyle = {
  background: "rgba(20,20,25,0.96)",
  border: "1px solid rgba(108,99,255,0.25)",
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

// Custom Tooltip renderer
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

// ── Shared chart card wrapper ─────────────────────────────────────────────
function ChartCard({ title, children, style }) {
  return (
    <div
      tabIndex={-1}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "20px",
        marginBottom: 16,
        outline: "none",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Metric cards ──────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color, lowData }) {
  return (
    <div className="stat-card" style={{ position: "relative" }}>
      <div className="stat-label">{label}</div>
      <div
        className="stat-value"
        style={{ color: color || "var(--text-primary)", fontSize: 28 }}
      >
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
      {lowData && (
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>
          Based on {lowData} application{lowData !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// ── Application Funnel ─────────────────────────────────────────────────────
function Funnel({ byStatus, total }) {
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
            <div key={step.key} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 90 }}>
              <div style={{ flex: 1 }}>
                {convRate !== null && (
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginBottom: 4 }}>
                    {convRate}% conv.
                  </div>
                )}
                <div
                  style={{
                    height: 48,
                    background: step.color,
                    opacity: 0.18 + (count / (total || 1)) * 0.7,
                    borderRadius: i === 0 ? "8px 0 0 8px" : i === steps.length - 1 ? "0 8px 8px 0" : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${step.color}`,
                    borderRight: i < steps.length - 1 ? "none" : undefined,
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{count}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 6 }}>
                  {step.label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 0, height: 0,
                  borderTop: "24px solid transparent",
                  borderBottom: "24px solid transparent",
                  borderLeft: `14px solid ${step.color}`,
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

// ── Insights box ──────────────────────────────────────────────────────────
function InsightsBox({ stats }) {
  const insights = useMemo(() => {
    const list = [];
    const best = stats.platformPerf[0];
    if (best && parseFloat(best.rate) > 0 && best.total >= 1)
      list.push(`${best.name} has your best response rate at ${best.rate}% — prioritise it.`);
    if (stats.byStatus.Offer === 0 && stats.total >= 3)
      list.push("No offers yet. Consider refining your resume or increasing application volume.");
    const workEntries = Object.entries(stats.byWorkType).sort((a, b) => b[1] - a[1]);
    if (workEntries.length > 0) {
      const [topType, topCount] = workEntries[0];
      const topPct = Math.round((topCount / stats.total) * 100);
      if (topPct >= 80) {
        const alt = topType === "Onsite" ? "Remote or Hybrid" : "Onsite";
        list.push(`${topPct}% of applications are ${topType} — consider exploring ${alt} roles.`);
      }
    }
    if (stats.avgResponseDays !== null && stats.avgResponseDays > 14)
      list.push(`Average response time is ${stats.avgResponseDays} days — follow up on older applications.`);
    const cbRate = parseFloat(stats.callbackRate);
    if (stats.total >= 5 && cbRate < 10)
      list.push(`Callback rate is ${stats.callbackRate}%. Tailoring your applications per role may improve this.`);
    if (list.length === 0)
      list.push("Add more applications to unlock personalised insights.");
    return list;
  }, [stats]);

  return (
    <div style={{
      background: "rgba(108,99,255,0.07)",
      border: "1px solid rgba(108,99,255,0.2)",
      borderRadius: "var(--radius)",
      padding: "16px 20px",
      marginBottom: 20,
    }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: "#6c63ff", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
        ✦ Insights
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {insights.map((text, i) => (
          <li key={i} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, paddingLeft: 14, borderLeft: "2px solid #6c63ff" }}>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── 1. Status Distribution — Donut ────────────────────────────────────────
const STATUS_COLORS = { Applied: "#3b82f6", Interview: "#f59e0b", Offer: "#22c55e", Rejected: "#ef4444" };

function StatusDonutChart({ byStatus }) {
  const data = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || "#6c63ff" }));

  if (!data.length) return null;

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    if (percent < 0.06) return null;
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard title="Status Distribution">
      <ResponsiveContainer width="100%" height={260} style={{ background: "transparent", outline: "none" }}>
        <PieChart style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <Pie isAnimationActive={false}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
            stroke="none"
            style={{ outline: "none", background: "transparent" }} tabIndex={-1}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} style={{ outline: "none", background: "transparent" }} tabIndex={-1} />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip formatter={(v) => `${v} applications`} />}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 2. Weekly Trend — Stacked Area ────────────────────────────────────────
function WeeklyTrendChart({ weeks }) {
  if (!weeks || weeks.length === 0) return null;
  const data = weeks.map(([key, d]) => ({
    week: new Date(key).toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
    applied: d.applied,
    interviews: d.interviews || 0,
    offers: d.offers || 0,
  }));

  return (
    <ChartCard title="Weekly Application Trend">
      <ResponsiveContainer width="100%" height={240} style={{ background: "transparent", outline: "none" }}>
        <AreaChart data={data} style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <defs>
            <linearGradient id="gApplied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gInterview" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gOffer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: "#555562", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#555562", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v}</span>} />
          <Area isAnimationActive={false} type="monotone" dataKey="applied" name="Applied" stroke="#3b82f6" strokeWidth={2} fill="url(#gApplied)" dot={false} />
          <Area isAnimationActive={false} type="monotone" dataKey="interviews" name="Interviews" stroke="#f59e0b" strokeWidth={2} fill="url(#gInterview)" dot={false} />
          <Area isAnimationActive={false} type="monotone" dataKey="offers" name="Offers" stroke="#22c55e" strokeWidth={2} fill="url(#gOffer)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 3. Platform Success Rate ──────────────────────────────────────────────
function PlatformChart({ platformPerf }) {
  if (!platformPerf || platformPerf.length === 0) return null;
  const data = platformPerf.map((p) => ({
    name: p.name,
    rate: parseFloat(p.rate),
    total: p.total,
  }));

  return (
    <ChartCard title="Platform Success Rate">
      <ResponsiveContainer width="100%" height={220} style={{ background: "transparent", outline: "none" }}>
        <BarChart data={data} layout="vertical" style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <defs>
            <linearGradient id="gPlatform" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6c63ff" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#555562", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#8b8b9a", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
          <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(1)}%`} />} />
          <Bar isAnimationActive={false} dataKey="rate" name="Success Rate" fill="url(#gPlatform)" radius={[0, 6, 6, 0]} barSize={16} style={{ outline: "none", background: "transparent" }} tabIndex={-1} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 4. Work Type Donut ────────────────────────────────────────────────────
const WORK_COLORS = ["#6c63ff", "#3b82f6", "#f59e0b", "#22c55e", "#ec4899"];

function WorkTypeChart({ byWorkType, total }) {
  if (!byWorkType || !Object.keys(byWorkType).length) return null;
  const data = Object.entries(byWorkType)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, fill: WORK_COLORS[i % WORK_COLORS.length] }));

  return (
    <ChartCard title="Work Type Split">
      <ResponsiveContainer width="100%" height={240} style={{ background: "transparent", outline: "none" }}>
        <PieChart style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <Pie isAnimationActive={false}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            style={{ outline: "none", background: "transparent" }} tabIndex={-1}
          >
            {data.map((e, i) => <Cell key={i} fill={e.fill} style={{ outline: "none", background: "transparent" }} tabIndex={-1} />)}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={(v) => `${v} (${pct(v, total)}%)`} />} />
          <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 5. Tags Bar ───────────────────────────────────────────────────────────
function TagsChart({ topTags, total }) {
  if (!topTags || topTags.length === 0) return null;
  const data = topTags.map(([tag, count]) => ({ name: tag, count, pct: Math.round((count / total) * 100) }));

  return (
    <ChartCard title="Top Application Tags">
      <ResponsiveContainer width="100%" height={220} style={{ background: "transparent", outline: "none" }}>
        <BarChart data={data} style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <defs>
            <linearGradient id="gTag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c63ff" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#8b8b9a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#555562", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip formatter={(v) => `${v} applications`} />} />
          <Bar isAnimationActive={false} dataKey="count" name="Count" fill="url(#gTag)" radius={[6, 6, 0, 0]} barSize={32} style={{ outline: "none", background: "transparent" }} tabIndex={-1} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 6. Conversion Line ────────────────────────────────────────────────────
function ConversionChart({ byStatus }) {
  const data = [
    { name: "Applied", value: byStatus.Applied || 0 },
    { name: "Interview", value: byStatus.Interview || 0 },
    { name: "Offer", value: byStatus.Offer || 0 },
  ];

  return (
    <ChartCard title="Conversion Funnel">
      <ResponsiveContainer width="100%" height={220} style={{ background: "transparent", outline: "none" }}>
        <LineChart data={data} style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <defs>
            <linearGradient id="gLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6c63ff" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="name" tick={{ fill: "#8b8b9a", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#555562", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip formatter={(v) => `${v} applications`} />} />
          <Line isAnimationActive={false}
            type="monotone"
            dataKey="value"
            name="Count"
            stroke="#6c63ff"
            strokeWidth={3}
            dot={{ fill: "#6c63ff", r: 6, strokeWidth: 0, style: { outline: "none" } }}
            activeDot={{ r: 8, fill: "#a5b4fc", strokeWidth: 0, style: { outline: "none" } }}
            style={{ outline: "none", background: "transparent" }} tabIndex={-1}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 7. NEW: Response Time Histogram ──────────────────────────────────────
function ResponseTimeCard({ avgResponseDays, fastestResponse, slowestResponse }) {
  if (avgResponseDays === null) return null;
  const data = [
    { name: "Fastest", days: fastestResponse ?? 0, fill: "#22c55e" },
    { name: "Average", days: avgResponseDays, fill: "#6c63ff" },
    { name: "Slowest", days: slowestResponse ?? 0, fill: "#ef4444" },
  ];

  return (
    <ChartCard title="Response Time (Days)">
      <ResponsiveContainer width="100%" height={180} style={{ background: "transparent", outline: "none" }}>
        <BarChart data={data} style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#8b8b9a", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#555562", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip formatter={(v) => `${v} day${v !== 1 ? "s" : ""}`} />} />
          <Bar isAnimationActive={false} dataKey="days" name="Days" radius={[6, 6, 0, 0]} barSize={40} style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
            {data.map((e, i) => <Cell key={i} fill={e.fill} style={{ outline: "none", background: "transparent" }} tabIndex={-1} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 8. NEW: Platform Volume vs Response Scatter ───────────────────────────
function PlatformScatterChart({ platformPerf }) {
  if (!platformPerf || platformPerf.length < 2) return null;
  const data = platformPerf.map((p) => ({
    x: p.total,
    y: parseFloat(p.rate),
    z: p.responses + 1,
    name: p.name,
  }));

  return (
    <ChartCard title="Platform: Volume vs Success Rate">
      <ResponsiveContainer width="100%" height={220} style={{ background: "transparent", outline: "none" }}>
        <ScatterChart style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis type="number" dataKey="x" name="Applications" tick={{ fill: "#555562", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Apps Sent", position: "insideBottom", offset: -4, fill: "#555562", fontSize: 10 }} />
          <YAxis type="number" dataKey="y" name="Success Rate" tick={{ fill: "#555562", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <ZAxis type="number" dataKey="z" range={[60, 300]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div style={tooltipStyle}>
                  <div style={tooltipLabelStyle}>{d?.name}</div>
                  <div style={{ color: "#8b8b9a", marginTop: 4 }}>Apps sent: <span style={{ color: "#f0f0f2" }}>{d?.x}</span></div>
                  <div style={{ color: "#8b8b9a" }}>Success rate: <span style={{ color: "#22c55e" }}>{d?.y}%</span></div>
                </div>
              );
            }}
          />
          <Scatter data={data} fill="#6c63ff" style={{ outline: "none", background: "transparent" }} tabIndex={-1} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 9. NEW: Effort Radar (multi-axis overview) ────────────────────────────
function EffortRadarChart({ stats }) {
  const total = stats.total || 1;
  const data = [
    { subject: "Volume", A: Math.min(100, total * 5) },
    { subject: "Callback", A: parseFloat(stats.callbackRate) || 0 },
    { subject: "Offer Rate", A: parseFloat(stats.offerRate) || 0 },
    { subject: "Platforms", A: Math.min(100, stats.platformPerf.length * 25) },
    { subject: "Work Types", A: Math.min(100, Object.keys(stats.byWorkType).length * 33) },
  ];

  return (
    <ChartCard title="Activity Overview (Radar)">
      <ResponsiveContainer width="100%" height={240} style={{ background: "transparent", outline: "none" }}>
        <RadarChart data={data} style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <defs>
            <linearGradient id="gRadar" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6c63ff" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#8b8b9a", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Score" dataKey="A" stroke="#6c63ff" fill="url(#gRadar)" fillOpacity={0.7} dot={{ fill: "#6c63ff", r: 4, strokeWidth: 0, style: { outline: "none" } }} style={{ outline: "none", background: "transparent" }} tabIndex={-1} />
          <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(0)} pts`} />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 10. NEW: Daily Velocity mini-bar ──────────────────────────────────────
function DailyVelocityChart({ weeks }) {
  if (!weeks || weeks.length < 2) return null;
  // Show all weeks as a simple volume bar
  const data = weeks.map(([key, d]) => ({
    week: new Date(key).toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
    total: d.applied + (d.interviews || 0) + (d.offers || 0),
  }));

  return (
    <ChartCard title="Weekly Activity Volume">
      <ResponsiveContainer width="100%" height={140} style={{ background: "transparent", outline: "none" }}>
        <BarChart data={data} style={{ outline: "none", background: "transparent" }} tabIndex={-1}>
          <defs>
            <linearGradient id="gVelocity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c63ff" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <XAxis dataKey="week" tick={{ fill: "#555562", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
          <Tooltip content={<CustomTooltip formatter={(v) => `${v} activities`} />} />
          <Bar isAnimationActive={false} dataKey="total" name="Total Activity" fill="url(#gVelocity)" radius={[4, 4, 0, 0]} barSize={24} style={{ outline: "none", background: "transparent" }} tabIndex={-1} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Main Analytics ────────────────────────────────────────────────────────
export default function Analytics({ applications }) {
  const [timeFilter, setTimeFilter] = useState("all");

  const filtered = useMemo(() => {
    if (timeFilter === "all") return applications;
    const cutoff = new Date();
    if (timeFilter === "7d") cutoff.setDate(cutoff.getDate() - 7);
    if (timeFilter === "30d") cutoff.setDate(cutoff.getDate() - 30);
    return applications.filter((a) => new Date(a.createdAt) >= cutoff);
  }, [applications, timeFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    if (total === 0) return null;

    const byStatus = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
    const byPlatform = {};
    const byWorkType = {};
    const weeklyData = {};
    const tagCounts = {};
    let totalResponseDays = 0, responseCount = 0;
    let fastestResponse = Infinity, slowestResponse = 0;

    filtered.forEach((app) => {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;

      if (app.platform) {
        if (!byPlatform[app.platform]) byPlatform[app.platform] = { total: 0, interviews: 0, offers: 0 };
        byPlatform[app.platform].total++;
        if (app.status === "Interview") byPlatform[app.platform].interviews++;
        if (app.status === "Offer") byPlatform[app.platform].offers++;
      }

      if (app.workType) byWorkType[app.workType] = (byWorkType[app.workType] || 0) + 1;

      if (app.dateApplied) {
        const week = getWeekKey(app.dateApplied);
        if (!weeklyData[week]) weeklyData[week] = { applied: 0, interviews: 0, offers: 0 };
        weeklyData[week].applied++;
        if (app.status === "Interview") weeklyData[week].interviews++;
        if (app.status === "Offer") weeklyData[week].offers++;
      }

      if (app.tags && Array.isArray(app.tags))
        app.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      if (app.workType) tagCounts[app.workType] = (tagCounts[app.workType] || 0) + 1;

      if (app.statusHistory && app.statusHistory.length > 1) {
        const first = new Date(app.statusHistory[0].date);
        const second = new Date(app.statusHistory[1].date);
        const days = Math.round((second - first) / (1000 * 60 * 60 * 24));
        if (days >= 0) {
          totalResponseDays += days;
          responseCount++;
          fastestResponse = Math.min(fastestResponse, days);
          slowestResponse = Math.max(slowestResponse, days);
        }
      }
    });

    const avgResponseDays = responseCount > 0 ? Math.round(totalResponseDays / responseCount) : null;
    const callbackRate = pct(byStatus.Interview + byStatus.Offer, total);
    const offerRate = pct(byStatus.Offer, total);
    const rejectionRate = pct(byStatus.Rejected, total);

    const platformPerf = Object.entries(byPlatform)
      .map(([name, d]) => ({
        name, total: d.total, responses: d.interviews + d.offers,
        rate: d.total > 0 ? pct(d.interviews + d.offers, d.total) : "0.0",
      }))
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));

    const weeks = Object.entries(weeklyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8);

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      total, byStatus, byPlatform, byWorkType, platformPerf, weeks,
      callbackRate, offerRate, rejectionRate,
      avgResponseDays,
      fastestResponse: fastestResponse === Infinity ? null : fastestResponse,
      slowestResponse: slowestResponse === 0 && responseCount === 0 ? null : slowestResponse,
      topTags,
      isLowData: total < MIN_DATA_THRESHOLD,
    };
  }, [filtered]);

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>—</div>
        <h3>No data to analyze</h3>
        <p>Add applications to see analytics</p>
      </div>
    );
  }

  return (
    <div>
      {/* Recharts global focus/bg reset */}
      <style dangerouslySetInnerHTML={{ __html: RECHARTS_RESET }} />
      {/* Time filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center" }}>
        {[
          { value: "7d", label: "Last 7 days" },
          { value: "30d", label: "Last 30 days" },
          { value: "all", label: "All time" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTimeFilter(opt.value)}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${timeFilter === opt.value ? "rgba(108,99,255,0.4)" : "var(--border)"}`,
              background: timeFilter === opt.value ? "rgba(108,99,255,0.12)" : "transparent",
              color: timeFilter === opt.value ? "#6c63ff" : "var(--text-muted)",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
              outline: "none",
            }}
          >
            {opt.label}
          </button>
        ))}
        {stats.isLowData && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
            {stats.total} application{stats.total !== 1 ? "s" : ""} — metrics may not be representative
          </span>
        )}
      </div>

      {/* Insights */}
      <InsightsBox stats={stats} />

      {/* KPI cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Callback Rate" value={stats.callbackRate !== null ? `${stats.callbackRate}%` : "—"} sub="Interview + Offer" color="#6c63ff" lowData={stats.isLowData ? stats.total : null} />
        <MetricCard label="Offer Rate" value={stats.offerRate !== null ? `${stats.offerRate}%` : "—"} sub="Of all applications" color="#22c55e" lowData={stats.isLowData ? stats.total : null} />
        <MetricCard label="Rejection Rate" value={stats.rejectionRate !== null ? `${stats.rejectionRate}%` : "—"} sub="Of all applications" color="#ef4444" lowData={stats.isLowData ? stats.total : null} />
        <MetricCard label="Total Applications" value={stats.total} sub="In selected period" color="#f59e0b" />
      </div>

      {/* Funnel */}
      <Funnel byStatus={stats.byStatus} total={stats.total} />

      {/* Row 1: Status Donut + Work Type Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 0 }}>
        <StatusDonutChart byStatus={stats.byStatus} />
        <WorkTypeChart byWorkType={stats.byWorkType} total={stats.total} />
      </div>

      {/* Radar */}
      <EffortRadarChart stats={stats} />

      {/* Weekly Trend */}
      <WeeklyTrendChart weeks={stats.weeks} />

      {/* Daily velocity */}
      <DailyVelocityChart weeks={stats.weeks} />

      {/* Row 2: Platform Bar + Scatter */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 0 }}>
        <PlatformChart platformPerf={stats.platformPerf} />
        <PlatformScatterChart platformPerf={stats.platformPerf} />
      </div>

      {/* Tags */}
      <TagsChart topTags={stats.topTags} total={stats.total} />

      {/* Conversion Line */}
      <ConversionChart byStatus={stats.byStatus} />

      {/* Response Time */}
      <ResponseTimeCard
        avgResponseDays={stats.avgResponseDays}
        fastestResponse={stats.fastestResponse}
        slowestResponse={stats.slowestResponse}
      />
    </div>
  );
}