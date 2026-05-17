// "use client";

// const PRIORITY_COLORS = {
//   High: { color: "var(--red)", bg: "var(--red-dim)" },
//   Medium: { color: "var(--yellow)", bg: "var(--yellow-dim)" },
//   Low: { color: "var(--green)", bg: "var(--green-dim)" },
// };

// function DetailRow({ label, value, valueStyle }) {
//   if (!value && value !== 0) return null;
//   return (
//     <div className="detail-row">
//       <span className="detail-label">{label}</span>
//       <span className="detail-value" style={valueStyle}>
//         {value}
//       </span>
//     </div>
//   );
// }

// function DetailSection({ title, children }) {
//   return (
//     <div className="detail-section">
//       <div className="detail-section-title">{title}</div>
//       {children}
//     </div>
//   );
// }

// export default function ApplicationDetailModal({ app, onClose, onEdit }) {
//   if (!app) return null;

//   const now = new Date();

//   const getDaysSince = (dateStr) => {
//     if (!dateStr) return null;
//     const days = Math.round(
//       (now - new Date(dateStr)) / (1000 * 60 * 60 * 24),
//     );
//     if (days === 0) return "Today";
//     if (days === 1) return "1 day ago";
//     return `${days} days ago`;
//   };

//   const isFollowUpDue =
//     app.followUpDate &&
//     app.status === "Applied" &&
//     new Date(app.followUpDate) <= now;

//   const daysSinceApplied = app.dateApplied
//     ? Math.round(
//         (now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24),
//       )
//     : null;

//   const statusClass = `badge badge-${app.status?.toLowerCase()}`;

//   return (
//     <div
//       className="modal-overlay"
//       onClick={(e) => e.target === e.currentTarget && onClose()}
//     >
//       <div className="modal detail-modal">
//         {/* Header */}
//         <div className="detail-modal-header">
//           <div className="detail-header-left">
//             <div className="detail-company-logo">
//               {app.company?.charAt(0).toUpperCase()}
//             </div>
//             <div>
//               <div className="detail-company-name">
//                 {app.company}
//                 {app.applyType === "Referral" && (
//                   <span className="tag-ref">REF</span>
//                 )}
//                 {app.applyType === "Cold Apply" && (
//                   <span className="tag-cold">COLD</span>
//                 )}
//               </div>
//               <div className="detail-role">{app.role}</div>
//               <div
//                 style={{
//                   display: "flex",
//                   gap: 8,
//                   marginTop: 8,
//                   flexWrap: "wrap",
//                 }}
//               >
//                 <span className={statusClass}>{app.status}</span>
//                 {app.jobType && (
//                   <span className="detail-chip detail-chip-blue">
//                     {app.jobType}
//                   </span>
//                 )}
//                 {app.workType && (
//                   <span className="detail-chip">{app.workType}</span>
//                 )}
//                 {app.priority && (
//                   <span
//                     style={{
//                       fontSize: 11,
//                       padding: "3px 10px",
//                       borderRadius: 20,
//                       fontWeight: 600,
//                       background: PRIORITY_COLORS[app.priority]?.bg,
//                       color: PRIORITY_COLORS[app.priority]?.color,
//                     }}
//                   >
//                     {app.priority} Priority
//                   </span>
//                 )}
//               </div>
//             </div>
//           </div>
//           <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
//             <button
//               className="btn-ghost"
//               style={{ fontSize: 12, padding: "6px 14px" }}
//               onClick={() => {
//                 onClose();
//                 onEdit(app);
//               }}
//             >
//               Edit
//             </button>
//             <button className="modal-close" onClick={onClose}>
//               &times;
//             </button>
//           </div>
//         </div>

//         <div className="detail-modal-body">
//           {/* Follow-up alert */}
//           {isFollowUpDue && (
//             <div className="detail-alert">
//               &#9889; Follow-up is due &mdash;{" "}
//               {new Date(app.followUpDate).toLocaleDateString("en-IN", {
//                 day: "2-digit",
//                 month: "short",
//                 year: "numeric",
//               })}
//             </div>
//           )}

//           <div className="detail-grid">
//             {/* Left column */}
//             <div>
//               <DetailSection title="Application Info">
//                 <DetailRow label="Platform" value={app.platform} />
//                 <DetailRow label="Apply Method" value={app.applyType} />
//                 <DetailRow
//                   label="Date Applied"
//                   value={
//                     app.dateApplied
//                       ? new Date(app.dateApplied).toLocaleDateString("en-IN", {
//                           day: "2-digit",
//                           month: "long",
//                           year: "numeric",
//                         })
//                       : null
//                   }
//                 />
//                 <DetailRow
//                   label="Response Time"
//                   value={
//                     app.status === "Applied" && daysSinceApplied !== null
//                       ? `${daysSinceApplied} days (no response yet)`
//                       : null
//                   }
//                   valueStyle={{
//                     color:
//                       daysSinceApplied > 14
//                         ? "var(--red)"
//                         : daysSinceApplied > 7
//                           ? "var(--yellow)"
//                           : "var(--text-secondary)",
//                   }}
//                 />
//                 <DetailRow label="Added" value={getDaysSince(app.createdAt)} />
//               </DetailSection>

