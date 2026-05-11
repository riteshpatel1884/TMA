// "use client";
// // components/prep/PrepList.jsx

// function daysLeft(roundDate) {
//   if (!roundDate) return null;
//   const now = new Date();
//   now.setHours(0, 0, 0, 0);
//   const target = new Date(roundDate);
//   target.setHours(0, 0, 0, 0);
//   return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
// }

// function progressPct(tracker) {
//   if (!tracker.totalTopics) return 0;
//   return Math.round((tracker.doneTopics / tracker.totalTopics) * 100);
// }

// export default function PrepList({ trackers, loading, activeId, onSelect }) {
//   if (loading) {
//     return (
//       <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>
//         Loading...
//       </div>
//     );
//   }

//   if (!trackers.length) {
//     return (
//       <div className="empty-state" style={{ padding: "40px 20px" }}>
//         <div className="empty-state-icon">🎯</div>
//         <h3>No trackers yet</h3>
//         <p>Create one to start planning your prep</p>
//       </div>
//     );
//   }

//   return (
//     <div className="prep-list">
//       {trackers.map((t) => {
//         const pct = progressPct(t);
//         const dl = daysLeft(t.roundDate);
//         const isActive = t.id === activeId;

//         return (
//           <button
//             key={t.id}
//             className={`prep-list-item ${isActive ? "active" : ""}`}
//             onClick={() => onSelect(t.id)}
//           >
//             <div className="pli-top">
//               <div className="pli-company">{t.companyName}</div>
//               {dl !== null && (
//                 <div
//                   className={`pli-days ${
//                     dl <= 0
//                       ? "pli-days-over"
//                       : dl <= 3
//                       ? "pli-days-urgent"
//                       : ""
//                   }`}
//                 >
//                   {dl <= 0 ? "Today!" : `${dl}d left`}
//                 </div>
//               )}
//             </div>
//             <div className="pli-round">{t.roundName}</div>
//             <div className="pli-progress-wrap">
//               <div className="progress-bar-wrap">
//                 <div
//                   className="progress-bar"
//                   style={{
//                     width: `${pct}%`,
//                     background:
//                       pct === 100
//                         ? "var(--green)"
//                         : pct > 50
//                         ? "var(--accent)"
//                         : "var(--yellow)",
//                   }}
//                 />
//               </div>
//               <span className="pli-pct">{pct}%</span>
//             </div>
//             <div className="pli-meta">
//               {t.doneTopics}/{t.totalTopics} topics
//               {t.roundDate && (
//                 <span>
//                   {" · "}
//                   {new Date(t.roundDate).toLocaleDateString("en-IN", {
//                     day: "numeric",
//                     month: "short",
//                   })}
//                 </span>
//               )}
//             </div>
//           </button>
//         );
//       })}

//       <style>{`
//         .prep-list {
//           flex: 1;
//           overflow-y: auto;
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//           padding: 8px;
//         }
//         .prep-list-item {
//           width: 100%;
//           text-align: left;
//           background: none;
//           border: 1px solid transparent;
//           border-radius: var(--radius-sm);
//           padding: 12px 14px;
//           cursor: pointer;
//           transition: all 0.12s;
//           display: flex;
//           flex-direction: column;
//           gap: 5px;
//         }
//         .prep-list-item:hover {
//           background: var(--bg-hover);
//           border-color: var(--border);
//         }
//         .prep-list-item.active {
//           background: var(--accent-dim);
//           border-color: var(--accent-border);
//         }
//         .pli-top {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }
//         .pli-company {
//           font-family: 'Syne', sans-serif;
//           font-size: 13px;
//           font-weight: 700;
//           color: var(--text-primary);
//         }
//         .pli-days {
//           font-size: 11px;
//           font-weight: 600;
//           color: var(--green);
//           background: var(--green-dim);
//           padding: 2px 7px;
//           border-radius: 20px;
//         }
//         .pli-days-urgent {
//           color: var(--yellow);
//           background: var(--yellow-dim);
//         }
//         .pli-days-over {
//           color: var(--red);
//           background: var(--red-dim);
//         }
//         .pli-round {
//           font-size: 11px;
//           color: var(--text-muted);
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//         }
//         .pli-progress-wrap {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }
//         .pli-pct {
//           font-size: 11px;
//           font-weight: 600;
//           color: var(--text-muted);
//           width: 28px;
//           text-align: right;
//         }
//         .pli-meta {
//           font-size: 11px;
//           color: var(--text-muted);
//         }
//       `}</style>
//     </div>
//   );
// }



