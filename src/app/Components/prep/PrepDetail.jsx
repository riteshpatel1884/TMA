// "use client";
// // components/prep/PrepDetail.jsx
// import { useState, useMemo } from "react";
// import AddTopicsModal from "../AddJobModal";

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// function daysUntil(roundDate) {
//   if (!roundDate) return null;
//   const now = new Date();
//   now.setHours(0, 0, 0, 0);
//   const target = new Date(roundDate);
//   target.setHours(0, 0, 0, 0);
//   return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
// }

// function slotToDate(roundDate, daySlot, totalDays) {
//   if (!roundDate) return null;
//   const target = new Date(roundDate);
//   target.setHours(0, 0, 0, 0);
//   const d = new Date(target);
//   d.setDate(d.getDate() - (totalDays - 1) + (daySlot - 1));
//   return d;
// }

// function fmt(date) {
//   if (!date) return "";
//   return date.toLocaleDateString("en-IN", {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//   });
// }

// function todayStr() {
//   const d = new Date();
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// }

// function isTopicDone(topic) {
//   return topic.dailyLogs?.some((l) => l.completed) ?? false;
// }

// function groupByDay(topics) {
//   const map = new Map();
//   for (const t of topics) {
//     const slot = t.daySlot ?? 0;
//     if (!map.has(slot)) map.set(slot, []);
//     map.get(slot).push(t);
//   }
//   return [...map.entries()].sort((a, b) => a[0] - b[0]);
// }

// const CAT_COLORS = {
//   Quantitative: { bg: "var(--blue-dim)", color: "var(--blue)" },
//   Logical: { bg: "var(--yellow-dim)", color: "var(--yellow)" },
//   Verbal: { bg: "var(--green-dim)", color: "var(--green)" },
//   Custom: { bg: "var(--accent-dim)", color: "var(--accent)" },
// };

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function PrepDetail({ tracker: initialTracker, onDelete, onUpdate }) {
//   const [tracker, setTracker] = useState(initialTracker);
//   const [openDays, setOpenDays] = useState(() => {
//     // Auto-open today's day slot
//     const todayNum = new Date().setHours(0, 0, 0, 0);
//     return new Set([1]); // open day 1 by default
//   });
//   const [togglingId, setTogglingId] = useState(null);
//   const [showAddTopics, setShowAddTopics] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState(false);
//   const [deleting, setDeleting] = useState(false);

//   const totalDays = tracker.roundDate ? daysUntil(tracker.roundDate) : null;
//   const dl = daysUntil(tracker.roundDate);
//   const pct = tracker.totalTopics
//     ? Math.round((tracker.doneTopics / tracker.totalTopics) * 100)
//     : 0;

//   const grouped = useMemo(() => groupByDay(tracker.topics), [tracker.topics]);

//   const toggleDay = (slot) => {
//     setOpenDays((prev) => {
//       const next = new Set(prev);
//       next.has(slot) ? next.delete(slot) : next.add(slot);
//       return next;
//     });
//   };

//   const toggleTopic = async (topic) => {
//     const done = isTopicDone(topic);
//     setTogglingId(topic.id);
//     try {
//       const res = await fetch("/api/prep/log", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           topicId: topic.id,
//           logDate: todayStr(),
//           completed: !done,
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok) return;

//       // Optimistically update local state
//       setTracker((prev) => ({
//         ...prev,
//         doneTopics: data.doneTopics,
//         topics: prev.topics.map((t) => {
//           if (t.id !== topic.id) return t;
//           const filtered = (t.dailyLogs ?? []).filter(
//             (l) => l.logDate?.slice(0, 10) !== todayStr()
//           );
//           return {
//             ...t,
//             dailyLogs: !done
//               ? [...filtered, { completed: true, logDate: todayStr() }]
//               : filtered,
//           };
//         }),
//       }));
//     } finally {
//       setTogglingId(null);
//     }
//   };

