"use client";

import { useMemo, useState, useEffect } from "react";

const STATUS_COLORS = {
  Applied: "#3b82f6",
  Interview: "#eab308",
  Offer: "#22c55e",
  Rejected: "#ef4444",
};

// ── Streak & Daily Target helpers ─────────────────────────────────────────────
function getStreakData(applications) {
  if (!applications.length)
    return { streak: 0, appliedToday: 0, missedYesterday: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dateSet = new Set();
  applications.forEach((a) => {
    const d = new Date(a.dateApplied || a.createdAt);
    d.setHours(0, 0, 0, 0);
    dateSet.add(d.getTime());
  });

  const appliedToday = applications.filter((a) => {
    const d = new Date(a.dateApplied || a.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const missedYesterday =
    !dateSet.has(yesterday.getTime()) && appliedToday === 0;

  let streak = 0;
  let cursor = new Date(today);
  while (dateSet.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  if (streak === 0 && dateSet.has(yesterday.getTime())) {
    cursor = new Date(yesterday);
    while (dateSet.has(cursor.getTime())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return { streak, appliedToday, missedYesterday };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StreakCard({ applications }) {
  const DAILY_TARGET = 5;
  const { streak, appliedToday, missedYesterday } = useMemo(
    () => getStreakData(applications),
    [applications],
  );
  const progress = Math.min((appliedToday / DAILY_TARGET) * 100, 100);
  const remaining = Math.max(DAILY_TARGET - appliedToday, 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {/* Streak */}
      <div
        className="card"
        style={{
          borderColor: streak >= 3 ? "rgba(234,179,8,0.3)" : "var(--border)",
          background: streak >= 3 ? "rgba(234,179,8,0.04)" : "var(--bg-card)",
        }}
      >
        <div className="stat-label">Apply Streak</div>
        <div
          className="stat-value"
          style={{
            color:
              streak >= 3
                ? "var(--yellow)"
                : streak > 0
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
            fontSize: 30,
          }}
        >
          {streak}
          <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>
            days
          </span>
        </div>
        <div className="stat-sub">
          {missedYesterday
            ? "Streak broken — start again today"
            : streak >= 3
              ? "Keep it going"
              : streak > 0
                ? "Building momentum"
                : "No active streak"}
        </div>
      </div>

      {/* Daily target */}
      <div className="card">
        <div className="stat-label">Today's Target</div>
        <div
          className="stat-value"
          style={{
            color: progress >= 100 ? "var(--green)" : "var(--text-primary)",
            fontSize: 30,
          }}
        >
          {appliedToday}
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-muted)",
              marginLeft: 2,
            }}
          >
            / {DAILY_TARGET}
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="progress-bar-wrap" style={{ height: 5 }}>
            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
                background: progress >= 100 ? "var(--green)" : "var(--accent)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div className="stat-sub" style={{ marginTop: 6 }}>
            {progress >= 100
              ? "Daily goal hit"
              : `${remaining} more to hit goal`}
          </div>
        </div>
      </div>

      {/* Aggressive message */}
      <div
        className="card"
        style={{
          borderColor: missedYesterday
            ? "rgba(239,68,68,0.3)"
            : "var(--border)",
          background: missedYesterday
            ? "rgba(239,68,68,0.04)"
            : "var(--bg-card)",
        }}
      >
        <div className="stat-label">Status Check</div>
        <div
          style={{
            fontSize: 13,
            color: missedYesterday
              ? "var(--red)"
              : appliedToday >= DAILY_TARGET
                ? "var(--green)"
                : "var(--text-secondary)",
            fontWeight: 600,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          {missedYesterday
            ? "You fell behind. Top candidates apply 10+ jobs daily. Catch up today."
            : appliedToday >= DAILY_TARGET
              ? "On track. Maintain consistency — most offers come from volume."
              : appliedToday > 0
                ? `${appliedToday} done today. Strong candidates don't stop here.`
                : "No applications today yet. The market doesn't wait."}
        </div>
      </div>
    </div>
  );
}

function TodaysPlan({ applications }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("statuscode_today_tasks");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 1, text: "Follow up on pending applications", done: false },
      { id: 2, text: "Revise resume for target role", done: false },
    ];
  });
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);

  const followUps = useMemo(() => {
    return applications
      .filter((a) => {
        if (a.status !== "Applied" || !a.followUpDate) return false;
        return new Date(a.followUpDate) <= new Date();
      })
      .slice(0, 3);
  }, [applications]);

  useEffect(() => {
    try {
      localStorage.setItem("statuscode_today_tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const toggle = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text: newTask.trim(), done: false },
    ]);
    setNewTask("");
    setAdding(false);
  };

  const removeTask = (id) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="card-title" style={{ marginBottom: 2 }}>
            Today's Plan
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {doneCount}/{tasks.length} completed
          </div>
        </div>
        <button
          className="btn-ghost"
          style={{ fontSize: 11, padding: "5px 12px" }}
          onClick={() => setAdding(true)}
        >
          + Add Task
        </button>
      </div>

      {followUps.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(234,179,8,0.06)",
            border: "1px solid rgba(234,179,8,0.2)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--yellow)",
              fontWeight: 700,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Follow-ups Due
          </div>
          {followUps.map((a) => (
            <div
              key={a.id}
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                padding: "2px 0",
              }}
            >
              Follow up with {a.company} — {a.role}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              background: task.done ? "var(--bg-hover)" : "transparent",
              border: "1px solid var(--border)",
              transition: "all 0.15s",
            }}
          >
            <div
              onClick={() => toggle(task.id)}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `2px solid ${task.done ? "var(--accent)" : "var(--border-light)"}`,
                background: task.done ? "var(--accent)" : "transparent",
                flexShrink: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {task.done && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path
                    d="M1 3L3 5L7 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: task.done
                  ? "var(--text-muted)"
                  : "var(--text-secondary)",
                textDecoration: task.done ? "line-through" : "none",
                cursor: "pointer",
              }}
              onClick={() => toggle(task.id)}
            >
              {task.text}
            </span>
            <button
              onClick={() => removeTask(task.id)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: "0 2px",
                opacity: 0.5,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
            >
              x
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            autoFocus
            className="form-input"
            placeholder="Add a task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
              if (e.key === "Escape") setAdding(false);
            }}
            style={{ fontSize: 12 }}
          />
          <button
            className="btn-primary"
            style={{ padding: "6px 14px", fontSize: 12 }}
            onClick={addTask}
          >
            Add
          </button>
          <button
            className="btn-ghost"
            style={{ padding: "6px 10px", fontSize: 12 }}
            onClick={() => setAdding(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function TimelineList({ events, cardBg }) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 7,
          top: 0,
          bottom: 0,
          width: 1,
          background: "var(--border)",
        }}
      />
      {events.map((ev, i) => (
        <div
          key={ev.id}
          style={{
            display: "flex",
            gap: 16,
            paddingBottom: i < events.length - 1 ? 16 : 0,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: STATUS_COLORS[ev.status] || "var(--border-light)",
              flexShrink: 0,
              marginTop: 2,
              border: `2px solid ${cardBg || "var(--bg-card)"}`,
              zIndex: 1,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {ev.company}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {ev.date.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })}
              </span>
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}
            >
              {ev.role} —{" "}
              <span
                style={{ color: STATUS_COLORS[ev.status], fontWeight: 600 }}
              >
                {ev.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineModal({ events, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: 14,
          width: "100%",
          maxWidth: 480,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 22px 14px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Full Activity Timeline
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
            >
              {events.length} event{events.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-muted)",
              fontSize: 16,
              cursor: "pointer",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            x
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "18px 22px 22px", flex: 1 }}>
          <TimelineList events={events} cardBg="var(--bg-card)" />
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ applications }) {
  const [modalOpen, setModalOpen] = useState(false);
  const PREVIEW_COUNT = 5;

  const allEvents = useMemo(() => {
    const list = [];
    applications.forEach((app) => {
      if (app.statusHistory && app.statusHistory.length > 0) {
        app.statusHistory.forEach((h, idx) => {
          list.push({
            date: new Date(h.date),
            company: app.company,
            role: app.role,
            status: h.status,
            id: `${app.id}-${h.status}-${idx}`,
          });
        });
      } else {
        list.push({
          date: new Date(app.createdAt),
          company: app.company,
          role: app.role,
          status: "Applied",
          id: `${app.id}-applied`,
        });
      }
    });
    return list.sort((a, b) => b.date - a.date);
  }, [applications]);

  const preview = allEvents.slice(0, PREVIEW_COUNT);
  const remaining = allEvents.length - PREVIEW_COUNT;

  if (!allEvents.length) return null;

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div className="card-title" style={{ marginBottom: 0 }}>
            Activity Timeline
          </div>
        </div>

        <TimelineList events={preview} cardBg="var(--bg-card)" />

        {remaining > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              marginTop: 14,
              width: "100%",
              padding: "9px",
              borderRadius: "var(--radius-sm)",
              border: "1px dashed var(--border-light)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-border)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            + {remaining} more event{remaining !== 1 ? "s" : ""} — click to view
            all
          </button>
        )}
      </div>

      {modalOpen && (
        <TimelineModal events={allEvents} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard({ applications, onAddClick }) {
  if (applications.length === 0) {
    return (
      <div>
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <h3>No applications yet</h3>
          <p>Start tracking your job search by adding your first application</p>
          <button
            className="btn-primary"
            style={{ margin: "16px auto 0", display: "inline-flex" }}
            onClick={onAddClick}
          >
            <span>+</span> Add Your First Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StreakCard applications={applications} />
      <TodaysPlan applications={applications} />
      <ActivityTimeline applications={applications} />
    </div>
  );
}