"use client";

import React, { useState, useMemo } from "react";
import ApplicationDetailModal from "./ApplicationDetailModal";

const STATUSES = ["All", "Applied", "Interview", "Offer", "Rejected"];
const PLATFORMS = [
  "All",
  "LinkedIn",
  "Naukri",
  "Internshala",
  "Indeed",
  "Glassdoor",
  "AngelList",
  "Unstop",
  "HackerEarth",
  "Company Website",
  "Referral",
  "Other",
];
const WORK_TYPES = ["All", "Remote", "Onsite", "Hybrid"];
const JOB_TYPES = ["All", "Job", "Internship"];
const PRIORITIES = ["All", "High", "Medium", "Low"];
const GROUP_OPTIONS = ["None", "Company", "Status"];

const PRIORITY_COLORS = {
  High: { color: "var(--red)", bg: "var(--red-dim)" },
  Medium: { color: "var(--yellow)", bg: "var(--yellow-dim)" },
  Low: { color: "var(--green)", bg: "var(--green-dim)" },
};

const STATUS_STYLES = {
  Applied: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.25)",
  },
  Interview: {
    color: "#eab308",
    bg: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.25)",
  },
  Offer: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.25)",
  },
  Rejected: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.25)",
  },
};

// ── Custom Confirm Modal ──────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--bg-card, #1a1a2e)",
          border: "1px solid var(--border, rgba(255,255,255,0.08))",
          borderRadius: 16,
          padding: "28px 32px",
          maxWidth: 380,
          width: "90%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>
          🗑️
        </div>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text, #fff)",
            textAlign: "center",
          }}
        >
          Delete Application
        </h3>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "var(--text-muted, rgba(255,255,255,0.5))",
            textAlign: "center",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "1px solid var(--border, rgba(255,255,255,0.1))",
              background: "transparent",
              color: "var(--text-muted, rgba(255,255,255,0.5))",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "var(--bg-hover, rgba(255,255,255,0.06))")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quick Stats ───────────────────────────────────────────────────────────────
function QuickStats({ applications }) {
  const stats = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter(
      (a) => a.status === "Interview",
    ).length;
    const offers = applications.filter((a) => a.status === "Offer").length;
    const rejected = applications.filter((a) => a.status === "Rejected").length;
    const rate =
      total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0;

    const platformMap = {};
    applications.forEach((a) => {
      if (!a.platform || a.platform === "Other") return;
      if (!platformMap[a.platform])
        platformMap[a.platform] = { total: 0, responded: 0 };
      platformMap[a.platform].total++;
      if (a.status !== "Applied") platformMap[a.platform].responded++;
    });
    let bestPlatform = null,
      bestRate = 0;
    Object.entries(platformMap).forEach(([p, d]) => {
      if (d.total >= 2) {
        const r = Math.round((d.responded / d.total) * 100);
        if (r > bestRate) {
          bestRate = r;
          bestPlatform = p;
        }
      }
    });

    return {
      total,
      interviews,
      offers,
      rejected,
      rate,
      bestPlatform,
      bestRate,
    };
  }, [applications]);

  const cards = [
    { label: "Total Applied", value: stats.total, color: "#6c63ff" },
    { label: "Interviews", value: stats.interviews, color: "#eab308" },
    { label: "Offers", value: stats.offers, color: "#22c55e" },
    { label: "Rejected", value: stats.rejected, color: "#ef4444" },
    { label: "Success Rate", value: `${stats.rate}%`, color: "#3b82f6" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 16,
        flexWrap: "wrap",
        alignItems: "stretch",
      }}
    >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            flex: "1 1 90px",
            minWidth: 80,
            background: "var(--bg-card, rgba(255,255,255,0.04))",
            border: "1px solid var(--border, rgba(255,255,255,0.07))",
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: c.color,
              lineHeight: 1,
            }}
          >
            {c.value}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted, rgba(255,255,255,0.4))",
              fontWeight: 500,
            }}
          >
            {c.label}
          </div>
        </div>
      ))}
      {stats.bestPlatform && (
        <div
          style={{
            flex: "2 1 160px",
            minWidth: 140,
            background:
              "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(59,130,246,0.08))",
            border: "1px solid rgba(108,99,255,0.2)",
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 18 }}>🏅</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#a78bfa",
              lineHeight: 1,
            }}
          >
            {stats.bestPlatform}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted, rgba(255,255,255,0.4))",
              fontWeight: 500,
            }}
          >
            Best Platform &middot; {stats.bestRate}% response
          </div>
        </div>
      )}
    </div>
  );
}