//   const handleTopicsAdded = (updatedTracker) => {
//     setTracker(updatedTracker);
//     onUpdate(updatedTracker);
//     setShowAddTopics(false);
//   };

//   const handleDelete = async () => {
//     setDeleting(true);
//     await fetch(`/api/prep/${tracker.id}`, { method: "DELETE" });
//     onDelete(tracker.id);
//   };

//   return (
//     <div className="prep-detail">
//       {/* ── Header ── */}
//       <div className="pd-header">
//         <div>
//           <div className="pd-company">{tracker.companyName}</div>
//           <div className="pd-meta-row">
//             <span className="detail-chip">{tracker.roundName}</span>
//             {tracker.application && (
//               <span className="detail-chip detail-chip-blue">
//                 {tracker.application.role}
//               </span>
//             )}
//             {tracker.roundDate && (
//               <span className="detail-chip">
//                 {new Date(tracker.roundDate).toLocaleDateString("en-IN", {
//                   day: "numeric", month: "short", year: "numeric",
//                 })}
//               </span>
//             )}
//             {dl !== null && (
//               <span
//                 className={`pli-days ${dl <= 0 ? "pli-days-over" : dl <= 3 ? "pli-days-urgent" : ""}`}
//               >
//                 {dl <= 0 ? "Exam day!" : dl === 1 ? "Tomorrow!" : `${dl} days left`}
//               </span>
//             )}
//           </div>
//         </div>
//         <div style={{ display: "flex", gap: 8 }}>
//           <button className="btn-ghost" onClick={() => setShowAddTopics(true)}>
//             + Add Topics
//           </button>
//           {confirmDelete ? (
//             <>
//               <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
//                 {deleting ? "..." : "Confirm"}
//               </button>
//               <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
//               Delete
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ── Stats row ── */}
//       <div className="pd-stats-row">
//         <div className="pd-stat">
//           <div className="pd-stat-val stat-accent">{tracker.totalTopics}</div>
//           <div className="pd-stat-label">Total Topics</div>
//         </div>
//         <div className="pd-stat">
//           <div className="pd-stat-val stat-green">{tracker.doneTopics}</div>
//           <div className="pd-stat-label">Completed</div>
//         </div>
//         <div className="pd-stat">
//           <div className="pd-stat-val stat-yellow">
//             {tracker.totalTopics - tracker.doneTopics}
//           </div>
//           <div className="pd-stat-label">Remaining</div>
//         </div>
//         <div className="pd-stat">
//           <div className="pd-stat-val">{pct}%</div>
//           <div className="pd-stat-label">Progress</div>
//         </div>
//         {dl !== null && grouped.length > 0 && (
//           <div className="pd-stat">
//             <div className="pd-stat-val">
//               {Math.ceil(tracker.totalTopics / grouped.length)}
//             </div>
//             <div className="pd-stat-label">Topics/Day</div>
//           </div>
//         )}
//       </div>

//       {/* Master progress bar */}
//       <div style={{ marginBottom: 24 }}>
//         <div className="progress-bar-wrap" style={{ height: 8 }}>
//           <div
//             className="progress-bar"
//             style={{
//               width: `${pct}%`,
//               background:
//                 pct === 100
//                   ? "var(--green)"
//                   : pct > 50
//                   ? "var(--accent)"
//                   : "var(--yellow)",
//               transition: "width 0.4s ease",
//             }}
//           />
//         </div>
//       </div>

//       {tracker.notes && (
//         <div className="insight-box" style={{ marginBottom: 20 }}>
//           {tracker.notes}
//         </div>
//       )}

