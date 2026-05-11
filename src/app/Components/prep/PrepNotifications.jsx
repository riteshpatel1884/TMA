"use client";
// components/prep/PrepNotifications.jsx
// Sends real emails via Claude API + Gmail MCP
// Drop this into your PrepPage alongside PrepList/PrepDetail

import { useState, useMemo } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(roundDate) {
  if (!roundDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(roundDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function isTopicDone(topic) {
  return topic.dailyLogs?.some((l) => l.completed) ?? false;
}

function todayStr() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Build email payloads from tracker data ───────────────────────────────────

function buildDailySummaryPrompt(trackers) {
  const today = todayISO();

  const summaryLines = [];
  let totalCompleted = 0;
  let totalPending = 0;

  trackers.forEach((tracker) => {
    const todaysTopics = tracker.topics.filter(
      (t) => t.daySlot !== undefined || true // include all topics
    );
    const completedToday = todaysTopics.filter((t) =>
      t.dailyLogs?.some((l) => l.logDate?.slice(0, 10) === today && l.completed)
    );
    const remaining = todaysTopics.filter((t) => !isTopicDone(t));
    const pct = tracker.totalTopics
      ? Math.round((tracker.doneTopics / tracker.totalTopics) * 100)
      : 0;
    const dl = daysUntil(tracker.roundDate);

    totalCompleted += completedToday.length;
    totalPending += remaining.length;

    summaryLines.push(
      `• ${tracker.companyName} (${tracker.roundName}): ` +
      `${completedToday.length} topics completed today, ` +
      `${remaining.length} remaining, ` +
      `overall ${pct}% done` +
      (dl !== null ? `, ${dl <= 0 ? "EXAM TODAY!" : `${dl} days to exam`}` : "")
    );

    if (completedToday.length > 0) {
      summaryLines.push(
        `  ✓ Completed: ${completedToday.map((t) => t.name).join(", ")}`
      );
    }
    if (remaining.slice(0, 5).length > 0) {
      summaryLines.push(
        `  ⏳ Pending: ${remaining.slice(0, 5).map((t) => t.name).join(", ")}` +
        (remaining.length > 5 ? ` +${remaining.length - 5} more` : "")
      );
    }
  });

  return `You are an email assistant. Send a daily prep summary email using Gmail.

TODAY: ${todayStr()}

PREP TRACKER SUMMARY:
${summaryLines.join("\n")}

TOTALS: ${totalCompleted} topics completed today across all trackers, ${totalPending} still pending.

Write a motivating, concise daily summary email with:
- Subject: "📚 Daily Prep Summary – ${todayStr()}"  
- A warm opening line
- The tracker details above formatted as a clean table or bullet list
- A motivational closing line
- Sign off as "Your Prep Tracker"

Then send it using Gmail to the user's own email address (find it from their Gmail profile/sent mail).
Make it look professional with proper HTML formatting if possible, otherwise plain text is fine.`;
}

function buildReminderPrompt(trackers) {
  const urgentTrackers = trackers.filter((t) => {
    const dl = daysUntil(t.roundDate);
    return dl !== null && dl >= 0 && dl <= 7;
  });

  if (urgentTrackers.length === 0) return null;

  const reminderLines = urgentTrackers.map((t) => {
    const dl = daysUntil(t.roundDate);
    const pct = t.totalTopics
      ? Math.round((t.doneTopics / t.totalTopics) * 100)
      : 0;
    const remaining = t.totalTopics - t.doneTopics;
    const urgency = dl === 0 ? "🚨 EXAM TODAY" : dl === 1 ? "⚠️ TOMORROW" : `📅 ${dl} days left`;

    return `• ${urgency} — ${t.companyName} ${t.roundName}\n` +
      `  Progress: ${pct}% (${remaining} topics still pending)\n` +
      `  Exam date: ${new Date(t.roundDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`;
  });

  return `You are an email assistant. Send an urgent exam reminder email using Gmail.

TODAY: ${todayStr()}

UPCOMING EXAMS (within 7 days):
${reminderLines.join("\n\n")}

Write an urgent but encouraging reminder email with:
- Subject: "⏰ Exam Reminder – ${urgentTrackers.length} upcoming round${urgentTrackers.length > 1 ? "s" : ""} this week!"
- Clear urgency without being panic-inducing
- Each exam listed with days remaining and what still needs to be done
- Actionable advice: "Focus on your weakest topics first"
- Motivational closing

Then send it using Gmail to the user's own email address.`;
}

// ─── The API call that uses Claude + Gmail MCP ────────────────────────────────

async function sendViaClaudeGmail(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      mcp_servers: [
        {
          type: "url",
          url: "https://gmailmcp.googleapis.com/mcp/v1",
          name: "gmail-mcp",
        },
      ],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json();

  // Extract text from all content blocks
  const textBlocks = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const toolCalls = (data.content ?? [])
    .filter((b) => b.type === "mcp_tool_use")
    .map((b) => b.name);

  return { text: textBlocks, toolCalls };
}

// ─── Preview card ─────────────────────────────────────────────────────────────

function PreviewCard({ type, trackers }) {
  const today = todayISO();

  if (type === "summary") {
    const totalDoneToday = trackers.reduce((acc, t) => {
      return acc + t.topics.filter((tp) =>
        tp.dailyLogs?.some((l) => l.logDate?.slice(0, 10) === today && l.completed)
      ).length;
    }, 0);
    const totalPending = trackers.reduce((acc, t) => acc + (t.totalTopics - t.doneTopics), 0);

    return (
      <div style={styles.previewCard}>
        <div style={styles.previewTitle}>📧 Daily Summary Preview</div>
        <div style={styles.previewSubject}>
          Subject: 📚 Daily Prep Summary – {todayStr()}
        </div>
        <div style={styles.previewBody}>
          {trackers.map((t) => {
            const doneToday = t.topics.filter((tp) =>
              tp.dailyLogs?.some((l) => l.logDate?.slice(0, 10) === today && l.completed)
            ).length;
            const pct = t.totalTopics ? Math.round((t.doneTopics / t.totalTopics) * 100) : 0;
            const dl = daysUntil(t.roundDate);
            return (
              <div key={t.id} style={styles.previewRow}>
                <div style={styles.previewCompany}>{t.companyName}</div>
                <div style={styles.previewMeta}>
                  <span style={{ color: "#22c55e" }}>✓ {doneToday} done today</span>
                  <span style={{ color: "#8b8b9a", margin: "0 8px" }}>·</span>
                  <span style={{ color: "#f59e0b" }}>{t.totalTopics - t.doneTopics} pending</span>
                  <span style={{ color: "#8b8b9a", margin: "0 8px" }}>·</span>
                  <span style={{ color: "#6c63ff" }}>{pct}% overall</span>
                  {dl !== null && (
                    <>
                      <span style={{ color: "#8b8b9a", margin: "0 8px" }}>·</span>
                      <span style={{ color: dl <= 3 ? "#ef4444" : "#22c55e" }}>
                        {dl <= 0 ? "Exam today!" : `${dl}d left`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div style={styles.previewFooter}>
            {totalDoneToday} topics completed today · {totalPending} still pending
          </div>
        </div>
      </div>
    );
  }

  // Reminder preview
  const urgent = trackers.filter((t) => {
    const dl = daysUntil(t.roundDate);
    return dl !== null && dl >= 0 && dl <= 7;
  });

  if (urgent.length === 0) {
    return (
      <div style={styles.previewCard}>
        <div style={styles.previewTitle}>📧 Reminder Preview</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "12px 0" }}>
          No exams within the next 7 days — nothing urgent to remind.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.previewCard}>
      <div style={styles.previewTitle}>📧 Reminder Preview</div>
      <div style={styles.previewSubject}>
        Subject: ⏰ Exam Reminder – {urgent.length} upcoming round{urgent.length > 1 ? "s" : ""} this week!
      </div>
      <div style={styles.previewBody}>
        {urgent.map((t) => {
          const dl = daysUntil(t.roundDate);
          const pct = t.totalTopics ? Math.round((t.doneTopics / t.totalTopics) * 100) : 0;
          return (
            <div key={t.id} style={styles.previewRow}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: dl === 0 ? "rgba(239,68,68,0.15)" : dl <= 3 ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
                  color: dl === 0 ? "#ef4444" : dl <= 3 ? "#f59e0b" : "#22c55e",
                }}>
                  {dl === 0 ? "TODAY" : dl === 1 ? "TOMORROW" : `${dl} DAYS`}
                </span>
                <div style={styles.previewCompany}>{t.companyName}</div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.roundName}</span>
              </div>
              <div style={styles.previewMeta}>
                {pct}% complete · {t.totalTopics - t.doneTopics} topics remaining
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const map = {
    idle: { label: "Ready", color: "#8b8b9a", bg: "rgba(139,139,154,0.1)" },
    loading: { label: "Sending…", color: "#6c63ff", bg: "rgba(108,99,255,0.12)" },
    success: { label: "Sent ✓", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    error: { label: "Failed", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  };
  const s = map[status] ?? map.idle;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
      color: s.color, background: s.bg, border: `1px solid ${s.color}33`,
    }}>
      {s.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrepNotifications({ trackers }) {
  const [activePreview, setActivePreview] = useState(null); // "summary" | "reminder" | null
  const [summaryStatus, setSummaryStatus] = useState("idle");
  const [reminderStatus, setReminderStatus] = useState("idle");
  const [summaryLog, setSummaryLog] = useState("");
  const [reminderLog, setReminderLog] = useState("");
  const [expanded, setExpanded] = useState(false);

  const urgentCount = useMemo(() =>
    trackers.filter((t) => {
      const dl = daysUntil(t.roundDate);
      return dl !== null && dl >= 0 && dl <= 7;
    }).length,
    [trackers]
  );

  const today = todayISO();
  const totalDoneToday = useMemo(() =>
    trackers.reduce((acc, t) =>
      acc + t.topics.filter((tp) =>
        tp.dailyLogs?.some((l) => l.logDate?.slice(0, 10) === today && l.completed)
      ).length, 0),
    [trackers, today]
  );

  const handleSendSummary = async () => {
    setSummaryStatus("loading");
    setSummaryLog("");
    try {
      const prompt = buildDailySummaryPrompt(trackers);
      const { text, toolCalls } = await sendViaClaudeGmail(prompt);
      setSummaryStatus("success");
      setSummaryLog(
        toolCalls.length > 0
          ? `✓ Email sent via Gmail (${toolCalls.join(", ")})`
          : text.slice(0, 200) || "✓ Completed"
      );
    } catch (e) {
      setSummaryStatus("error");
      setSummaryLog(`Error: ${e.message}`);
    }
  };

  const handleSendReminder = async () => {
    setReminderStatus("loading");
    setReminderLog("");
    try {
      const prompt = buildReminderPrompt(trackers);
      if (!prompt) {
        setReminderStatus("idle");
        setReminderLog("No exams within 7 days — nothing to remind.");
        return;
      }
      const { text, toolCalls } = await sendViaClaudeGmail(prompt);
      setReminderStatus("success");
      setReminderLog(
        toolCalls.length > 0
          ? `✓ Reminder sent via Gmail (${toolCalls.join(", ")})`
          : text.slice(0, 200) || "✓ Completed"
      );
    } catch (e) {
      setReminderStatus("error");
      setReminderLog(`Error: ${e.message}`);
    }
  };

  // Collapsed bar shown at top of prep page
  if (!expanded) {
    return (
      <div style={styles.collapsedBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15 }}>🔔</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Email Notifications
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 10 }}>
              {totalDoneToday > 0 ? `${totalDoneToday} topics done today` : "No topics done today"}
              {urgentCount > 0 && (
                <span style={{ color: "#ef4444", marginLeft: 8 }}>
                  · {urgentCount} exam{urgentCount > 1 ? "s" : ""} this week
                </span>
              )}
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(true)}
          style={styles.expandBtn}
        >
          Send Emails ↓
        </button>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      {/* Panel header */}
      <div style={styles.panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <div>
            <div style={styles.panelTitle}>Email Notifications</div>
            <div style={styles.panelSubtitle}>
              Sends real emails to your Gmail inbox via Gmail MCP
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(false)} style={styles.closeBtn}>✕</button>
      </div>

      {/* Two action cards */}
      <div style={styles.cardGrid}>

        {/* ── Daily Summary Card ── */}
        <div style={styles.notifCard}>
          <div style={styles.notifCardTop}>
            <div>
              <div style={styles.notifCardTitle}>📚 Daily Summary</div>
              <div style={styles.notifCardDesc}>
                Sends today's completed topics, pending tasks, and overall progress across all trackers.
              </div>
            </div>
            <StatusPill status={summaryStatus} />
          </div>

          <div style={styles.statRow}>
            <div style={styles.statChip}>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>{totalDoneToday}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}> done today</span>
            </div>
            <div style={styles.statChip}>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                {trackers.reduce((a, t) => a + (t.totalTopics - t.doneTopics), 0)}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}> pending</span>
            </div>
            <div style={styles.statChip}>
              <span style={{ color: "#6c63ff", fontWeight: 700 }}>{trackers.length}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}> tracker{trackers.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {summaryLog && (
            <div style={{
              ...styles.logBox,
              borderColor: summaryStatus === "success" ? "rgba(34,197,94,0.25)" : summaryStatus === "error" ? "rgba(239,68,68,0.25)" : "var(--border)",
              color: summaryStatus === "success" ? "#22c55e" : summaryStatus === "error" ? "#ef4444" : "var(--text-muted)",
            }}>
              {summaryLog}
            </div>
          )}

          <div style={styles.notifCardActions}>
            <button
              onClick={() => setActivePreview(activePreview === "summary" ? null : "summary")}
              style={styles.previewBtn}
            >
              {activePreview === "summary" ? "Hide Preview" : "Preview"}
            </button>
            <button
              onClick={handleSendSummary}
              disabled={summaryStatus === "loading" || trackers.length === 0}
              style={{
                ...styles.sendBtn,
                opacity: summaryStatus === "loading" || trackers.length === 0 ? 0.6 : 1,
                cursor: summaryStatus === "loading" ? "wait" : "pointer",
              }}
            >
              {summaryStatus === "loading" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={styles.spinner} />
                  Sending…
                </span>
              ) : (
                "✉ Send to Gmail"
              )}
            </button>
          </div>
        </div>

        {/* ── Reminder Card ── */}
        <div style={styles.notifCard}>
          <div style={styles.notifCardTop}>
            <div>
              <div style={styles.notifCardTitle}>⏰ Exam Reminders</div>
              <div style={styles.notifCardDesc}>
                Sends urgent reminders for any exams happening within the next 7 days.
              </div>
            </div>
            <StatusPill status={reminderStatus} />
          </div>

          <div style={styles.statRow}>
            <div style={{
              ...styles.statChip,
              borderColor: urgentCount > 0 ? "rgba(239,68,68,0.3)" : "var(--border)",
            }}>
              <span style={{ color: urgentCount > 0 ? "#ef4444" : "#22c55e", fontWeight: 700 }}>
                {urgentCount}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}> urgent</span>
            </div>
            {trackers
              .filter((t) => { const dl = daysUntil(t.roundDate); return dl !== null && dl >= 0 && dl <= 7; })
              .slice(0, 2)
              .map((t) => {
                const dl = daysUntil(t.roundDate);
                return (
                  <div key={t.id} style={{
                    ...styles.statChip,
                    borderColor: dl <= 1 ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.3)",
                  }}>
                    <span style={{ color: dl <= 1 ? "#ef4444" : "#f59e0b", fontWeight: 700 }}>
                      {dl === 0 ? "Today" : `${dl}d`}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}> {t.companyName}</span>
                  </div>
                );
              })}
          </div>

          {reminderLog && (
            <div style={{
              ...styles.logBox,
              borderColor: reminderStatus === "success" ? "rgba(34,197,94,0.25)" : reminderStatus === "error" ? "rgba(239,68,68,0.25)" : "var(--border)",
              color: reminderStatus === "success" ? "#22c55e" : reminderStatus === "error" ? "#ef4444" : "var(--text-muted)",
            }}>
              {reminderLog}
            </div>
          )}

          <div style={styles.notifCardActions}>
            <button
              onClick={() => setActivePreview(activePreview === "reminder" ? null : "reminder")}
              style={styles.previewBtn}
            >
              {activePreview === "reminder" ? "Hide Preview" : "Preview"}
            </button>
            <button
              onClick={handleSendReminder}
              disabled={reminderStatus === "loading"}
              style={{
                ...styles.sendBtn,
                opacity: reminderStatus === "loading" ? 0.6 : 1,
                background: urgentCount > 0 ? "linear-gradient(135deg, #ef4444, #f59e0b)" : "linear-gradient(135deg, #6c63ff, #3b82f6)",
                cursor: reminderStatus === "loading" ? "wait" : "pointer",
              }}
            >
              {reminderStatus === "loading" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={styles.spinner} />
                  Sending…
                </span>
              ) : (
                "✉ Send to Gmail"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview panel */}
      {activePreview && (
        <PreviewCard type={activePreview} trackers={trackers} />
      )}

      {/* Footer note */}
      <div style={styles.footerNote}>
        <span style={{ marginRight: 6 }}>ℹ</span>
        Emails are sent to your connected Gmail account. Make sure Gmail MCP is enabled in your Claude settings.
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  collapsedBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "10px 16px",
    marginBottom: 20,
  },
  expandBtn: {
    background: "rgba(108,99,255,0.12)",
    border: "1px solid rgba(108,99,255,0.3)",
    borderRadius: "var(--radius-sm)",
    color: "#6c63ff",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  panel: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    marginBottom: 24,
    overflow: "hidden",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(108,99,255,0.05)",
  },
  panelTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  panelSubtitle: {
    fontSize: 11,
    color: "var(--text-muted)",
    marginTop: 2,
  },
  closeBtn: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-muted)",
    fontSize: 13,
    padding: "4px 10px",
    cursor: "pointer",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 0,
  },
  notifCard: {
    padding: "20px",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  notifCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  notifCardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 4,
  },
  notifCardDesc: {
    fontSize: 12,
    color: "var(--text-muted)",
    lineHeight: 1.5,
    maxWidth: 240,
  },
  statRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  statChip: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
    fontSize: 13,
  },
  logBox: {
    background: "var(--bg)",
    border: "1px solid",
    borderRadius: "var(--radius-sm)",
    padding: "8px 12px",
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: "monospace",
  },
  notifCardActions: {
    display: "flex",
    gap: 8,
    marginTop: "auto",
  },
  previewBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-muted)",
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  sendBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #6c63ff, #3b82f6)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    padding: "9px 16px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  spinner: {
    width: 12,
    height: 12,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
  previewCard: {
    margin: "0 20px 20px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
  },
  previewTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    padding: "12px 16px 8px",
    borderBottom: "1px solid var(--border)",
  },
  previewSubject: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6c63ff",
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
    background: "rgba(108,99,255,0.05)",
  },
  previewBody: {
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  previewRow: {
    padding: "8px 12px",
    background: "var(--bg-card)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  previewCompany: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text-primary)",
    fontFamily: "'Syne', sans-serif",
    marginBottom: 3,
  },
  previewMeta: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  previewFooter: {
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "right",
    marginTop: 4,
  },
  footerNote: {
    fontSize: 11,
    color: "var(--text-muted)",
    padding: "10px 20px",
    borderTop: "1px solid var(--border)",
    background: "rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
  },
};