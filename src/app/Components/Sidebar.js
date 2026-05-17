"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "../../utils/themeProvider/Themeprovider"; // adjust path as needed

const navItems = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "applications", icon: "☰", label: "Applications" },
  { id: "analytics", icon: "◈", label: "Analytics" },
  { id: "resume", icon: "⬡", label: "Resume Matcher" },
  { id: "prep", icon: "◎", label: "Prep Tracker" },
];

const CHANGELOG = [
  {
    version: "v1.3.0",
    date: "Coming Soon",
    tag: "next",
    changes: [
      { type: "upcoming", text: "Prep Tracker — daily aptitude study plans linked to your applications" },
      { type: "upcoming", text: "Topic scheduling — auto-distributes syllabus across available days" },
      { type: "upcoming", text: "Daily checkmarks — mark topics done day by day with progress tracking" },
    ],
  },
  {
    version: "v1.2.0",
    date: "Coming Soon",
    tag: null,
    changes: [
      { type: "upcoming", text: "User authentication — sign up & log in to your account securely" },
      { type: "upcoming", text: "Cloud database sync — your applications backed up and accessible from any device" },
      { type: "upcoming", text: "No more local storage limits — unlimited applications stored in the cloud" },
    ],
  },
  {
    version: "v1.1.0",
    date: "April 2025",
    tag: null,
    changes: [
      { type: "new", text: "Resume tab updated with only 2 limits per day." },
      { type: "fix", text: "Minor bugs fixed" },
      { type: "improved", text: "Dashboard cards now show streak and active application count" },
    ],
  },
];

const TYPE_CONFIG = {
  new:      { label: "New",      color: "var(--green)", bg: "var(--green-dim)", border: "rgba(52,211,153,0.2)" },
  improved: { label: "Improved", color: "var(--accent)", bg: "var(--accent-dim)", border: "var(--accent-border)" },
  fix:      { label: "Fix",      color: "var(--yellow)", bg: "var(--yellow-dim)", border: "rgba(245,158,11,0.2)" },
  upcoming: { label: "Upcoming", color: "#f472b6", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.2)" },
};

function ChangelogModal({ onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 999, animation: "fadeIn 0.18s ease" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(520px, 92vw)", maxHeight: "80vh", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, display: "flex", flexDirection: "column", zIndex: 1000, boxShadow: "0 32px 80px rgba(0,0,0,0.4)", animation: "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>What's New</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>LeaderLab changelog</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 28 }}>
          {CHANGELOG.map((release, i) => {
            const regularChanges = release.changes.filter(c => c.type !== "upcoming");
            const upcomingChanges = release.changes.filter(c => c.type === "upcoming");
            return (
              <div key={release.version}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{release.version}</span>
                  {release.tag === "next" && <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", padding: "2px 7px", borderRadius: 4, background: "rgba(244,114,182,0.12)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.25)" }}>Next</span>}
                  {release.tag === "latest" && <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", padding: "2px 7px", borderRadius: 4, background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>Latest</span>}
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{release.date}</span>
                </div>
                {regularChanges.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {regularChanges.map((c, j) => {
                      const cfg = TYPE_CONFIG[c.type];
                      return (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", borderRadius: 8, background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", padding: "2px 6px", borderRadius: 4, background: cfg.bg, color: cfg.color, flexShrink: 0, marginTop: 1, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{c.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {upcomingChanges.length > 0 && (
                  <div style={{ marginTop: regularChanges.length > 0 ? 16 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, rgba(244,114,182,0.35), transparent)" }} />
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#f472b6", opacity: 0.75 }}>✦ Coming Soon</span>
                      <div style={{ height: 1, flex: 1, background: "linear-gradient(to left, rgba(244,114,182,0.35), transparent)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {upcomingChanges.map((c, j) => {
                        const cfg = TYPE_CONFIG.upcoming;
                        return (
                          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(244,114,182,0.04)", border: "1px dashed rgba(244,114,182,0.25)" }}>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", padding: "2px 6px", borderRadius: 4, background: cfg.bg, color: cfg.color, flexShrink: 0, marginTop: 1, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, opacity: 0.75, fontStyle: "italic" }}>{c.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {i < CHANGELOG.length - 1 && <div style={{ height: 1, background: "var(--border)", marginTop: 24 }} />}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  );
}

// ── Theme toggle pill ────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 10px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--bg-hover)",
        cursor: "pointer",
        transition: "all 0.15s",
        color: "var(--text-secondary)",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        fontWeight: 500,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.color = "var(--text-primary)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
    >
      {/* Track */}
      <span style={{ position: "relative", width: 32, height: 18, borderRadius: 9, background: isDark ? "var(--border-light)" : "var(--accent)", display: "inline-flex", alignItems: "center", flexShrink: 0, transition: "background 0.2s", padding: "0 2px" }}>
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: isDark ? "var(--text-muted)" : "#fff", transform: isDark ? "translateX(0)" : "translateX(14px)", transition: "transform 0.2s, background 0.2s", display: "block" }} />
      </span>
      <span style={{ flex: 1 }}>{isDark ? "Dark mode" : "Light mode"}</span>
      <span style={{ fontSize: 14 }}>{isDark ? "🌙" : "☀️"}</span>
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [showChangelog, setShowChangelog] = useState(false);
  const { user, isLoaded } = useUser();

  const currentVersion = CHANGELOG.find(r => r.tag !== "next")?.version ?? CHANGELOG[0].version;

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">LeaderLab</div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map((item) => {
            const href = `/${item.id}`;
            const isActive = pathname === href || pathname.startsWith(`/${item.id}/`);
            return (
              <Link key={item.id} href={href} className={`nav-item ${isActive ? "active" : ""}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* User row */}
          {isLoaded && user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
              <UserButton afterSignOutUrl="/sign-in" />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.fullName || user.username || "User"}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          ) : isLoaded && !user ? (
            <Link href="/sign-in" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              <span style={{ fontSize: 14 }}>→</span> Sign in
            </Link>
          ) : null}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Local storage note */}
          <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Data stored locally in your browser
          </div>

          {/* Version / changelog button */}
          <button
            suppressHydrationWarning
            onClick={() => setShowChangelog(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", width: "100%", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-dim)"; e.currentTarget.style.borderColor = "var(--accent-border)"; }}
          >
            <span style={{ fontSize: 10, opacity: 0.5 }}>◈</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>{currentVersion}</span>
            <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--text-muted)", fontStyle: "italic" }}>What's new →</span>
          </button>
        </div>
      </aside>

      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  );
}