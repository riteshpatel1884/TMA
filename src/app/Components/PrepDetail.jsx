"use client";
// components/prep/PrepDetail.jsx
import { useState, useMemo } from "react";
import AddTopicsModal from "./AddTopicsModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(roundDate) {
  if (!roundDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(roundDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function slotToDate(roundDate, daySlot, totalDays) {
  if (!roundDate) return null;
  const target = new Date(roundDate);
  target.setHours(0, 0, 0, 0);
  const d = new Date(target);
  d.setDate(d.getDate() - (totalDays - 1) + (daySlot - 1));
  return d;
}

function fmt(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isTopicDone(topic) {
  return topic.dailyLogs?.some((l) => l.completed) ?? false;
}

function groupByDay(topics) {
  const map = new Map();
  for (const t of topics) {
    const slot = t.daySlot ?? 0;
    if (!map.has(slot)) map.set(slot, []);
    map.get(slot).push(t);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

const CAT_COLORS = {
  Quantitative: { bg: "var(--blue-dim)", color: "var(--blue)" },
  Logical: { bg: "var(--yellow-dim)", color: "var(--yellow)" },
  Verbal: { bg: "var(--green-dim)", color: "var(--green)" },
  Custom: { bg: "var(--accent-dim)", color: "var(--accent)" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrepDetail({ tracker: initialTracker, onDelete, onUpdate }) {
  const [tracker, setTracker] = useState(initialTracker);
  const [openDays, setOpenDays] = useState(() => {
    // Auto-open today's day slot
    const todayNum = new Date().setHours(0, 0, 0, 0);
    return new Set([1]); // open day 1 by default
  });
  const [togglingId, setTogglingId] = useState(null);
  const [showAddTopics, setShowAddTopics] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalDays = tracker.roundDate ? daysUntil(tracker.roundDate) : null;
  const dl = daysUntil(tracker.roundDate);
  const pct = tracker.totalTopics
    ? Math.round((tracker.doneTopics / tracker.totalTopics) * 100)
    : 0;

  const grouped = useMemo(() => groupByDay(tracker.topics), [tracker.topics]);

  const toggleDay = (slot) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      return next;
    });
  };

  const toggleTopic = async (topic) => {
    const done = isTopicDone(topic);
    setTogglingId(topic.id);
    try {
      const res = await fetch("/api/prep/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          logDate: todayStr(),
          completed: !done,
        }),
      });
      const data = await res.json();
      if (!res.ok) return;

      // Optimistically update local state
      setTracker((prev) => ({
        ...prev,
        doneTopics: data.doneTopics,
        topics: prev.topics.map((t) => {
          if (t.id !== topic.id) return t;
          const filtered = (t.dailyLogs ?? []).filter(
            (l) => l.logDate?.slice(0, 10) !== todayStr()
          );
          return {
            ...t,
            dailyLogs: !done
              ? [...filtered, { completed: true, logDate: todayStr() }]
              : filtered,
          };
        }),
      }));
    } finally {
      setTogglingId(null);
    }
  };

  const handleTopicsAdded = (updatedTracker) => {
    setTracker(updatedTracker);
    onUpdate(updatedTracker);
    setShowAddTopics(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/prep/${tracker.id}`, { method: "DELETE" });
    onDelete(tracker.id);
  };

  return (
    <div className="prep-detail">
      {/* ── Header ── */}
      <div className="pd-header">
        <div>
          <div className="pd-company">{tracker.companyName}</div>
          <div className="pd-meta-row">
            <span className="detail-chip">{tracker.roundName}</span>
            {tracker.application && (
              <span className="detail-chip detail-chip-blue">
                {tracker.application.role}
              </span>
            )}
            {tracker.roundDate && (
              <span className="detail-chip">
                {new Date(tracker.roundDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
            {dl !== null && (
              <span
                className={`pli-days ${dl <= 0 ? "pli-days-over" : dl <= 3 ? "pli-days-urgent" : ""}`}
              >
                {dl <= 0 ? "Exam day!" : dl === 1 ? "Tomorrow!" : `${dl} days left`}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={() => setShowAddTopics(true)}>
            + Add Topics
          </button>
          {confirmDelete ? (
            <>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "..." : "Confirm"}
              </button>
              <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="pd-stats-row">
        <div className="pd-stat">
          <div className="pd-stat-val stat-accent">{tracker.totalTopics}</div>
          <div className="pd-stat-label">Total Topics</div>
        </div>
        <div className="pd-stat">
          <div className="pd-stat-val stat-green">{tracker.doneTopics}</div>
          <div className="pd-stat-label">Completed</div>
        </div>
        <div className="pd-stat">
          <div className="pd-stat-val stat-yellow">
            {tracker.totalTopics - tracker.doneTopics}
          </div>
          <div className="pd-stat-label">Remaining</div>
        </div>
        <div className="pd-stat">
          <div className="pd-stat-val">{pct}%</div>
          <div className="pd-stat-label">Progress</div>
        </div>
        {dl !== null && grouped.length > 0 && (
          <div className="pd-stat">
            <div className="pd-stat-val">
              {Math.ceil(tracker.totalTopics / grouped.length)}
            </div>
            <div className="pd-stat-label">Topics/Day</div>
          </div>
        )}
      </div>

      {/* Master progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div className="progress-bar-wrap" style={{ height: 8 }}>
          <div
            className="progress-bar"
            style={{
              width: `${pct}%`,
              background:
                pct === 100
                  ? "var(--green)"
                  : pct > 50
                  ? "var(--accent)"
                  : "var(--yellow)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {tracker.notes && (
        <div className="insight-box" style={{ marginBottom: 20 }}>
          {tracker.notes}
        </div>
      )}

      {/* ── Day accordion ── */}
      {grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No topics yet</h3>
          <p>Click "Add Topics" to get started</p>
        </div>
      ) : (
        <div className="day-accordion">
          {grouped.map(([slot, topics]) => {
            const slotDate = totalDays && tracker.roundDate
              ? slotToDate(tracker.roundDate, slot, totalDays)
              : null;
            const doneCnt = topics.filter(isTopicDone).length;
            const allDone = doneCnt === topics.length;
            const isOpen = openDays.has(slot);
            const isToday =
              slotDate &&
              slotDate.toDateString() === new Date().toDateString();
            const isPast = slotDate && slotDate < new Date().setHours(0,0,0,0);

            return (
              <div
                key={slot}
                className={`day-block ${isToday ? "day-block-today" : ""} ${allDone ? "day-block-done" : ""}`}
              >
                {/* Day header */}
                <button
                  className="day-header"
                  onClick={() => toggleDay(slot)}
                >
                  <div className="day-header-left">
                    <div className="day-number">
                      {slot === 0 ? "Unscheduled" : `Day ${slot}`}
                    </div>
                    {slotDate && (
                      <div className="day-date">
                        {fmt(slotDate)}
                        {isToday && (
                          <span className="today-badge">TODAY</span>
                        )}
                        {isPast && !isToday && doneCnt < topics.length && (
                          <span className="overdue-badge">OVERDUE</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="day-header-right">
                    <div className="day-progress-mini">
                      <div
                        className="day-progress-fill"
                        style={{
                          width: `${topics.length ? (doneCnt / topics.length) * 100 : 0}%`,
                          background: allDone ? "var(--green)" : "var(--accent)",
                        }}
                      />
                    </div>
                    <span className="day-count">
                      {doneCnt}/{topics.length}
                    </span>
                    <span className="day-chevron">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Topics list */}
                {isOpen && (
                  <div className="day-topics">
                    {topics.map((topic) => {
                      const done = isTopicDone(topic);
                      const toggling = togglingId === topic.id;
                      const catStyle = CAT_COLORS[topic.category] ?? CAT_COLORS.Custom;

                      return (
                        <div
                          key={topic.id}
                          className={`topic-row ${done ? "topic-done" : ""}`}
                          onClick={() => !toggling && toggleTopic(topic)}
                        >
                          <div className={`topic-checkbox ${done ? "checked" : ""}`}>
                            {toggling ? "⋯" : done ? "✓" : ""}
                          </div>
                          <div className="topic-name">{topic.name}</div>
                          {topic.category && (
                            <span
                              className="topic-cat"
                              style={{
                                background: catStyle.bg,
                                color: catStyle.color,
                              }}
                            >
                              {topic.category}
                            </span>
                          )}
                          {topic.isCustom && (
                            <span className="topic-custom-badge">custom</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddTopics && (
        <AddTopicsModal
          trackerId={tracker.id}
          existingTopics={tracker.topics}
          onClose={() => setShowAddTopics(false)}
          onAdded={handleTopicsAdded}
        />
      )}

      <style>{`
        .prep-detail { max-width: 820px; }

        .pd-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .pd-company {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .pd-meta-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        /* Stats row */
        .pd-stats-row {
          display: flex;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .pd-stat {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 12px 18px;
          min-width: 90px;
        }
        .pd-stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          line-height: 1;
          color: var(--text-primary);
        }
        .pd-stat-label {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Accordion */
        .day-accordion {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .day-block {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .day-block:hover { border-color: var(--border-light); }
        .day-block-today {
          border-color: var(--accent-border) !important;
          box-shadow: 0 0 0 1px var(--accent-border);
        }
        .day-block-done { border-color: rgba(34,197,94,0.25) !important; }

        .day-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-card);
          border: none;
          cursor: pointer;
          gap: 12px;
          transition: background 0.1s;
        }
        .day-header:hover { background: var(--bg-hover); }

        .day-header-left { display: flex; flex-direction: column; gap: 2px; text-align: left; }
        .day-number {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .day-date {
          font-size: 11px;
          color: var(--text-muted);
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .today-badge {
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid var(--accent-border);
          border-radius: 20px;
          font-size: 9px;
          padding: 1px 6px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .overdue-badge {
          background: var(--red-dim);
          color: var(--red);
          border-radius: 20px;
          font-size: 9px;
          padding: 1px 6px;
          font-weight: 700;
        }

        .day-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .day-progress-mini {
          width: 60px;
          height: 4px;
          background: var(--bg-hover);
          border-radius: 4px;
          overflow: hidden;
        }
        .day-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }
        .day-count {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          min-width: 32px;
          text-align: right;
        }
        .day-chevron {
          font-size: 10px;
          color: var(--text-muted);
        }

        /* Topic rows */
        .day-topics {
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        .topic-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          cursor: pointer;
          border-bottom: 1px solid var(--border);
          transition: background 0.1s;
        }
        .topic-row:last-child { border-bottom: none; }
        .topic-row:hover { background: var(--bg-hover); }
        .topic-done { opacity: 0.6; }

        .topic-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid var(--border-light);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.15s;
          color: var(--green);
        }
        .topic-checkbox.checked {
          background: var(--green-dim);
          border-color: var(--green);
          color: var(--green);
        }

        .topic-name {
          flex: 1;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .topic-done .topic-name {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        .topic-cat {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .topic-custom-badge {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 20px;
          background: var(--bg-hover);
          border: 1px solid var(--border);
          color: var(--text-muted);
        }

        .pli-days {
          font-size: 11px;
          font-weight: 600;
          color: var(--green);
          background: var(--green-dim);
          padding: 2px 8px;
          border-radius: 20px;
        }
        .pli-days-urgent { color: var(--yellow); background: var(--yellow-dim); }
        .pli-days-over { color: var(--red); background: var(--red-dim); }
      `}</style>
    </div>
  );
}