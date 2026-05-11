"use client";

import { useState, useEffect, useCallback } from "react";

const PLATFORMS = [
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
const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];
const WORK_TYPES = ["Remote", "Onsite", "Hybrid"];
const JOB_TYPES = ["Job", "Internship"];
const APPLY_TYPES = ["Direct Apply", "Referral", "Cold Apply"];
const PRIORITIES = ["High", "Medium", "Low"];

const DEFAULT_FORM = {
  company: "",
  role: "",
  jobType: "Job",
  applyType: "Direct Apply",
  platform: "",
  jobLink: "",
  dateApplied: new Date().toISOString().split("T")[0],
  status: "Applied",
  workType: "Onsite",
  priority: "Medium",
  recruiterName: "",
  recruiterContact: "",
  followUpDate: "",
  salary: "",
  resumeVersion: "",
  attachmentLink: "",
  notes: "",
};

function buildFormFromData(data) {
  return {
    company: data.company || "",
    role: data.role || "",
    jobType: data.jobType || "Job",
    applyType: data.applyType || "Direct Apply",
    platform: data.platform || "",
    jobLink: data.jobLink || "",
    dateApplied: data.dateApplied || new Date().toISOString().split("T")[0],
    status: data.status || "Applied",
    workType: data.workType || "Onsite",
    priority: data.priority || "Medium",
    recruiterName: data.recruiterName || "",
    recruiterContact: data.recruiterContact || "",
    followUpDate: data.followUpDate || "",
    salary: data.salary || "",
    resumeVersion: data.resumeVersion || "",
    attachmentLink: data.attachmentLink || "",
    notes: data.notes || "",
  };
}

export default function AddJobModal({ onClose, onSave, initialData }) {
  const [form, setForm] = useState(() =>
    initialData ? buildFormFromData(initialData) : { ...DEFAULT_FORM }
  );

  useEffect(() => {
    if (initialData) {
      setForm(buildFormFromData(initialData));
    } else {
      setForm({ ...DEFAULT_FORM });
    }
  }, [initialData]);

  const set = useCallback((key, val) => setForm((f) => ({ ...f, [key]: val })), []);

  const handleSubmit = () => {
    if (!form.company.trim() || !form.role.trim()) return;
    onSave(form);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {initialData ? "Edit Application" : "Add Application"}
          </div>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {/* Section: Basic Info */}
          <div className="modal-section-label">Basic Info</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company *</label>
              <input
                className="form-input"
                placeholder="e.g. Google"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <input
                className="form-input"
                placeholder="e.g. Backend Intern"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <div className="toggle-group">
                {JOB_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`toggle-btn ${form.jobType === t ? "active" : ""}`}
                    onClick={() => set("jobType", t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Apply Method</label>
              <div className="toggle-group">
                {APPLY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`toggle-btn ${form.applyType === t ? "active" : ""}`}
                    onClick={() => set("applyType", t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Platform</label>
              <select
                className="form-select"
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
              >
                <option value="">Select platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Work Type</label>
              <select
                className="form-select"
                value={form.workType}
                onChange={(e) => set("workType", e.target.value)}
              >
                {WORK_TYPES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date Applied</label>
              <input
                className="form-input"
                type="date"
                value={form.dateApplied}
                onChange={(e) => set("dateApplied", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Priority & Follow-up */}
          <div className="modal-section-label" style={{ marginTop: 8 }}>
            Priority &amp; Follow-up
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="toggle-group">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`toggle-btn priority-${p.toLowerCase()} ${form.priority === p ? "active" : ""}`}
                    onClick={() => set("priority", p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Next Follow-up Date</label>
              <input
                className="form-input"
                type="date"
                value={form.followUpDate}
                onChange={(e) => set("followUpDate", e.target.value)}
              />
            </div>
          </div>

          {/* Section: Recruiter Info */}
          <div className="modal-section-label" style={{ marginTop: 8 }}>
            Recruiter Info{" "}
            <span
              style={{
                color: "var(--text-muted)",
                fontWeight: 400,
                textTransform: "none",
                fontSize: 11,
              }}
            >
              (optional)
            </span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Recruiter Name</label>
              <input
                className="form-input"
                placeholder="e.g. Priya Sharma"
                value={form.recruiterName}
                onChange={(e) => set("recruiterName", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email / LinkedIn</label>
              <input
                className="form-input"
                placeholder="email or linkedin.com/in/..."
                value={form.recruiterContact}
                onChange={(e) => set("recruiterContact", e.target.value)}
              />
            </div>
          </div>

          {/* Section: Salary & Resume */}
          <div className="modal-section-label" style={{ marginTop: 8 }}>
            Salary &amp; Resume
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Salary / Stipend</label>
              <input
                className="form-input"
                placeholder="e.g. ₹8 LPA or ₹15,000/mo"
                value={form.salary}
                onChange={(e) => set("salary", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Resume Version</label>
              <input
                className="form-input"
                placeholder="e.g. Resume v2, SDE-focused"
                value={form.resumeVersion}
                onChange={(e) => set("resumeVersion", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Job Link</label>
              <input
                className="form-input"
                placeholder="https://..."
                value={form.jobLink}
                onChange={(e) => set("jobLink", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Resume Link</label>
              <input
                className="form-input"
                placeholder="Drive / Notion / Portfolio link"
                value={form.attachmentLink}
                onChange={(e) => set("attachmentLink", e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginTop: 4 }}>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Interview rounds, CTC, hiring manager name..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!form.company.trim() || !form.role.trim()}
              style={{
                opacity: !form.company.trim() || !form.role.trim() ? 0.5 : 1,
              }}
            >
              {initialData ? "Save Changes" : "Add Application"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}