//       {/* ── Day accordion ── */}
//       {grouped.length === 0 ? (
//         <div className="empty-state">
//           <div className="empty-state-icon">📚</div>
//           <h3>No topics yet</h3>
//           <p>Click "Add Topics" to get started</p>
//         </div>
//       ) : (
//         <div className="day-accordion">
//           {grouped.map(([slot, topics]) => {
//             const slotDate = totalDays && tracker.roundDate
//               ? slotToDate(tracker.roundDate, slot, totalDays)
//               : null;
//             const doneCnt = topics.filter(isTopicDone).length;
//             const allDone = doneCnt === topics.length;
//             const isOpen = openDays.has(slot);
//             const isToday =
//               slotDate &&
//               slotDate.toDateString() === new Date().toDateString();
//             const isPast = slotDate && slotDate < new Date().setHours(0,0,0,0);

//             return (
//               <div
//                 key={slot}
//                 className={`day-block ${isToday ? "day-block-today" : ""} ${allDone ? "day-block-done" : ""}`}
//               >
//                 {/* Day header */}
//                 <button
//                   className="day-header"
//                   onClick={() => toggleDay(slot)}
//                 >
//                   <div className="day-header-left">
//                     <div className="day-number">
//                       {slot === 0 ? "Unscheduled" : `Day ${slot}`}
//                     </div>
//                     {slotDate && (
//                       <div className="day-date">
//                         {fmt(slotDate)}
//                         {isToday && (
//                           <span className="today-badge">TODAY</span>
//                         )}
//                         {isPast && !isToday && doneCnt < topics.length && (
//                           <span className="overdue-badge">OVERDUE</span>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                   <div className="day-header-right">
//                     <div className="day-progress-mini">
//                       <div
//                         className="day-progress-fill"
//                         style={{
//                           width: `${topics.length ? (doneCnt / topics.length) * 100 : 0}%`,
//                           background: allDone ? "var(--green)" : "var(--accent)",
//                         }}
//                       />
//                     </div>
//                     <span className="day-count">
//                       {doneCnt}/{topics.length}
//                     </span>
//                     <span className="day-chevron">{isOpen ? "▲" : "▼"}</span>
//                   </div>
//                 </button>

//                 {/* Topics list */}
//                 {isOpen && (
//                   <div className="day-topics">
//                     {topics.map((topic) => {
//                       const done = isTopicDone(topic);
//                       const toggling = togglingId === topic.id;
//                       const catStyle = CAT_COLORS[topic.category] ?? CAT_COLORS.Custom;

//                       return (
//                         <div
//                           key={topic.id}
//                           className={`topic-row ${done ? "topic-done" : ""}`}
//                           onClick={() => !toggling && toggleTopic(topic)}
//                         >
//                           <div className={`topic-checkbox ${done ? "checked" : ""}`}>
//                             {toggling ? "⋯" : done ? "✓" : ""}
//                           </div>
//                           <div className="topic-name">{topic.name}</div>
//                           {topic.category && (
//                             <span
//                               className="topic-cat"
//                               style={{
//                                 background: catStyle.bg,
//                                 color: catStyle.color,
//                               }}
//                             >
//                               {topic.category}
//                             </span>
//                           )}
//                           {topic.isCustom && (
//                             <span className="topic-custom-badge">custom</span>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {showAddTopics && (
//         <AddTopicsModal
//           trackerId={tracker.id}
//           existingTopics={tracker.topics}
//           onClose={() => setShowAddTopics(false)}
//           onAdded={handleTopicsAdded}
//         />
//       )}

//       <style>{`
//         .prep-detail { max-width: 820px; }

//         .pd-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           gap: 16px;
//           margin-bottom: 20px;
//           flex-wrap: wrap;
//         }
//         .pd-company {
//           font-family: 'Syne', sans-serif;
//           font-size: 22px;
//           font-weight: 800;
//           color: var(--text-primary);
//           margin-bottom: 6px;
//         }
//         .pd-meta-row {
//           display: flex;
//           gap: 6px;
//           flex-wrap: wrap;
//           align-items: center;
//         }

