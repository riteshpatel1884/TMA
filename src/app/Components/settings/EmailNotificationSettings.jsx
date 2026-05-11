"use client";
// components/settings/EmailNotificationSettings.jsx
// Add this to your settings page so users can toggle email notifications

import { useState } from "react";

export default function EmailNotificationSettings({ initialEnabled = true }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: next }),
      });
      if (res.ok) {
        setEnabled(next);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "20px 24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            Email Notifications
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Get notified when you complete a day's prep tasks, and receive reminders 7, 3, 2, 1 days before your exam.
          </div>
        </div>

        <button
          onClick={toggle}
          disabled={saving}
          style={{
            flexShrink: 0,
            width: 44,
            height: 24,
            borderRadius: 100,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            background: enabled ? "var(--accent)" : "var(--bg-hover)",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div style={{
            position: "absolute",
            top: 3,
            left: enabled ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }} />
        </button>
      </div>

      {saved && (
        <div style={{
          marginTop: 10,
          fontSize: 12,
          color: "var(--green)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          ✓ Saved
        </div>
      )}
    </div>
  );
}