// ── Response Health ───────────────────────────────────────────────────────────
function ResponseHealth({ daysSince, status }) {
  if (status !== "Applied" || daysSince === null) {
    return <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>;
  }
  if (daysSince < 3)
    return (
      <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>
        🟢 {daysSince}d
      </span>
    );
  if (daysSince <= 7)
    return (
      <span style={{ fontSize: 11, color: "#eab308", fontWeight: 600 }}>
        🟡 {daysSince}d
      </span>
    );
  return (
    <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
      🔴 {daysSince}d
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusSelect({ value, onChange }) {
  const s = STATUS_STYLES[value] || {};
  const arrowColor = encodeURIComponent(s.color || "#888");
  return (
    <select
      value={value}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 20px 3px 8px",
        borderRadius: 20,
        border: `1px solid ${s.border || "var(--border)"}`,
        backgroundColor: s.bg || "var(--bg-hover)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='${arrowColor}'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 6px center",
        backgroundSize: "10px 6px",
        color: s.color || "var(--text-muted)",
        cursor: "pointer",
        outline: "none",
        appearance: "none",
        WebkitAppearance: "none",
      }}
    >
      <option value="Applied">Applied</option>
      <option value="Interview">Interview</option>
      <option value="Offer">Offer</option>
      <option value="Rejected">Rejected</option>
    </select>
  );
}

// ── Tags Display ──────────────────────────────────────────────────────────────
function TagsList({ app }) {
  const tags = [];
  if (app.workType && app.workType !== "Onsite")
    tags.push({
      label: app.workType,
      icon: app.workType === "Remote" ? "🏠" : "🔀",
    });
  if (app.applyType === "Referral")
    tags.push({ label: "Referral", icon: "🤝" });
  if (app.tags && Array.isArray(app.tags))
    app.tags.forEach((t) => tags.push({ label: t, icon: "🏷️" }));
  if (!tags.length) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
      {tags.map((t, i) => (
        <span
          key={i}
          style={{
            fontSize: 10,
            padding: "1px 6px",
            borderRadius: 20,
            background: "var(--bg-hover, rgba(255,255,255,0.06))",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            whiteSpace: "nowrap",
          }}
        >
          {t.icon} {t.label}
        </span>
      ))}
    </div>
  );
}