//         /* Stats row */
//         .pd-stats-row {
//           display: flex;
//           gap: 14px;
//           margin-bottom: 16px;
//           flex-wrap: wrap;
//         }
//         .pd-stat {
//           background: var(--bg-card);
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           padding: 12px 18px;
//           min-width: 90px;
//         }
//         .pd-stat-val {
//           font-family: 'Syne', sans-serif;
//           font-size: 26px;
//           font-weight: 800;
//           line-height: 1;
//           color: var(--text-primary);
//         }
//         .pd-stat-label {
//           font-size: 11px;
//           color: var(--text-muted);
//           margin-top: 4px;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//         }

//         /* Accordion */
//         .day-accordion {
//           display: flex;
//           flex-direction: column;
//           gap: 8px;
//         }
//         .day-block {
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           overflow: hidden;
//           transition: border-color 0.15s;
//         }
//         .day-block:hover { border-color: var(--border-light); }
//         .day-block-today {
//           border-color: var(--accent-border) !important;
//           box-shadow: 0 0 0 1px var(--accent-border);
//         }
//         .day-block-done { border-color: rgba(34,197,94,0.25) !important; }

//         .day-header {
//           width: 100%;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           padding: 12px 16px;
//           background: var(--bg-card);
//           border: none;
//           cursor: pointer;
//           gap: 12px;
//           transition: background 0.1s;
//         }
//         .day-header:hover { background: var(--bg-hover); }

//         .day-header-left { display: flex; flex-direction: column; gap: 2px; text-align: left; }
//         .day-number {
//           font-family: 'Syne', sans-serif;
//           font-size: 13px;
//           font-weight: 700;
//           color: var(--text-primary);
//         }
//         .day-date {
//           font-size: 11px;
//           color: var(--text-muted);
//           display: flex;
//           gap: 6px;
//           align-items: center;
//         }
//         .today-badge {
//           background: var(--accent-dim);
//           color: var(--accent);
//           border: 1px solid var(--accent-border);
//           border-radius: 20px;
//           font-size: 9px;
//           padding: 1px 6px;
//           font-weight: 700;
//           letter-spacing: 0.5px;
//         }
//         .overdue-badge {
//           background: var(--red-dim);
//           color: var(--red);
//           border-radius: 20px;
//           font-size: 9px;
//           padding: 1px 6px;
//           font-weight: 700;
//         }

//         .day-header-right {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           flex-shrink: 0;
//         }
//         .day-progress-mini {
//           width: 60px;
//           height: 4px;
//           background: var(--bg-hover);
//           border-radius: 4px;
//           overflow: hidden;
//         }
//         .day-progress-fill {
//           height: 100%;
//           border-radius: 4px;
//           transition: width 0.3s;
//         }
//         .day-count {
//           font-size: 12px;
//           font-weight: 600;
//           color: var(--text-muted);
//           min-width: 32px;
//           text-align: right;
//         }
//         .day-chevron {
//           font-size: 10px;
//           color: var(--text-muted);
//         }

//         /* Topic rows */
//         .day-topics {
//           border-top: 1px solid var(--border);
//           display: flex;
//           flex-direction: column;
//         }
//         .topic-row {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 10px 16px;
//           cursor: pointer;
//           border-bottom: 1px solid var(--border);
//           transition: background 0.1s;
//         }
//         .topic-row:last-child { border-bottom: none; }
//         .topic-row:hover { background: var(--bg-hover); }
//         .topic-done { opacity: 0.6; }

//         .topic-checkbox {
//           width: 18px;
//           height: 18px;
//           border: 2px solid var(--border-light);
//           border-radius: 4px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 11px;
//           font-weight: 700;
//           flex-shrink: 0;
//           transition: all 0.15s;
//           color: var(--green);
//         }
//         .topic-checkbox.checked {
//           background: var(--green-dim);
//           border-color: var(--green);
//           color: var(--green);
//         }