//               <DetailSection title="Compensation">
//                 <DetailRow
//                   label="Salary / Stipend"
//                   value={app.salary}
//                   valueStyle={{ color: "var(--green)", fontWeight: 600 }}
//                 />
//                 {!app.salary && (
//                   <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
//                     Not specified
//                   </div>
//                 )}
//               </DetailSection>

//               <DetailSection title="Follow-up">
//                 <DetailRow
//                   label="Next Follow-up"
//                   value={
//                     app.followUpDate
//                       ? new Date(app.followUpDate).toLocaleDateString("en-IN", {
//                           day: "2-digit",
//                           month: "long",
//                           year: "numeric",
//                         })
//                       : null
//                   }
//                   valueStyle={
//                     isFollowUpDue
//                       ? { color: "var(--yellow)", fontWeight: 600 }
//                       : {}
//                   }
//                 />
//                 {!app.followUpDate && (
//                   <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
//                     Not set
//                   </div>
//                 )}
//               </DetailSection>
//             </div>

//             {/* Right column */}
//             <div>
//               <DetailSection title="Recruiter Info">
//                 {app.recruiterName || app.recruiterContact ? (
//                   <>
//                     <DetailRow label="Name" value={app.recruiterName} />
//                     {app.recruiterContact && (
//                       <div className="detail-row">
//                         <span className="detail-label">Contact</span>
//                         <span className="detail-value">
//                           {app.recruiterContact.startsWith("http") ? (
//                             <a
//                               href={app.recruiterContact}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               style={{ color: "var(--accent)" }}
//                             >
//                               LinkedIn &#8599;
//                             </a>
//                           ) : (
//                             <a
//                               href={`mailto:${app.recruiterContact}`}
//                               style={{ color: "var(--accent)" }}
//                             >
//                               {app.recruiterContact}
//                             </a>
//                           )}
//                         </span>
//                       </div>
//                     )}
//                   </>
//                 ) : (
//                   <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
//                     No recruiter info added
//                   </div>
//                 )}
//               </DetailSection>

//               <DetailSection title="Resume &amp; Links">
//                 <DetailRow label="Resume Version" value={app.resumeVersion} />
//                 {app.jobLink && (
//                   <div className="detail-row">
//                     <span className="detail-label">Job Link</span>
//                     <span className="detail-value">
//                       <a
//                         href={app.jobLink}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         style={{ color: "var(--accent)" }}
//                       >
//                         View Posting &#8599;
//                       </a>
//                     </span>
//                   </div>
//                 )}
//                 {app.attachmentLink && (
//                   <div className="detail-row">
//                     <span className="detail-label">Attachment</span>
//                     <span className="detail-value">
//                       <a
//                         href={app.attachmentLink}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         style={{ color: "var(--accent)" }}
//                       >
//                         Open Link &#8599;
//                       </a>
//                     </span>
//                   </div>
//                 )}
//                 {!app.resumeVersion && !app.jobLink && !app.attachmentLink && (
//                   <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
//                     No links added
//                   </div>
//                 )}
//               </DetailSection>
//             </div>
//           </div>

//           {/* Status History */}
//           {app.statusHistory && app.statusHistory.length > 0 && (
//             <DetailSection title="Status History">
//               <div className="status-timeline">
//                 {app.statusHistory.map((entry, i) => (
//                   <div key={i} className="timeline-entry">
//                     <div
//                       className={`timeline-dot dot-${entry.status?.toLowerCase()}`}
//                     />
//                     <div className="timeline-content">
//                       <span
//                         className={`badge badge-${entry.status?.toLowerCase()}`}
//                         style={{ fontSize: 10 }}
//                       >
//                         {entry.status}
//                       </span>
//                       <span
//                         style={{
//                           fontSize: 11,
//                           color: "var(--text-muted)",
//                           marginLeft: 8,
//                         }}
//                       >
//                         {new Date(entry.date).toLocaleDateString("en-IN", {
//                           day: "2-digit",
//                           month: "short",
//                           year: "numeric",
//                         })}
//                         {" \u00b7 "}
//                         {getDaysSince(entry.date)}
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </DetailSection>
//           )}

//           {/* Notes */}
//           {app.notes && (
//             <DetailSection title="Notes">
//               <div className="detail-notes">{app.notes}</div>
//             </DetailSection>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

function DetailRow({ label, value, valueStyle }) {
  if (!value && value !== 0) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value" style={valueStyle}>
        {value}
      </span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">{title}</div>
      {children}
    </div>
  );
}

const REJECTION_REASON_COLORS = {
  "Failed aptitude/OA": "#eab308",
  "Failed technical round": "#ef4444",
  "Failed HR round": "#f97316",
  "No response": "#6b7280",
};

