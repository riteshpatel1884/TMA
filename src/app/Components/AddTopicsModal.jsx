"use client";
// components/prep/AddTopicsModal.jsx
import { useState } from "react";
import { DEFAULT_APTITUDE_TOPICS } from "../../lib/defaultAptitudeTopics";

const CATEGORIES = ["Quantitative", "Logical", "Verbal", "Custom"];

export default function AddTopicsModal({ trackerId, existingTopics, onClose, onAdded }) {
  const [tab, setTab] = useState("default"); // "default" | "custom"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Default tab
  const existingNames = new Set(existingTopics.map((t) => t.name));
  const available = DEFAULT_APTITUDE_TOPICS.filter((t) => !existingNames.has(t.name));
  const [selected, setSelected] = useState(new Set());
  const [catFilter, setCatFilter] = useState("All");

  const filtered =
    catFilter === "All" ? available : available.filter((t) => t.category === catFilter);

  const toggleSelect = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map((t) => t.name)));
  const clearAll = () => setSelected(new Set());

  // Custom tab
  const [customTopics, setCustomTopics] = useState([{ name: "", category: "Custom" }]);
  const addRow = () => setCustomTopics((p) => [...p, { name: "", category: "Custom" }]);
  const removeRow = (i) => setCustomTopics((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) =>
    setCustomTopics((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  const handleAdd = async () => {
    let topics = [];

    if (tab === "default") {
      topics = available.filter((t) => selected.has(t.name));
      if (!topics.length) { setError("Select at least one topic."); return; }
    } else {
      topics = customTopics.filter((t) => t.name.trim());
      if (!topics.length) { setError("Enter at least one topic name."); return; }
      topics = topics.map((t) => ({ name: t.name.trim(), category: t.category }));
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/prep/${trackerId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onAdded(data.tracker);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">Add Topics</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius-sm)", padding: "8px 12px",
              fontSize: 12, color: "var(--red)", marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--border)" }}>
            {["default", "custom"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "8px 16px", fontSize: 13, fontWeight: 600,
                  color: tab === t ? "var(--accent)" : "var(--text-muted)",
                  borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                  marginBottom: -1,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t === "default" ? `From Library (${available.length} left)` : "Custom Topics"}
              </button>
            ))}
          </div>

          {/* Default topics tab */}
          {tab === "default" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div className="toggle-group" style={{ flex: 1 }}>
                  {["All", "Quantitative", "Logical", "Verbal"].map((c) => (
                    <button
                      key={c}
                      className={`toggle-btn ${catFilter === c ? "active" : ""}`}
                      onClick={() => setCatFilter(c)}
                      style={{ fontSize: 11 }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={selectAll}>
                    All
                  </button>
                  <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={clearAll}>
                    None
                  </button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>
                  All topics in this category are already added.
                </div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                  {filtered.map((t) => {
                    const isSelected = selected.has(t.name);
                    return (
                      <div
                        key={t.name}
                        onClick={() => toggleSelect(t.name)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", borderRadius: "var(--radius-sm)",
                          cursor: "pointer", transition: "background 0.1s",
                          background: isSelected ? "var(--accent-dim)" : "transparent",
                          border: `1px solid ${isSelected ? "var(--accent-border)" : "transparent"}`,
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, border: `2px solid ${isSelected ? "var(--accent)" : "var(--border-light)"}`,
                          borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, color: "var(--accent)", flexShrink: 0,
                          background: isSelected ? "var(--accent-dim)" : "none",
                        }}>
                          {isSelected ? "✓" : ""}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>{t.name}</span>
                        <span style={{
                          fontSize: 10, padding: "1px 7px", borderRadius: 20,
                          background: "var(--bg-hover)", color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}>
                          {t.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {selected.size > 0 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  {selected.size} topic{selected.size !== 1 ? "s" : ""} selected
                </div>
              )}
            </>
          )}

          {/* Custom topics tab */}
          {tab === "custom" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {customTopics.map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Topic name"
                      value={row.name}
                      onChange={(e) => updateRow(i, "name", e.target.value)}
                    />
                    <select
                      className="form-select"
                      style={{ width: 130 }}
                      value={row.category}
                      onChange={(e) => updateRow(i, "category", e.target.value)}
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    {customTopics.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        style={{
                          background: "none", border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)", color: "var(--text-muted)",
                          cursor: "pointer", padding: "0 10px", fontSize: 16,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="btn-ghost" onClick={addRow} style={{ fontSize: 12 }}>
                + Add another row
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleAdd} disabled={loading}>
              {loading ? "Adding..." : "Add Topics"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}