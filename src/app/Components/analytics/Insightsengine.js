"use client";

import { useState, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Data Preprocessor — distils raw applications into a rich stats object
// that gets sent to Claude. No raw PII (company names stripped to categories).
// ─────────────────────────────────────────────────────────────────────────────
function buildAnalyticsPayload(applications) {
  if (!applications?.length) return null;

  const total = applications.length;
  const now = new Date();
  const ghostCutoff = new Date(now - 14 * 864e5);

  // ── Status breakdown ──────────────────────────────────────────────────────
  const byStatus = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
  applications.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });

  // ── Platform breakdown ────────────────────────────────────────────────────
  const platformMap = {};
  applications.forEach((a) => {
    if (!a.platform) return;
    if (!platformMap[a.platform]) platformMap[a.platform] = { total: 0, interviews: 0, offers: 0, rejections: 0, ghosts: 0 };
    platformMap[a.platform].total++;
    if (a.status === "Interview") platformMap[a.platform].interviews++;
    if (a.status === "Offer") platformMap[a.platform].offers++;
    if (a.status === "Rejected") platformMap[a.platform].rejections++;
    const appliedDate = new Date(a.dateApplied || a.createdAt);
    if (a.status === "Applied" && appliedDate < ghostCutoff) platformMap[a.platform].ghosts++;
  });
  const platforms = Object.entries(platformMap).map(([name, d]) => ({
    name,
    total: d.total,
    callbackRate: d.total > 0 ? +((( d.interviews + d.offers) / d.total) * 100).toFixed(1) : 0,
    rejectionRate: d.total > 0 ? +((d.rejections / d.total) * 100).toFixed(1) : 0,
    ghostRate: d.total > 0 ? +((d.ghosts / d.total) * 100).toFixed(1) : 0,
  })).sort((a, b) => b.total - a.total);

  // ── Work type breakdown ───────────────────────────────────────────────────
  const workTypeMap = {};
  applications.forEach((a) => {
    if (!a.workType) return;
    if (!workTypeMap[a.workType]) workTypeMap[a.workType] = { total: 0, callbacks: 0 };
    workTypeMap[a.workType].total++;
    if (a.status === "Interview" || a.status === "Offer") workTypeMap[a.workType].callbacks++;
  });
  const workTypes = Object.entries(workTypeMap).map(([name, d]) => ({
    name,
    total: d.total,
    callbackRate: d.total > 0 ? +((d.callbacks / d.total) * 100).toFixed(1) : 0,
  }));

  // ── Role category breakdown ───────────────────────────────────────────────
  const classifyRole = (role = "") => {
    const r = role.toLowerCase();
    if (r.includes("backend") || r.includes("back-end") || r.includes("back end")) return "Backend";
    if (r.includes("frontend") || r.includes("front-end") || r.includes("front end")) return "Frontend";
    if (r.includes("full") && r.includes("stack")) return "Fullstack";
    if (r.includes("data") && (r.includes("science") || r.includes("analyst"))) return "Data Science";
    if (r.includes("data engineer")) return "Data Engineering";
    if (r.includes("ml") || r.includes("machine learning") || r.includes("ai ") || r.includes("deep learning")) return "ML/AI";
    if (r.includes("devops") || r.includes("sre") || r.includes("cloud") || r.includes("infra")) return "DevOps/Cloud";
    if (r.includes("mobile") || r.includes("android") || r.includes("ios")) return "Mobile";
    if (r.includes("intern")) return "Internship";
    return "Other";
  };
  const roleMap = {};
  applications.forEach((a) => {
    const cat = classifyRole(a.role);
    if (!roleMap[cat]) roleMap[cat] = { total: 0, callbacks: 0, rejections: 0 };
    roleMap[cat].total++;
    if (a.status === "Interview" || a.status === "Offer") roleMap[cat].callbacks++;
    if (a.status === "Rejected") roleMap[cat].rejections++;
  });
  const roles = Object.entries(roleMap)
    .filter(([, d]) => d.total >= 2)
    .map(([name, d]) => ({
      name,
      total: d.total,
      callbackRate: +((d.callbacks / d.total) * 100).toFixed(1),
      rejectionRate: +((d.rejections / d.total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.callbackRate - a.callbackRate);

  // ── Apply type breakdown (Direct / Referral / etc.) ───────────────────────
  const applyTypeMap = {};
  applications.forEach((a) => {
    const t = a.applyType || "Direct Apply";
    if (!applyTypeMap[t]) applyTypeMap[t] = { total: 0, callbacks: 0, rejections: 0 };
    applyTypeMap[t].total++;
    if (a.status === "Interview" || a.status === "Offer") applyTypeMap[t].callbacks++;
    if (a.status === "Rejected") applyTypeMap[t].rejections++;
  });
  const applyTypes = Object.entries(applyTypeMap).map(([name, d]) => ({
    name,
    total: d.total,
    callbackRate: +((d.callbacks / d.total) * 100).toFixed(1),
  }));

  // ── Job type breakdown (Job / Internship) ─────────────────────────────────
  const jobTypeMap = {};
  applications.forEach((a) => {
    const t = a.jobType || "Job";
    if (!jobTypeMap[t]) jobTypeMap[t] = { total: 0, callbacks: 0 };
    jobTypeMap[t].total++;
    if (a.status === "Interview" || a.status === "Offer") jobTypeMap[t].callbacks++;
  });
  const jobTypes = Object.entries(jobTypeMap).map(([name, d]) => ({
    name, total: d.total,
    callbackRate: +((d.callbacks / d.total) * 100).toFixed(1),
  }));

  // ── Resume version breakdown ──────────────────────────────────────────────
  const resumeMap = {};
  applications.forEach((a) => {
    if (!a.resumeVersion) return;
    if (!resumeMap[a.resumeVersion]) resumeMap[a.resumeVersion] = { total: 0, callbacks: 0 };
    resumeMap[a.resumeVersion].total++;
    if (a.status === "Interview" || a.status === "Offer") resumeMap[a.resumeVersion].callbacks++;
  });
  const resumeVersions = Object.entries(resumeMap).map(([name, d]) => ({
    name, total: d.total,
    callbackRate: +((d.callbacks / d.total) * 100).toFixed(1),
  })).sort((a, b) => b.callbackRate - a.callbackRate);

  // ── Response time (days from apply → first status change) ─────────────────
  const responseTimes = [];
  applications.forEach((a) => {
    if (a.statusHistory?.length > 1) {
      const delta = Math.round(
        (new Date(a.statusHistory[1].date) - new Date(a.statusHistory[0].date)) / 864e5
      );
      if (delta >= 0) responseTimes.push(delta);
    }
  });
  const avgResponseDays = responseTimes.length
    ? +(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
    : null;

  // ── Ghost rate ────────────────────────────────────────────────────────────
  const ghosts = applications.filter((a) => {
    if (a.status !== "Applied") return false;
    return new Date(a.dateApplied || a.createdAt) < ghostCutoff;
  });
  const ghostRate = +((ghosts.length / total) * 100).toFixed(1);

  // ── Weekly velocity ───────────────────────────────────────────────────────
  const weekMap = {};
  applications.forEach((a) => {
    const d = new Date(a.dateApplied || a.createdAt);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    const key = monday.toISOString().slice(0, 10);
    weekMap[key] = (weekMap[key] || 0) + 1;
  });
  const weekCounts = Object.values(weekMap);
  const avgPerWeek = weekCounts.length
    ? +(weekCounts.reduce((a, b) => a + b, 0) / weekCounts.length).toFixed(1)
    : 0;
  const maxGap = (() => {
    const dates = applications
      .map((a) => new Date(a.dateApplied || a.createdAt))
      .sort((a, b) => a - b);
    let max = 0;
    for (let i = 1; i < dates.length; i++) {
      const gap = Math.round((dates[i] - dates[i - 1]) / 864e5);
      if (gap > max) max = gap;
    }
    return max;
  })();

  // ── Rejection stage (pre-interview vs post) ───────────────────────────────
  const rejectedApps = applications.filter((a) => a.status === "Rejected");
  const preInterviewRejections = rejectedApps.filter(
    (a) => !a.statusHistory?.some((h) => h.status === "Interview")
  ).length;
  const postInterviewRejections = rejectedApps.length - preInterviewRejections;

  return {
    summary: {
      total,
      byStatus,
      callbackRate: +((( byStatus.Interview + byStatus.Offer) / total) * 100).toFixed(1),
      offerRate: +(( byStatus.Offer / total) * 100).toFixed(1),
      ghostRate,
      avgResponseDays,
      avgPerWeek,
      maxGapDays: maxGap,
    },
    platforms,
    workTypes,
    roles,
    applyTypes,
    jobTypes,
    resumeVersions,
    rejectionBreakdown: {
      total: rejectedApps.length,
      preInterview: preInterviewRejections,
      postInterview: postInterviewRejections,
      preInterviewPct: rejectedApps.length > 0
        ? +((preInterviewRejections / rejectedApps.length) * 100).toFixed(1) : 0,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt builder — structured, specific, forces Claude to be data-driven
// ─────────────────────────────────────────────────────────────────────────────
function buildPrompt(payload) {
  return `You are an expert placement coach and data analyst helping a student or job seeker understand their job application performance.

Here is their complete application analytics data:
${JSON.stringify(payload, null, 2)}

Generate exactly 6 sharp, data-driven insights. Each insight must:
1. Reference a specific number or percentage from the data
2. Name the exact metric or dimension (platform, role type, work type, apply method, etc.)
3. Include a concrete, actionable recommendation
4. Be written in plain conversational English — not corporate speak
5. Feel personally relevant and slightly surprising

Insight types to cover (pick the most relevant 6 based on the data):
- Platform performance differences (ghost rates, callback rates)
- Role category performance gaps  
- Apply method impact (referral vs direct, if data exists)
- Resume version comparison (if multiple versions exist)
- Rejection pattern analysis (pre vs post interview)
- Work type (remote/onsite/hybrid) callback differences
- Application consistency and velocity patterns
- Response speed patterns
- Ghost rate analysis

Rules:
- ONLY generate an insight if the data actually supports it (minimum 2 data points)
- If data is insufficient for a dimension, skip it and pick another
- Do NOT hallucinate numbers not present in the data
- Be direct. Lead with the finding, not "You might want to consider..."
- Short sentences. Max 2 sentences per insight body.

Respond ONLY with a valid JSON object containing a single key "insights" whose value is an array. No preamble, no markdown.

Format:
{
  "insights": [
  {
    "id": "unique_slug",
    "type": "positive" | "warning" | "neutral" | "critical",
    "icon": "single emoji",
    "headline": "Short punchy headline under 10 words",
    "body": "The specific finding with numbers. One action sentence.",
    "metric": "the key number to highlight e.g. 4x or 34%",
    "metricLabel": "what the metric means e.g. higher callback rate",
    "dimension": "platform|role|apply_type|resume|consistency|ghost|rejection|worktype|response_speed"
  }
  ]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight Card
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  positive: { accent: "#22c55e", bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.2)", label: "Win" },
  warning:  { accent: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)", label: "Watch" },
  critical: { accent: "#ef4444", bg: "rgba(239,68,68,0.07)",  border: "rgba(239,68,68,0.2)",  label: "Action" },
  neutral:  { accent: "#6c63ff", bg: "rgba(108,99,255,0.07)", border: "rgba(108,99,255,0.2)", label: "Insight" },
};

function InsightCard({ insight, index }) {
  const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.neutral;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        animation: `fadeSlideIn 0.4s ease both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Icon + metric pill */}
      <div style={{ flexShrink: 0, textAlign: "center" }}>
        <div style={{ fontSize: 26, lineHeight: 1, marginBottom: 8 }}>{insight.icon}</div>
        {insight.metric && (
          <div style={{
            background: cfg.accent,
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Syne', sans-serif",
            padding: "3px 8px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            lineHeight: 1.3,
            textAlign: "center",
          }}>
            {insight.metric}
          </div>
        )}
        {insight.metricLabel && (
          <div style={{ fontSize: 9, color: cfg.accent, marginTop: 3, maxWidth: 56, lineHeight: 1.3, textAlign: "center" }}>
            {insight.metricLabel}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
            background: cfg.accent, color: "#fff",
            fontFamily: "'Syne', sans-serif", letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}>
            {cfg.label}
          </span>
        </div>
        <div style={{
          fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
          fontFamily: "'Syne', sans-serif", marginBottom: 5, lineHeight: 1.4,
        }}>
          {insight.headline}
        </div>
        <div style={{
          fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65,
        }}>
          {insight.body}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "rgba(108,99,255,0.04)",
      border: "1px solid rgba(108,99,255,0.1)",
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease infinite" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ height: 10, width: "30%", borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 10, animation: "pulse 1.5s ease infinite" }} />
        <div style={{ height: 14, width: "65%", borderRadius: 6, background: "rgba(255,255,255,0.08)", marginBottom: 8, animation: "pulse 1.5s ease 0.1s infinite" }} />
        <div style={{ height: 12, width: "90%", borderRadius: 6, background: "rgba(255,255,255,0.05)", marginBottom: 5, animation: "pulse 1.5s ease 0.2s infinite" }} />
        <div style={{ height: 12, width: "75%", borderRadius: 6, background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease 0.3s infinite" }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main InsightsEngine component
// ─────────────────────────────────────────────────────────────────────────────
const MIN_APPS_FOR_AI = 3;

const KEYFRAMES = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function InsightsEngine({ applications }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(null);
  const abortRef = useRef(null);

  const generate = useCallback(async () => {
    const payload = buildAnalyticsPayload(applications);
    if (!payload) return;

    // Guard: check key is present before hitting network
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey) {
      setError("NEXT_PUBLIC_GROQ_API_KEY is not set. Add it to your .env.local file and restart the dev server.");
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a placement coach analyst. Always respond with valid JSON only — a single object with an 'insights' array.",
            },
            { role: "user", content: buildPrompt(payload) },
          ],
        }),
      });

      if (!response.ok) {
        // Groq returns structured error bodies — surface the real message
        const errBody = await response.json().catch(() => ({}));
        const msg = errBody?.error?.message || `API error ${response.status}`;
        // 401 = bad key, 429 = rate limit, surface clearly
        if (response.status === 401) throw new Error("Invalid API key. Check NEXT_PUBLIC_GROQ_API_KEY in .env.local.");
        if (response.status === 429) throw new Error("Rate limit hit. Wait a moment then try again.");
        throw new Error(msg);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || "{}";

      // Groq json_object mode wraps array as { "insights": [...] }
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const insightsArray = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.insights)
        ? parsed.insights
        : null;

      if (!insightsArray) throw new Error("Unexpected response shape from model.");

      setInsights(insightsArray.slice(0, 6));
      setLastGeneratedAt(new Date());
    } catch (err) {
      if (err.name === "AbortError") return;
      // Surface the actual error message so it's debuggable
      setError(err.message || "Couldn't generate insights. Try again.");
      console.error("[InsightsEngine]", err);
    } finally {
      setLoading(false);
    }
  }, [applications]);

  const total = applications?.length ?? 0;
  const hasEnoughData = total >= MIN_APPS_FOR_AI;
  const needsMore = MIN_APPS_FOR_AI - total;

  return (
    <div style={{ marginBottom: 24 }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800,
            color: "var(--text-primary)", letterSpacing: "-0.3px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24, borderRadius: 6,
              background: "linear-gradient(135deg, #6c63ff, #22c55e)",
              fontSize: 12,
            }}>✦</span>
            AI Insights
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
            {hasEnoughData
              ? lastGeneratedAt
                ? `Last generated ${lastGeneratedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                : "Analyses your actual data patterns"
              : `Add ${needsMore} more application${needsMore !== 1 ? "s" : ""} to unlock AI insights`}
          </div>
        </div>

        {hasEnoughData && (
          <button
            onClick={generate}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 18px",
              borderRadius: 10,
              border: "1px solid rgba(108,99,255,0.3)",
              background: loading
                ? "rgba(108,99,255,0.08)"
                : "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(34,197,94,0.1))",
              color: loading ? "var(--text-muted)" : "#6c63ff",
              fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Syne', sans-serif",
              transition: "all 0.2s",
              outline: "none",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 12, height: 12, border: "2px solid rgba(108,99,255,0.3)",
                  borderTopColor: "#6c63ff", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite",
                }} />
                Analysing…
              </>
            ) : insights ? (
              <>↻ Refresh Insights</>
            ) : (
              <>✦ Generate Insights</>
            )}
          </button>
        )}
      </div>

      {/* Not enough data state */}
      {!hasEnoughData && (
        <div style={{
          background: "rgba(108,99,255,0.05)",
          border: "1px solid rgba(108,99,255,0.15)",
          borderRadius: 14,
          padding: "28px 24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
            fontFamily: "'Syne', sans-serif", marginBottom: 8,
          }}>
            AI needs more data to work with
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
            You have <strong style={{ color: "#6c63ff" }}>{total}</strong> application{total !== 1 ? "s" : ""}.
            Add {needsMore} more and the AI will start finding patterns — which platforms ghost you, which roles convert better, and what's actually working.
          </div>
          {/* Progress */}
          <div style={{ maxWidth: 240, margin: "20px auto 0" }}>
            <div style={{ height: 4, background: "rgba(108,99,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(total / MIN_APPS_FOR_AI) * 100}%`,
                background: "linear-gradient(90deg, #6c63ff, #22c55e)",
                borderRadius: 99, transition: "width 0.5s",
              }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
              {total} / {MIN_APPS_FOR_AI} applications
            </div>
          </div>
        </div>
      )}

      {/* Idle state — enough data but not yet generated */}
      {hasEnoughData && !loading && !insights && !error && (
        <div style={{
          background: "rgba(108,99,255,0.05)",
          border: "1px dashed rgba(108,99,255,0.25)",
          borderRadius: 14,
          padding: "32px 24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
            fontFamily: "'Syne', sans-serif", marginBottom: 8,
          }}>
            Ready to analyse your {total} applications
          </div>
          <div style={{
            fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7,
            maxWidth: 400, margin: "0 auto 20px",
          }}>
            Llama 3.3 will scan your data for patterns — platform ghost rates, role performance gaps, resume effectiveness, and more.
          </div>
          <button
            onClick={generate}
            style={{
              padding: "11px 28px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #6c63ff, #4f46e5)",
              color: "#fff",
              fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Syne', sans-serif",
              boxShadow: "0 4px 20px rgba(108,99,255,0.35)",
              outline: "none",
            }}
          >
            ✦ Generate AI Insights
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>Failed to generate insights</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{error}</div>
          </div>
          <button
            onClick={generate}
            style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)",
              background: "transparent", color: "#ef4444", fontSize: 12,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Insights grid */}
      {insights && !loading && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {insights.map((insight, i) => (
              <InsightCard key={insight.id || i} insight={insight} index={i} />
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 14, fontSize: 11, color: "var(--text-muted)",
            textAlign: "center", lineHeight: 1.6,
          }}>
            Based on {total} applications · Insights refresh automatically as you add more data
          </div>
        </>
      )}
    </div>
  );
}