"use client";
// components/prep/PrepList.jsx

function daysLeft(roundDate) {
  if (!roundDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(roundDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function progressPct(tracker) {
  if (!tracker.totalTopics) return 0;
  return Math.round((tracker.doneTopics / tracker.totalTopics) * 100);
}

function barColor(pct) {
  if (pct === 100) return "var(--green)";
  if (pct > 50) return "var(--accent)";
  return "var(--yellow)";
}

export default function PrepList({ trackers, loading, activeId, onSelect }) {
  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            height: 72, borderRadius: "var(--radius-sm)",
            background: "var(--bg-surface)",
            marginBottom: 4,
            animation: "pulse 1.6s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
      </div>
    );
  }

  if (!trackers.length) {
    return (
      <div className="empty-state" style={{ padding: "40px 20px" }}>
        <div className="empty-state-icon">🎯</div>
        <h3>No trackers yet</h3>
        <p>Create one to start planning your prep</p>
      </div>
    );
  }

  return (
    <div className="prep-list">
      {trackers.map((t) => {
        const pct = progressPct(t);
        const dl = daysLeft(t.roundDate);
        const isActive = t.id === activeId;

        let pillClass = "pli-days-ok";
        let pillTxt = "";
        if (dl !== null) {
          pillTxt = dl <= 0 ? "Today!" : `${dl}d left`;
          if (dl <= 0) pillClass = "pli-days-over";
          else if (dl <= 3) pillClass = "pli-days-urgent";
        }

        return (
          <button
            key={t.id}
            className={`prep-list-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(t.id)}
          >
            {/* Active left accent bar */}
            {isActive && <span className="pli-accent-bar" />}

            <div className="pli-top">
              <div className="pli-company">{t.companyName}</div>
              {dl !== null && (
                <div className={`pli-days ${pillClass}`}>{pillTxt}</div>
              )}
            </div>

            <div className="pli-round">{t.roundName}</div>

            <div className="pli-progress-wrap">
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar"
                  style={{ width: `${pct}%`, background: barColor(pct) }}
                />
              </div>
              <span className="pli-pct">{pct}%</span>
            </div>

            <div className="pli-meta">
              {t.doneTopics}/{t.totalTopics} topics
              {t.roundDate && (
                <span>
                  {" · "}
                  {new Date(t.roundDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          </button>
        );
      })}

      <style>{`
        .prep-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px;
        }

        .prep-list-item {
          width: 100%;
          text-align: left;
          background: none;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          cursor: pointer;
          transition: background 0.13s, border-color 0.13s, transform 0.1s;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          overflow: hidden;
        }
        .prep-list-item:hover {
          background: var(--bg-hover);
          border-color: var(--border);
          transform: translateX(2px);
        }
        .prep-list-item.active {
          background: var(--accent-dim);
          border-color: var(--accent-border);
        }

        /* Left accent stripe on active item */
        .pli-accent-bar {
          position: absolute;
          left: 0; top: 18%; bottom: 18%;
          width: 3px;
          background: var(--accent);
          border-radius: 0 3px 3px 0;
        }

        .pli-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }
        .pli-company {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Day pills */
        .pli-days {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pli-days-ok     { background: var(--green-dim);  color: var(--green);  }
        .pli-days-urgent { background: var(--yellow-dim); color: var(--yellow); }
        .pli-days-over   { background: var(--red-dim);    color: var(--red);    }

        .pli-round {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 500;
        }

        .pli-progress-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pli-pct {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          min-width: 28px;
          text-align: right;
        }

        .pli-meta {
          font-size: 11px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}