// ── Next Action Cell ──────────────────────────────────────────────────────────
function NextAction({ app }) {
  const now = new Date();
  if (app.followUpDate) {
    const due = new Date(app.followUpDate);
    const isPast = due <= now;
    return (
      <div style={{ fontSize: 11 }}>
        <div style={{ color: isPast ? "#ef4444" : "#eab308", fontWeight: 600 }}>
          {isPast ? "⚡ Due" : "📅"}{" "}
          {due.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
        </div>
        {isPast && (
          <div style={{ color: "var(--text-muted)", fontSize: 10 }}>
            Follow-up
          </div>
        )}
      </div>
    );
  }
  return (
    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>No action</span>
  );
}

// ── Group Header ──────────────────────────────────────────────────────────────
function GroupHeader({ label, count }) {
  return (
    <tr>
      <td
        colSpan={10}
        style={{
          padding: "10px 14px",
          background: "var(--bg-hover, rgba(255,255,255,0.04))",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text-muted)",
          letterSpacing: "0.5px",
        }}
      >
        {label}{" "}
        <span style={{ fontWeight: 400, opacity: 0.6 }}>({count})</span>
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ApplicationsTable({
  applications,
  onUpdate,
  onDelete,
  onEdit,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [workTypeFilter, setWorkTypeFilter] = useState("All");
  const [jobTypeFilter, setJobTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [groupBy, setGroupBy] = useState("None");
  const [selectedApp, setSelectedApp] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Capture now once per render to avoid impure calls inside child renders
  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    return applications
      .filter((app) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          app.company.toLowerCase().includes(q) ||
          app.role.toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "All" || app.status === statusFilter;
        const matchPlatform =
          platformFilter === "All" || app.platform === platformFilter;
        const matchWork =
          workTypeFilter === "All" || app.workType === workTypeFilter;
        const matchJob =
          jobTypeFilter === "All" || app.jobType === jobTypeFilter;
        const matchPriority =
          priorityFilter === "All" || app.priority === priorityFilter;
        return (
          matchSearch &&
          matchStatus &&
          matchPlatform &&
          matchWork &&
          matchJob &&
          matchPriority
        );
      })
      .sort((a, b) => {
        if (sortBy === "date")
          return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "company") return a.company.localeCompare(b.company);
        if (sortBy === "status") return a.status.localeCompare(b.status);
        if (sortBy === "priority") {
          const order = { High: 0, Medium: 1, Low: 2 };
          return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
        }
        return 0;
      });
  }, [
    applications,
    search,
    statusFilter,
    platformFilter,
    workTypeFilter,
    jobTypeFilter,
    priorityFilter,
    sortBy,
  ]);

  const grouped = useMemo(() => {
    if (groupBy === "None") return [{ key: null, items: filtered }];
    const map = {};
    filtered.forEach((app) => {
      const key = groupBy === "Company" ? app.company : app.status;
      if (!map[key]) map[key] = [];
      map[key].push(app);
    });
    return Object.entries(map).map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  const getDaysAgo = (dateStr) => {
    if (!dateStr) return null;
    const days = Math.round(
      (now - new Date(dateStr)) / (1000 * 60 * 60 * 24),
    );
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  };

  const getDaysSince = (dateStr) => {
    if (!dateStr) return null;
    return Math.round((now - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  };

  const isFollowUpDue = (app) => {
    if (!app.followUpDate || app.status !== "Applied") return false;
    return new Date(app.followUpDate) <= now;
  };

  const followUpDueCount = filtered.filter(isFollowUpDue).length;

  return (
    <div>
      {/* Quick Stats */}
      <QuickStats applications={applications} />

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Status" : s}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={jobTypeFilter}
          onChange={(e) => setJobTypeFilter(e.target.value)}
        >
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "Job/Intern" : t}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p === "All" ? "All Platforms" : p}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
        >
          {WORK_TYPES.map((w) => (
            <option key={w} value={w}>
              {w === "All" ? "Remote/Onsite" : w}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p === "All" ? "All Priority" : p}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Sort: Newest</option>
          <option value="company">Sort: Company</option>
          <option value="status">Sort: Status</option>
          <option value="priority">Sort: Priority</option>
        </select>
        <select
          className="filter-select"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
        >
          {GROUP_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g === "None" ? "Group: None" : `Group: ${g}`}
            </option>
          ))}
        </select>
      </div>

      {/* Result count & follow-ups */}
      <div
        style={{ marginBottom: 10, fontSize: 12, color: "var(--text-muted)" }}
      >
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        {followUpDueCount > 0 && (
          <span
            style={{ marginLeft: 10, color: "var(--yellow)", fontWeight: 600 }}
          >
            ⚡ {followUpDueCount} follow-up{followUpDueCount !== 1 ? "s" : ""}{" "}
            due
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔎</div>
          <h3>No applications found</h3>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Type</th>
                <th>Platform</th>
                <th>Applied</th>
                <th>Response</th>
                <th>Priority</th>
                <th>Next Action</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ key, items }) => (
                <React.Fragment key={key ?? "__all__"}>
                  {key !== null && (
                    <GroupHeader label={key} count={items.length} />
                  )}
                  {items.map((app) => {
                    const daysSince = getDaysSince(app.dateApplied);
                    const followUpDue = isFollowUpDue(app);
                    return (
                      <tr
                        key={app.id}
                        style={{
                          ...(followUpDue
                            ? { background: "rgba(234,179,8,0.04)" }
                            : {}),
                          cursor: "pointer",
                          transition: "background 0.12s",
                        }}
                        onClick={(e) => {
                          if (
                            e.target.tagName === "SELECT" ||
                            e.target.tagName === "BUTTON" ||
                            e.target.closest("button") ||
                            e.target.closest("a")
                          )
                            return;
                          setSelectedApp(app);
                        }}
                        onMouseEnter={(e) => {
                          if (!followUpDue)
                            e.currentTarget.style.background =
                              "var(--bg-hover, rgba(255,255,255,0.03))";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = followUpDue
                            ? "rgba(234,179,8,0.04)"
                            : "";
                        }}
                      >
                        {/* Company */}
                        <td className="company-cell">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {app.company}
                            </span>
                          </div>
                          <TagsList app={app} />
                          {app.jobLink && (
                            <a
                              href={app.jobLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Job &#8599;
                            </a>
                          )}
                          {followUpDue && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--yellow)",
                                marginTop: 2,
                              }}
                            >
                              ⚡ Follow-up due
                            </div>
                          )}
                        </td>

                        {/* Role */}
                        <td>
                          <div>{app.role}</div>
                          {app.salary && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--green)",
                                marginTop: 2,
                              }}
                            >
                              {app.salary}
                            </div>
                          )}
                        </td>

                        {/* Type */}
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 20,
                              background:
                                app.jobType === "Internship"
                                  ? "rgba(59,130,246,0.1)"
                                  : "var(--bg-hover)",
                              color:
                                app.jobType === "Internship"
                                  ? "var(--blue)"
                                  : "var(--text-muted)",
                              border: `1px solid ${app.jobType === "Internship" ? "rgba(59,130,246,0.2)" : "var(--border)"}`,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            {app.jobType || "Job"}
                          </span>
                        </td>

                        {/* Platform */}
                        <td>
                          {app.platform || (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Applied date */}
                        <td>
                          <div style={{ fontSize: 12 }}>
                            {app.dateApplied
                              ? new Date(app.dateApplied).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "2-digit",
                                  },
                                )
                              : "—"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginTop: 1,
                            }}
                          >
                            {getDaysAgo(app.createdAt)}
                          </div>
                        </td>

                        {/* Response Health */}
                        <td>
                          <ResponseHealth
                            daysSince={daysSince}
                            status={app.status}
                          />
                        </td>

                        {/* Priority */}
                        <td>
                          {app.priority ? (
                            <span
                              style={{
                                fontSize: 10,
                                padding: "2px 8px",
                                borderRadius: 20,
                                fontWeight: 600,
                                background:
                                  PRIORITY_COLORS[app.priority]?.bg ||
                                  "var(--bg-hover)",
                                color:
                                  PRIORITY_COLORS[app.priority]?.color ||
                                  "var(--text-muted)",
                              }}
                            >
                              {app.priority}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Next Action */}
                        <td>
                          <NextAction app={app} />
                        </td>

                        {/* Status */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <StatusSelect
                            value={app.status}
                            onChange={(e) =>
                              onUpdate(app.id, { status: e.target.value })
                            }
                          />
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn-ghost"
                              style={{ padding: "5px 10px", fontSize: 11 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(app);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete({
                                  id: app.id,
                                  company: app.company,
                                });
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onEdit={(app) => {
            setSelectedApp(null);
            onEdit(app);
          }}
        />
      )}

      {/* Custom Delete Confirm Modal */}
      {confirmDelete && (
        <ConfirmModal
          message={`Are you sure you want to delete the ${confirmDelete.company} application? This cannot be undone.`}
          onConfirm={() => {
            onDelete(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}