//         .topic-name {
//           flex: 1;
//           font-size: 13px;
//           color: var(--text-secondary);
//         }
//         .topic-done .topic-name {
//           text-decoration: line-through;
//           color: var(--text-muted);
//         }
//         .topic-cat {
//           font-size: 10px;
//           padding: 2px 8px;
//           border-radius: 20px;
//           font-weight: 600;
//           text-transform: uppercase;
//           letter-spacing: 0.4px;
//         }
//         .topic-custom-badge {
//           font-size: 10px;
//           padding: 2px 7px;
//           border-radius: 20px;
//           background: var(--bg-hover);
//           border: 1px solid var(--border);
//           color: var(--text-muted);
//         }

//         .pli-days {
//           font-size: 11px;
//           font-weight: 600;
//           color: var(--green);
//           background: var(--green-dim);
//           padding: 2px 8px;
//           border-radius: 20px;
//         }
//         .pli-days-urgent { color: var(--yellow); background: var(--yellow-dim); }
//         .pli-days-over { color: var(--red); background: var(--red-dim); }
//       `}</style>
//     </div>
//   );
// }




"use client";
// components/prep/PrepDetail.jsx
import { useState, useMemo } from "react";
import AddTopicsModal from "../applications/AddJobModal";

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

function barColor(pct) {
  if (pct === 100) return "var(--green)";
  if (pct > 50) return "var(--accent)";
  return "var(--yellow)";
}

const CAT_COLORS = {
  Quantitative: { bg: "var(--blue-dim)",   color: "var(--blue)"   },
  Logical:      { bg: "var(--yellow-dim)", color: "var(--yellow)" },
  Verbal:       { bg: "var(--green-dim)",  color: "var(--green)"  },
  Custom:       { bg: "var(--accent-dim)", color: "var(--accent)" },
};

// ─── Mini SVG ring ────────────────────────────────────────────────────────────