export default function ApplicationDetailModal({ app, onClose, onEdit }) {
  if (!app) return null;

  const now = new Date();

  const getDaysSince = (dateStr) => {
    if (!dateStr) return null;
    const days = Math.round(
      (now - new Date(dateStr)) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const isFollowUpDue =
    app.followUpDate &&
    app.status === "Applied" &&
    new Date(app.followUpDate) <= now;

  const daysSinceApplied = app.dateApplied
    ? Math.round((now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24))
    : null;

  const statusClass = `badge badge-${app.status?.toLowerCase()}`;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal detail-modal">
        {/* Header */}
        <div className="detail-modal-header">
          <div className="detail-header-left">
            <div className="detail-company-logo">
              {app.company?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="detail-company-name">
                {app.company}
                {app.applyType === "Referral" && (
                  <span className="tag-ref">REF</span>
                )}
                {app.applyType === "Cold Apply" && (
                  <span className="tag-cold">COLD</span>
                )}
              </div>
              <div className="detail-role">{app.role}</div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                <span className={statusClass}>{app.status}</span>
                {app.jobType && (
                  <span className="detail-chip detail-chip-blue">
                    {app.jobType}
                  </span>
                )}
                {app.workType && (
                  <span className="detail-chip">{app.workType}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => {
                onClose();
                onEdit(app);
              }}
            >
              Edit
            </button>
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        <div className="detail-modal-body">
          {/* Follow-up alert */}
          {isFollowUpDue && (
            <div className="detail-alert">
              &#9889; Follow-up is due &mdash;{" "}
              {new Date(app.followUpDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}

          {/* Rejection reason banner */}
          {app.status === "Rejected" && app.rejectionReason && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: 13,
                color: REJECTION_REASON_COLORS[app.rejectionReason] || "#ef4444",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>✗</span>
              <span>
                Rejected: <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>{app.rejectionReason}</span>
              </span>
            </div>
          )}

          <div className="detail-grid">
            {/* Left column */}
            <div>
              <DetailSection title="Application Info">
                <DetailRow label="Platform" value={app.platform} />
                <DetailRow label="Apply Method" value={app.applyType} />
                <DetailRow
                  label="Date Applied"
                  value={
                    app.dateApplied
                      ? new Date(app.dateApplied).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : null
                  }
                />
                <DetailRow
                  label="Response Time"
                  value={
                    app.status === "Applied" && daysSinceApplied !== null
                      ? `${daysSinceApplied} days (no response yet)`
                      : null
                  }
                  valueStyle={{
                    color:
                      daysSinceApplied > 14
                        ? "var(--red)"
                        : daysSinceApplied > 7
                          ? "var(--yellow)"
                          : "var(--text-secondary)",
                  }}
                />
                <DetailRow label="Added" value={getDaysSince(app.createdAt)} />
              </DetailSection>

              <DetailSection title="Compensation">
                <DetailRow
                  label="Salary / Stipend"
                  value={app.salary}
                  valueStyle={{ color: "var(--green)", fontWeight: 600 }}
                />
                {!app.salary && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Not specified
                  </div>
                )}
              </DetailSection>

              <DetailSection title="Follow-up">
                <DetailRow
                  label="Next Follow-up"
                  value={
                    app.followUpDate
                      ? new Date(app.followUpDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : null
                  }
                  valueStyle={
                    isFollowUpDue
                      ? { color: "var(--yellow)", fontWeight: 600 }
                      : {}
                  }
                />
                {!app.followUpDate && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Not set
                  </div>
                )}
              </DetailSection>
            </div>

            {/* Right column */}
            <div>
              <DetailSection title="Resume &amp; Links">
                <DetailRow label="Resume Version" value={app.resumeVersion} />
                {app.jobLink && (
                  <div className="detail-row">
                    <span className="detail-label">Job Link</span>
                    <span className="detail-value">
                      <a
                        href={app.jobLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--accent)" }}
                      >
                        View Posting &#8599;
                      </a>
                    </span>
                  </div>
                )}
                {!app.resumeVersion && !app.jobLink && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    No links added
                  </div>
                )}
              </DetailSection>

              {app.status === "Rejected" && (
                <DetailSection title="Rejection">
                  <DetailRow
                    label="Reason"
                    value={app.rejectionReason || "Not specified"}
                    valueStyle={
                      app.rejectionReason
                        ? {
                            color:
                              REJECTION_REASON_COLORS[app.rejectionReason] ||
                              "var(--red)",
                            fontWeight: 600,
                          }
                        : { color: "var(--text-muted)" }
                    }
                  />
                </DetailSection>
              )}
            </div>
          </div>

          {/* Status History */}
          {app.statusHistory && app.statusHistory.length > 0 && (
            <DetailSection title="Status History">
              <div className="status-timeline">
                {app.statusHistory.map((entry, i) => (
                  <div key={i} className="timeline-entry">
                    <div
                      className={`timeline-dot dot-${entry.status?.toLowerCase()}`}
                    />
                    <div className="timeline-content">
                      <span
                        className={`badge badge-${entry.status?.toLowerCase()}`}
                        style={{ fontSize: 10 }}
                      >
                        {entry.status}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginLeft: 8,
                        }}
                      >
                        {new Date(entry.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        {" \u00b7 "}
                        {getDaysSince(entry.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Notes */}
          {app.notes && (
            <DetailSection title="Notes">
              <div className="detail-notes">{app.notes}</div>
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}