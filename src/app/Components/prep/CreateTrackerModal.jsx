"use client";
// components/prep/CreateTrackerModal.jsx
import { useState } from "react";
import { DEFAULT_APTITUDE_TOPICS } from "../../../lib/defaultAptitudeTopics";

const CATEGORIES = ["Quantitative", "Logical", "Verbal", "Custom"];

const ROUND_NAMES = [
  "Aptitude",
  "Coding",
  "Group Discussion",
  "Technical Interview",
  "HR Interview",
  "Essay Writing",
  "Psychometric",
];

export default function CreateTrackerModal({ applications, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [companyMode, setCompanyMode] = useState("linked");
  const [applicationId, setApplicationId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roundName, setRoundName] = useState("Aptitude");
  const [customRoundName, setCustomRoundName] = useState("");
  const [dateMode, setDateMode] = useState("date");
  const [roundDate, setRoundDate] = useState("");
  const [daysManual, setDaysManual] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");   // ← new
  const [notes, setNotes] = useState("");

  // Step 2 fields
  const [useDefault, setUseDefault] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState(["Quantitative", "Logical", "Verbal"]);
  const [customTopics, setCustomTopics] = useState([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("Custom");

  const linkedApp = applications.find((a) => a.id === applicationId);
  const resolvedCompany =
    companyMode === "linked" && linkedApp ? linkedApp.company : companyName;

  const filteredDefaults = DEFAULT_APTITUDE_TOPICS.filter((t) =>
    selectedCategories.includes(t.category)
  );
  const totalTopics =
    (useDefault ? filteredDefaults.length : 0) + customTopics.length;

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const addCustomTopic = () => {
    const name = newTopicName.trim();
    if (!name) return;
    setCustomTopics((prev) => [...prev, { name, category: newTopicCategory }]);
    setNewTopicName("");
  };

  const removeCustomTopic = (i) => {
    setCustomTopics((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleNext = () => {
    if (!resolvedCompany) { setError("Please select or enter a company name."); return; }
    if (dateMode === "date" && !roundDate) { setError("Please enter the round date."); return; }
    if (dateMode === "days" && (!daysManual || Number(daysManual) < 1)) { setError("Please enter valid number of days."); return; }
    // Basic email validation if provided
    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const body = {
      companyName: resolvedCompany,
      applicationId: companyMode === "linked" ? applicationId || null : null,
      roundName: roundName === "__custom__" ? customRoundName : roundName,
      roundDate: dateMode === "date" ? roundDate : null,
      daysManual: dateMode === "days" ? Number(daysManual) : null,
      useDefaultTopics: useDefault,
      customTopics,
      notes,
      notifyEmail: notifyEmail.trim() || null,   // ← new
      selectedCategories: useDefault ? selectedCategories : [],
    };

    try {
      const res = await fetch("/api/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onCreated(data.tracker);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">New Prep Tracker</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Step {step} of 2 — {step === 1 ? "Basics" : "Topics"}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ padding: "10px 24px 0", display: "flex", gap: 6 }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: s <= step ? "var(--accent)" : "var(--border)",
              transition: "background 0.2s",
            }} />
          ))}
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius-sm)", padding: "9px 12px",
              fontSize: 12, color: "var(--red)", marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              {/* Company */}
              <div className="modal-section-label">Company</div>
              <div className="form-group">
                <div className="toggle-group" style={{ marginBottom: 10 }}>
                  <button className={`toggle-btn ${companyMode === "linked" ? "active" : ""}`} onClick={() => setCompanyMode("linked")}>
                    Link to application
                  </button>
                  <button className={`toggle-btn ${companyMode === "manual" ? "active" : ""}`} onClick={() => setCompanyMode("manual")}>
                    Enter manually
                  </button>
                </div>
                {companyMode === "linked" ? (
                  applications.length ? (
                    <select className="form-select" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
                      <option value="">— Select a company —</option>
                      {applications.map((a) => (
                        <option key={a.id} value={a.id}>{a.company} · {a.role}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      No applications found. Add one in the Applications tab first.
                    </div>
                  )
                ) : (
                  <input className="form-input" placeholder="e.g. TCS, Infosys, Wipro" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                )}
              </div>

              {/* Round */}
              <div className="modal-section-label" style={{ marginTop: 4 }}>Round</div>
              <div className="form-group">
                <div className="toggle-group" style={{ flexWrap: "wrap" }}>
                  {ROUND_NAMES.map((r) => (
                    <button key={r} className={`toggle-btn ${roundName === r ? "active" : ""}`} onClick={() => setRoundName(r)}>{r}</button>
                  ))}
                  <button className={`toggle-btn ${roundName === "__custom__" ? "active" : ""}`} onClick={() => setRoundName("__custom__")}>Custom</button>
                </div>
                {roundName === "__custom__" && (
                  <input className="form-input" style={{ marginTop: 8 }} placeholder="Round name" value={customRoundName} onChange={(e) => setCustomRoundName(e.target.value)} />
                )}
              </div>

              {/* Schedule */}
              <div className="modal-section-label" style={{ marginTop: 4 }}>Schedule</div>
              <div className="form-group">
                <div className="toggle-group" style={{ marginBottom: 10 }}>
                  <button className={`toggle-btn ${dateMode === "date" ? "active" : ""}`} onClick={() => setDateMode("date")}>Pick exam date</button>
                  <button className={`toggle-btn ${dateMode === "days" ? "active" : ""}`} onClick={() => setDateMode("days")}>Enter days remaining</button>
                </div>
                {dateMode === "date" ? (
                  <input type="date" className="form-input" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} />
                ) : (
                  <input type="number" className="form-input" placeholder="e.g. 7" min={1} value={daysManual} onChange={(e) => setDaysManual(e.target.value)} />
                )}
              </div>

              {/* Notification Email — new field */}
              <div className="modal-section-label" style={{ marginTop: 4 }}>
                Notification Email
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>optional</span>
              </div>
              <div className="form-group">
                <input
                  className="form-input"
                  type="email"
                  placeholder="your@email.com — get notified on day completion"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                />
                {notifyEmail && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ color: "var(--green)" }}>✓</span>
                    You'll get an email when each day's topics are all done + reminders before the exam.
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 64 }}
                  placeholder="Any extra context about this round..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="modal-section-label">Default Topics</div>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Auto-add common aptitude topics</span>
                  <button className={`toggle-btn ${useDefault ? "active" : ""}`} onClick={() => setUseDefault((v) => !v)}>
                    {useDefault ? "✓ Enabled" : "Disabled"}
                  </button>
                </div>
                {useDefault && (
                  <>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Select categories to include:</div>
                    <div className="toggle-group">
                      {["Quantitative", "Logical", "Verbal"].map((cat) => (
                        <button key={cat} className={`toggle-btn ${selectedCategories.includes(cat) ? "active" : ""}`} onClick={() => toggleCategory(cat)}>
                          {cat} ({DEFAULT_APTITUDE_TOPICS.filter((t) => t.category === cat).length})
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="modal-section-label" style={{ marginTop: 4 }}>Custom Topics</div>
              <div className="form-group">
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Topic name"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTopic()}
                    style={{ flex: 1 }}
                  />
                  <select className="form-select" value={newTopicCategory} onChange={(e) => setNewTopicCategory(e.target.value)} style={{ width: 130 }}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <button className="btn-primary" onClick={addCustomTopic} style={{ whiteSpace: "nowrap" }}>Add</button>
                </div>
                {customTopics.length > 0 && (
                  <div className="custom-topics-list">
                    {customTopics.map((t, i) => (
                      <div key={i} className="custom-topic-chip">
                        <span className="custom-topic-name">{t.name}</span>
                        <span className="custom-topic-cat">{t.category}</span>
                        <button onClick={() => removeCustomTopic(i)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
                borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 12,
                color: "var(--text-secondary)",
              }}>
                <strong style={{ color: "var(--text-primary)" }}>{totalTopics} topics</strong> will be distributed across{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {dateMode === "days" ? `${daysManual || "?"} days` : roundDate ? `${Math.max(1, Math.ceil((new Date(roundDate) - new Date()) / 86400000))} days` : "? days"}
                </strong>
                {notifyEmail && (
                  <span style={{ color: "var(--green)", marginLeft: 8 }}>· 📧 notifications on</span>
                )}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            {step === 1 ? (
              <>
                <button className="btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={handleNext}>Next → Topics</button>
              </>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creating..." : "Create Tracker"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-topics-list { display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto; }
        .custom-topic-chip { display: flex; align-items: center; gap: 8px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 5px 10px; font-size: 12px; }
        .custom-topic-name { flex: 1; color: var(--text-secondary); }
        .custom-topic-cat { font-size: 10px; color: var(--text-muted); background: var(--bg); border: 1px solid var(--border); border-radius: 20px; padding: 1px 7px; }
      `}</style>
    </div>
  );
}