function RingProgress({ pct, done, total }) {
  const r = 11;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color =
    pct === 100 ? "var(--green)" : pct > 0 ? "var(--accent)" : "var(--border-light)";

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx="16" cy="16" r={r} fill="none" stroke="var(--bg-surface)" strokeWidth="3" />
      <circle
        cx="16" cy="16" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrepDetail({ tracker: initialTracker, onDelete, onUpdate }) {
  const [tracker, setTracker] = useState(initialTracker);
  const [openDays, setOpenDays] = useState(new Set([1]));
  const [togglingId, setTogglingId] = useState(null);
  const [showAddTopics, setShowAddTopics] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dl = daysUntil(tracker.roundDate);
  const pct = tracker.totalTopics
    ? Math.round((tracker.doneTopics / tracker.totalTopics) * 100)
    : 0;

  const grouped = useMemo(() => groupByDay(tracker.topics), [tracker.topics]);
  const totalDays = grouped.length;

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
        body: JSON.stringify({ topicId: topic.id, logDate: todayStr(), completed: !done }),
      });
      const data = await res.json();
      if (!res.ok) return;

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

  // Day chip style
  let dayChipClass = "chip-green";
  let dayChipTxt = `${dl} days left`;
  if (dl !== null && dl <= 0) { dayChipClass = "chip-red"; dayChipTxt = "Exam day!"; }
  else if (dl !== null && dl <= 3) { dayChipClass = "chip-yellow"; dayChipTxt = `${dl} day${dl === 1 ? "" : "s"} left`; }

  return (
    <div className="prep-detail">

      {/* ── Header ── */}
      <div className="pd-header">
        <div className="pd-header-left">
          <h1 className="pd-company">{tracker.companyName}</h1>
          <div className="pd-chips">
            <span className="pd-chip chip-accent">{tracker.roundName}</span>
            {tracker.application && (
              <span className="pd-chip chip-blue">{tracker.application.role}</span>
            )}
            {tracker.roundDate && (
              <span className="pd-chip">
                {new Date(tracker.roundDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
            {dl !== null && (
              <span className={`pd-chip ${dayChipClass}`}>{dayChipTxt}</span>
            )}
          </div>
        </div>

        <div className="pd-actions">
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
        {[
          { label: "Total Topics", val: tracker.totalTopics, cls: "s-accent v-accent" },
          { label: "Completed",    val: tracker.doneTopics,  cls: "s-green v-green"   },
          { label: "Remaining",    val: tracker.totalTopics - tracker.doneTopics, cls: "s-yellow v-yellow" },
          { label: "Progress",     val: `${pct}%`, cls: "s-default" },
          ...(totalDays > 0 ? [{ label: "Topics / Day", val: Math.ceil(tracker.totalTopics / totalDays), cls: "s-default" }] : []),
        ].map(({ label, val, cls }) => (
          <div key={label} className={`pd-stat ${cls}`}>
            <div className="pd-stat-label">{label}</div>
            <div className={`pd-stat-val ${cls.split(" ")[1] ?? ""}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* ── Master progress ── */}
      <div className="pd-master-prog">
        <div className="pd-prog-meta">
          <span>{pct === 100 ? "🎉 All done!" : `${pct}% complete`}</span>
          <span>{tracker.doneTopics} / {tracker.totalTopics}</span>
        </div>
        <div className="pd-prog-track">
          <div
            className="pd-prog-fill"
            style={{ width: `${pct}%`, background: barColor(pct) }}
          />
        </div>
      </div>

      {/* ── Notes ── */}
      {tracker.notes && (
        <div className="pd-notes">
          <span className="pd-notes-icon">💡</span>
          <span>{tracker.notes}</span>
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
            const isToday = slotDate && slotDate.toDateString() === new Date().toDateString();
            const isPast = slotDate && slotDate < new Date().setHours(0, 0, 0, 0);
            const ringPct = topics.length ? Math.round((doneCnt / topics.length) * 100) : 0;

            // Day number badge class
            let dayBadgeCls = "day-num-badge";
            if (isToday)  dayBadgeCls += " dnb-today";
            if (allDone)  dayBadgeCls += " dnb-done";

            return (
              <div
                key={slot}
                className={`day-block ${isToday ? "day-today" : ""} ${allDone ? "day-done" : ""}`}
              >
                {/* Day header */}
                <button className="day-header" onClick={() => toggleDay(slot)}>
                  <div className="dh-left">
                    <span className={dayBadgeCls}>
                      {slot === 0 ? "Unscheduled" : `Day ${slot}`}
                    </span>
                    <div className="dh-date-col">
                      <div className="dh-date">
                        {slotDate ? fmt(slotDate) : "Unscheduled"}
                        {isToday && <span className="today-badge">Today</span>}
                        {isPast && !isToday && doneCnt < topics.length && (
                          <span className="overdue-badge">Overdue</span>
                        )}
                      </div>
                      <div className="dh-sub">{doneCnt}/{topics.length} done</div>
                    </div>
                  </div>

                  <div className="dh-right">
                    <RingProgress pct={ringPct} done={doneCnt} total={topics.length} />
                    <span className="day-count">{doneCnt}/{topics.length}</span>
                    <span className={`day-chevron ${isOpen ? "open" : ""}`}>▼</span>
                  </div>
                </button>

                {/* Topics */}
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
                              style={{ background: catStyle.bg, color: catStyle.color }}
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
        .prep-detail { max-width: 840px; }

        /* ── Header ── */
        .pd-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .pd-company {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          line-height: 1;
          margin-bottom: 10px;
        }
        .pd-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }

        .pd-chip {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          background: var(--bg-surface);
        }
        .chip-accent { background: var(--accent-dim);  border-color: var(--accent-border); color: var(--accent); }
        .chip-blue   { background: var(--blue-dim);    border-color: rgba(59,130,246,.25);  color: var(--blue);   }
        .chip-green  { background: var(--green-dim);   border-color: rgba(34,197,94,.25);   color: var(--green);  }
        .chip-yellow { background: var(--yellow-dim);  border-color: rgba(234,179,8,.25);   color: var(--yellow); }
        .chip-red    { background: var(--red-dim);     border-color: rgba(239,68,68,.25);   color: var(--red);    }

        .pd-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

        /* ── Stats ── */
        .pd-stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }
        .pd-stat {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.15s, transform 0.15s;
        }
        .pd-stat:hover { border-color: var(--border-light); transform: translateY(-2px); }

        /* Colored top-edge accent */
        .pd-stat::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 2px 2px 0 0;
        }
        .s-accent::after { background: var(--accent); }
        .s-green::after  { background: var(--green);  }
        .s-yellow::after { background: var(--yellow); }
        .s-default::after { background: var(--border-light); }

        .pd-stat-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.7px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .pd-stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
          color: var(--text-primary);
        }
        .v-accent { color: var(--accent); }
        .v-green  { color: var(--green);  }
        .v-yellow { color: var(--yellow); }

        /* ── Progress bar ── */
        .pd-master-prog { margin-bottom: 24px; }
        .pd-prog-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .pd-prog-track {
          height: 6px;
          background: var(--bg-surface);
          border-radius: 6px;
          overflow: hidden;
        }
        .pd-prog-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.6s cubic-bezier(.4,0,.2,1);
        }

        /* ── Notes ── */
        .pd-notes {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 24px;
        }
        .pd-notes-icon { color: var(--accent); flex-shrink: 0; margin-top: 2px; }

        /* ── Accordion ── */
        .day-accordion { display: flex; flex-direction: column; gap: 8px; }

        .day-block {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--bg-card);
          transition: border-color 0.15s;
        }
        .day-block:hover { border-color: var(--border-light); }
        .day-today { border-color: var(--accent-border) !important; box-shadow: 0 0 0 1px var(--accent-border); }
        .day-done  { border-color: rgba(34,197,94,.2) !important; }

        .day-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 16px;
          background: none;
          border: none;
          cursor: pointer;
          gap: 12px;
          transition: background 0.1s;
        }
        .day-header:hover { background: var(--bg-hover); }

        .dh-left { display: flex; align-items: center; gap: 12px; text-align: left; }

        .day-num-badge {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .dnb-today {
          background: var(--accent-dim);
          border-color: var(--accent-border);
          color: var(--accent);
        }
        .dnb-done {
          background: var(--green-dim);
          border-color: rgba(34,197,94,.25);
          color: var(--green);
        }

        .dh-date-col { display: flex; flex-direction: column; gap: 1px; }
        .dh-date {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .dh-sub { font-size: 11px; color: var(--text-muted); }

        .today-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
          padding: 1px 7px;
          border-radius: 20px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          color: var(--accent);
          text-transform: uppercase;
        }
        .overdue-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
          padding: 1px 7px;
          border-radius: 20px;
          background: var(--red-dim);
          color: var(--red);
          text-transform: uppercase;
        }

        .dh-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .day-count { font-size: 11px; font-weight: 600; color: var(--text-muted); min-width: 30px; text-align: right; }
        .day-chevron { font-size: 10px; color: var(--text-muted); transition: transform 0.2s; }
        .day-chevron.open { transform: rotate(180deg); }

        /* ── Topics ── */
        .day-topics {
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          animation: slideDown 0.18s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .topic-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          cursor: pointer;
          border-bottom: 1px solid var(--border);
          transition: background 0.1s;
        }
        .topic-row:last-child { border-bottom: none; }
        .topic-row:hover { background: var(--bg-hover); }
        .topic-done { opacity: 0.55; }

        .topic-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border-light);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.2s;
          color: var(--green);
        }
        .topic-checkbox.checked {
          background: var(--green-dim);
          border-color: rgba(34,197,94,.4);
          color: var(--green);
        }

        .topic-name { flex: 1; font-size: 13px; color: var(--text-secondary); }
        .topic-done .topic-name { text-decoration: line-through; color: var(--text-muted); }

        .topic-cat {
          font-size: 10px;
          padding: 2px 9px;
          border-radius: 20px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .topic-custom-badge {
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 20px;
          background: var(--bg-hover);
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}