"use client";

import { useState, useEffect } from "react";

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const DAILY_LIMIT = 10;
const STORAGE_KEY = "resumeMatcher_usage";
const HISTORY_KEY = "resumeMatcher_history";


const JOB_SECTION_WEIGHTS = [
  { key: "experience", label: "Work Experience", points: 25 },
  { key: "projects", label: "Projects", points: 20 },
  { key: "technicalSkills", label: "Technical Skills", points: 15 },
  { key: "certifications", label: "Certifications", points: 15 },
  { key: "education", label: "Education", points: 10 },
  { key: "summary", label: "Bio / Professional Summary", points: 10 },
  { key: "achievements", label: "Achievements / Awards", points: 5 },
];

// Section weights for INTERNSHIP — total 100 points
// Experience (25pts) redistributed: Projects +10, Technical Skills +5, Certifications +5, Achievements +5
const INTERNSHIP_SECTION_WEIGHTS = [
  { key: "projects", label: "Projects", points: 30 },
  { key: "technicalSkills", label: "Technical Skills", points: 20 },
  { key: "certifications", label: "Certifications", points: 20 },
  { key: "education", label: "Education", points: 10 },
  { key: "summary", label: "Bio / Professional Summary", points: 10 },
  { key: "achievements", label: "Achievements / Awards", points: 10 },
];

function getSectionWeights(jobType) {
  return jobType === "internship"
    ? INTERNSHIP_SECTION_WEIGHTS
    : JOB_SECTION_WEIGHTS;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function getISTNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
}
function getISTDateStr() {
  return getISTNow().toISOString().split("T")[0];
}
function getFormattedDateTime() {
  return getISTNow().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getUsageData() {
  try {
    return (
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        count: 0,
        date: getISTDateStr(),
      }
    );
  } catch {
    return { count: 0, date: getISTDateStr() };
  }
}
function saveUsageData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}
function getRemainingUses() {
  const u = getUsageData(),
    today = getISTDateStr();
  return u.date !== today ? DAILY_LIMIT : Math.max(0, DAILY_LIMIT - u.count);
}
function incrementUsage() {
  const today = getISTDateStr(),
    u = getUsageData();
  saveUsageData(
    u.date !== today
      ? { count: 1, date: today }
      : { count: u.count + 1, date: today },
  );
}
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}
function saveToHistory(analysis) {
  const history = getHistory();
  history.unshift({
    id: Date.now(),
    formattedTime: getFormattedDateTime(),
    role: analysis.role,
    jobType: analysis.jobType,
    resumeVersion: analysis.resumeVersion,
    experience: analysis.experience,
    matchScore: analysis.matchScore,
    verdict: analysis.verdict,
    fullAnalysis: analysis,
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

// ── UI primitives ────────────────────────────────────────────────────────

function ScoreRing({ score, size = 100 }) {
  const r = 38,
    circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={fill}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text
        x="50"
        y="46"
        textAnchor="middle"
        fill={color}
        style={{ fontSize: 18, fontWeight: 800, fontFamily: "sans-serif" }}
      >
        {score}%
      </text>
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        style={{ fontSize: 8, letterSpacing: 0.5, fontFamily: "sans-serif" }}
      >
        MATCH
      </text>
    </svg>
  );
}

function qualityScore(pct) {
  return Math.min(1, Math.max(0, pct / 100));
}

function SectionBreakdown({ sections, jobType }) {
  const weights = getSectionWeights(jobType);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {weights.map(({ key, label, points }) => {
        const s = sections?.[key];
        if (!s) return null;
        const present = s.present;
        const qualityPct = s.qualityScore ?? (present ? 80 : 0);
        const earned = present
          ? Math.round(points * qualityScore(qualityPct))
          : 0;
        const barColor = present
          ? qualityPct >= 70
            ? "#22c55e"
            : qualityPct >= 40
              ? "#eab308"
              : "#ef4444"
          : "#ef4444";
        return (
          <div
            key={key}
            style={{
              padding: "12px 14px",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${present ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.15)"}`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 3,
                    background: present
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(239,68,68,0.08)",
                    color: present ? "rgba(255,255,255,0.5)" : "#ef4444",
                    border: present
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  {present ? `${earned}/${points}` : `0/${points}`}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {label}
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: present ? barColor : "#ef4444",
                }}
              >
                {present ? s.quality || "present" : "missing"}
              </span>
            </div>
            <div
              style={{
                height: 3,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${present ? qualityPct : 0}%`,
                  background: barColor,
                  borderRadius: 2,
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
            {s.note && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.55,
                }}
              >
                {s.note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "24px 0 16px",
      }}
    >
      <div
        style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.07)" }}
      />
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        {label}
      </span>
      <div
        style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.07)" }}
      />
    </div>
  );
}

function Tag({ text, variant }) {
  const styles = {
    miss: {
      bg: "rgba(239,68,68,0.08)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.2)",
    },
    hit: {
      bg: "rgba(34,197,94,0.08)",
      color: "#22c55e",
      border: "rgba(34,197,94,0.2)",
    },
  };
  const s = styles[variant];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {text}
    </span>
  );
}

function HistoryModal({ isOpen, onClose, history }) {
  if (!isOpen) return null;
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          width: "90%",
          maxWidth: 660,
          maxHeight: "85vh",
          overflowY: "auto",
          zIndex: 1000,
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            position: "sticky",
            top: 0,
            background: "#0a0a0a",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Analysis History
            </h3>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {history.length} saved (last 50)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        {history.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: 13,
            }}
          >
            No analyses yet.
          </div>
        ) : (
          <div style={{ padding: "14px 18px" }}>
            {history.map((entry) => {
              const expYears =
                entry.experience === "" || entry.experience === null
                  ? null
                  : parseInt(entry.experience);
              return (
                <div
                  key={entry.id}
                  style={{
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 7,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.85)",
                          }}
                        >
                          {entry.role}
                        </span>
                        {expYears !== null && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.4)",
                              background: "rgba(255,255,255,0.05)",
                              padding: "2px 7px",
                              borderRadius: 3,
                            }}
                          >
                            {expYears === 0 ? "Fresher" : `${expYears}yr`}
                          </span>
                        )}
                        {entry.resumeVersion && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "rgba(129,140,248,0.7)",
                              background: "rgba(129,140,248,0.08)",
                              padding: "2px 7px",
                              borderRadius: 3,
                            }}
                          >
                            v{entry.resumeVersion}
                          </span>
                        )}
                        {entry.jobType && (
                          <span
                            style={{
                              fontSize: 11,
                              color:
                                entry.jobType === "internship"
                                  ? "rgba(129,140,248,0.8)"
                                  : "rgba(34,197,94,0.8)",
                              background:
                                entry.jobType === "internship"
                                  ? "rgba(129,140,248,0.08)"
                                  : "rgba(34,197,94,0.08)",
                              padding: "2px 7px",
                              borderRadius: 3,
                              border:
                                entry.jobType === "internship"
                                  ? "1px solid rgba(129,140,248,0.2)"
                                  : "1px solid rgba(34,197,94,0.2)",
                            }}
                          >
                            {entry.jobType === "internship"
                              ? "Internship"
                              : "Job"}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.25)",
                          marginBottom: 6,
                        }}
                      >
                        {entry.formattedTime}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.45)",
                          lineHeight: 1.5,
                          fontStyle: "italic",
                        }}
                      >
                        "{entry.verdict}"
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color:
                            entry.matchScore >= 75
                              ? "#22c55e"
                              : entry.matchScore >= 50
                                ? "#eab308"
                                : "#ef4444",
                        }}
                      >
                        {entry.matchScore}%
                      </div>
                      <div
                        style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}
                      >
                        match
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ResumeMatcher() {
  const isMobile = useIsMobile();
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [role, setRole] = useState("");
  const [jobType, setJobType] = useState("job");
  const [resumeVersion, setResumeVersion] = useState("");
  const [experience, setExperience] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // useEffect(() => {
  //   setRemaining(getRemainingUses());
  //   setHistory(getHistory());
  // }, []);
  useEffect(() => {
  const remaining = getRemainingUses();
  const history = getHistory();
  setRemaining(remaining);
  setHistory(history);
}, []);

  const isLimitReached = remaining <= 0;
  const expYears = experience === "" ? null : parseInt(experience);
  const isFresherOrUnset = expYears === null || expYears === 0;

  const currentWeights = getSectionWeights(jobType);
  const isInternship = jobType === "internship";

  const handleExperienceChange = (e) => {
    const val = e.target.value;
    if (val === "" || (/^\d+$/.test(val) && parseInt(val) <= 50)) {
      setExperience(val);
      if (val !== "" && parseInt(val) > 0) setJobType("job");
    }
  };

  const analyze = async () => {
    if (!resume.trim() || !jobDesc.trim() || !role.trim()) {
      setError("Resume, job description, and role are required.");
      return;
    }
    if (experience === "") {
      setError("Years of experience required. Enter 0 if fresher.");
      return;
    }
    if (getRemainingUses() <= 0) {
      setError("Daily limit reached. Resets at midnight IST.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    const positionType = isInternship ? "Internship" : "Full-Time Job";
    const expContext =
      expYears === 0
        ? "0 years (Fresher — no work experience)"
        : `${expYears} year${expYears === 1 ? "" : "s"} of professional experience`;

    // Build section weights description dynamically based on job type
    const sectionWeightsDesc = currentWeights
      .map((s) => `  - ${s.label}: ${s.points} points`)
      .join("\n");

    // For internship, experience section is not scored; for job it is
    const sectionKeysToScore = currentWeights.map((w) => w.key);

    // Build the sectionScores JSON schema dynamically
    const allSectionKeys = [
      "experience",
      "projects",
      "technicalSkills",
      "certifications",
      "education",
      "summary",
      "achievements",
    ];

    const sectionScoresTemplate = allSectionKeys
      .map(
        (key) =>
          `    "${key}": { "present": <bool>, "qualityScore": <0-100 or null if not scored>, "quality": "strong|weak|missing", "note": "<brief specific note about this section vs JD>" }`,
      )
      .join(",\n");

    const internshipNote = isInternship
      ? `\n\nIMPORTANT — This is an INTERNSHIP role. The candidate is expected to have NO professional work experience. Do NOT penalize for missing work experience. The "experience" section should still be detected if present (e.g., part-time, freelance, volunteer work), but it carries 0 weight in scoring. Score only the sections listed in the weights above. Projects, technical skills, and certifications are the most critical factors.`
      : "";

    const prompt = `You are a senior technical recruiter and ATS specialist. Give a surgical, honest analysis — not a feel-good report.

Position Type: ${positionType}
Target Role: ${role}
Candidate Experience: ${expContext}${internshipNote}

Resume:
${resume}

Job Description:
${jobDesc}

## SCORING SYSTEM — 100 points total

The resume is scored using these fixed section weights. For each section listed below:
1. Detect if it is present in the resume.
2. If MISSING → award 0 points for that section.
3. If PRESENT → award points based on quality relative to this specific JD (0–100% quality scale).

Section weights (ONLY these sections contribute to the score):
${sectionWeightsDesc}

${isInternship ? 'NOTE: "Work Experience" is NOT in the scoring weights for this internship role. Even if the candidate has some experience listed, projects, skills, certifications, education, summary and achievements are what matter here.' : ""}

TOTAL MATCH SCORE = sum of (weight × quality%) for each present section from the list above. Cap at 100.
Be realistic. A score of 60+ means genuinely competitive. Don't inflate.

For ALL sections (including experience for internship — just note if present/absent), fill out sectionScores.
For sections NOT in the scoring weights, set qualityScore to null and note they are not scored for this position type.

Return ONLY a valid JSON object — no markdown, no explanation:

{
  "matchScore": <integer 0-100, calculated only from the weighted sections above>,
  "verdict": "<one direct sentence: hiring recommendation>",

  "sectionScores": {
${sectionScoresTemplate}
  },

  "missingSections": ["<section name if not found in resume AND it is in the scoring weights>"],

  "criticalGaps": [
    "<gap 1: specific missing skill, tool, or experience — max 5 items>",
    "<gap 2>",
    "<gap 3>"
  ],

  "missingKeywords": ["<exact keyword from JD not in resume>"],
  "matchedKeywords": ["<exact keyword present in both>"],

  "atsRisk": "<one sentence: ATS pass likelihood and why>",

  "oneThingToFix": "<the single most impactful change before applying>"
}`;

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            max_tokens: 1600,
            messages: [
              {
                role: "system",
                content:
                  "You are a blunt expert technical recruiter. Return ONLY valid JSON — no markdown, no preamble.",
              },
              { role: "user", content: prompt },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || "API error");
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      saveToHistory({
        role,
        jobType,
        experience,
        resumeVersion: resumeVersion || null,
        ...parsed,
      });
      incrementUsage();
      setRemaining(getRemainingUses());
      setHistory(getHistory());
      setResult({ ...parsed, _jobType: jobType });
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const expLabel =
    expYears === null
      ? ""
      : expYears === 0
        ? "Fresher"
        : `${expYears}yr${expYears === 1 ? "" : "s"}`;

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        textarea, input { outline: none; }
        textarea:focus, input:focus { border-color: rgba(255,255,255,0.22) !important; }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 800,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.3px",
            }}
          >
            Resume Matcher
          </h2>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Section-weighted scoring against job description
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: isLimitReached
                ? "#ef4444"
                : remaining === 1
                  ? "#eab308"
                  : "#22c55e",
              textAlign: "right",
            }}
          >
            {remaining}/{DAILY_LIMIT}
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              left today
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)",
              padding: "7px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📊 History ({history.length})
          </button>
        </div>
      </div>

      {/* Section weights info strip — dynamic based on jobType */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: `1px solid ${isInternship ? "rgba(129,140,248,0.12)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: isInternship
                ? "rgba(129,140,248,0.6)"
                : "rgba(255,255,255,0.3)",
            }}
          >
            Scoring breakdown — {isInternship ? "Internship" : "Full-Time Job"}{" "}
            (100 pts total)
          </div>
          {isInternship && (
            <span
              style={{
                fontSize: 10,
                color: "rgba(129,140,248,0.7)",
                background: "rgba(129,140,248,0.08)",
                border: "1px solid rgba(129,140,248,0.2)",
                padding: "2px 8px",
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              Experience not scored
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {currentWeights.map(({ label, points }) => (
            <span
              key={label}
              style={{
                fontSize: 11,
                padding: "3px 9px",
                borderRadius: 4,
                background: isInternship
                  ? "rgba(129,140,248,0.05)"
                  : "rgba(255,255,255,0.04)",
                border: isInternship
                  ? "1px solid rgba(129,140,248,0.12)"
                  : "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {label}{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: isInternship
                    ? "rgba(129,140,248,0.9)"
                    : "rgba(255,255,255,0.85)",
                }}
              >
                {points}pt
              </span>
            </span>
          ))}
        </div>
        {isInternship && (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 10,
              color: "rgba(129,140,248,0.5)",
              lineHeight: 1.5,
            }}
          >
            ℹ️ Internship scoring emphasises Projects (30), Skills (20) and
            Certifications (20) — work experience carries no weight since
            freshers are not expected to have any.
          </p>
        )}
      </div>

      {/* Banners */}
      {isLimitReached && (
        <div
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: 7,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#ef4444",
          }}
        >
          Daily limit reached — resets at midnight IST.
        </div>
      )}
      {remaining === 1 && !isLimitReached && (
        <div
          style={{
            background: "rgba(234,179,8,0.06)",
            border: "1px solid rgba(234,179,8,0.18)",
            borderRadius: 7,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#eab308",
          }}
        >
          Last analysis for today — use it wisely.
        </div>
      )}

      {/* Input grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
          marginBottom: 14,
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Role */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 6,
              }}
            >
              Target Role
            </label>
            <input
              type="text"
              value={role}
              disabled={isLimitReached}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. ML Engineer, Frontend Dev"
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                color: "rgba(255,255,255,0.85)",
                fontSize: 12,
                opacity: isLimitReached ? 0.4 : 1,
              }}
            />
          </div>

          {/* Experience */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 6,
              }}
            >
              Years of Experience <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                inputMode="numeric"
                value={experience}
                disabled={isLimitReached}
                onChange={handleExperienceChange}
                placeholder="0 for fresher"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  paddingRight: expLabel ? "80px" : "12px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${experience === "" ? "rgba(255,255,255,0.1)" : expYears === 0 ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                  borderRadius: 6,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  opacity: isLimitReached ? 0.4 : 1,
                }}
              />
              {expLabel && (
                <span
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: expYears === 0 ? "#ef4444" : "#22c55e",
                    pointerEvents: "none",
                  }}
                >
                  {expLabel}
                </span>
              )}
            </div>
          </div>

          {/* Version */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 6,
              }}
            >
              Resume Version (optional)
            </label>
            <input
              type="text"
              value={resumeVersion}
              disabled={isLimitReached}
              onChange={(e) => setResumeVersion(e.target.value)}
              placeholder="e.g. v1.2, ML-focused"
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                color: "rgba(255,255,255,0.85)",
                fontSize: 12,
                opacity: isLimitReached ? 0.4 : 1,
              }}
            />
          </div>

          {/* Job Type */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 6,
              }}
            >
              Position Type
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isFresherOrUnset ? "1fr 1fr" : "1fr",
                gap: 6,
                padding: 4,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
              }}
            >
              {[
                { value: "job", label: "Full-Time Job" },
                { value: "internship", label: "Internship" },
              ]
                .filter(({ value }) => value === "job" || isFresherOrUnset)
                .map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setJobType(value)}
                    disabled={isLimitReached}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 4,
                      border: `1px solid ${
                        jobType === value
                          ? value === "internship"
                            ? "rgba(129,140,248,0.3)"
                            : "rgba(34,197,94,0.3)"
                          : "transparent"
                      }`,
                      background:
                        jobType === value
                          ? value === "internship"
                            ? "rgba(129,140,248,0.12)"
                            : "rgba(34,197,94,0.12)"
                          : "transparent",
                      color:
                        jobType === value
                          ? value === "internship"
                            ? "#818cf8"
                            : "#22c55e"
                          : "rgba(255,255,255,0.4)",
                      fontSize: 12,
                      fontWeight: jobType === value ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      opacity: isLimitReached ? 0.4 : 1,
                    }}
                  >
                    {label}
                  </button>
                ))}
            </div>
            {!isFresherOrUnset && (
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Internship only available for freshers.
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              label: "Resume",
              value: resume,
              setter: setResume,
              placeholder: "Paste your resume text here...",
            },
            {
              label: "Job Description",
              value: jobDesc,
              setter: setJobDesc,
              placeholder: "Paste the job description here...",
            },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {label}
                </label>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                  {value.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={value}
                disabled={isLimitReached}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%",
                  minHeight: isMobile ? 120 : 148,
                  fontFamily: "monospace",
                  fontSize: 11,
                  lineHeight: 1.7,
                  padding: "9px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.8)",
                  resize: "vertical",
                  opacity: isLimitReached ? 0.4 : 1,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: 6,
            padding: "9px 14px",
            fontSize: 12,
            color: "#ef4444",
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 32,
          alignItems: "center",
        }}
      >
        <button
          onClick={analyze}
          disabled={loading || isLimitReached}
          style={{
            padding: "10px 22px",
            borderRadius: 6,
            border: "none",
            background:
              loading || isLimitReached
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.85)",
            fontSize: 13,
            fontWeight: 700,
            cursor: isLimitReached ? "not-allowed" : "pointer",
            opacity: loading || isLimitReached ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  animation: "spin 1s linear infinite",
                }}
              >
                ◌
              </span>
              Analyzing…
            </span>
          ) : (
            "Analyze Resume"
          )}
        </button>
        {(resume || jobDesc || role || result) && (
          <button
            onClick={() => {
              setResume("");
              setJobDesc("");
              setRole("");
              setResumeVersion("");
              setExperience("");
              setJobType("job");
              setResult(null);
              setError("");
            }}
            style={{
              padding: "10px 16px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div>
          {/* Score + verdict */}
          <div
            style={{
              display: "flex",
              gap: isMobile ? 16 : 24,
              alignItems: "center",
              padding: isMobile ? "16px 18px" : "20px 24px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              marginBottom: 8,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <ScoreRing score={result.matchScore} size={isMobile ? 90 : 100} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 6,
                }}
              >
                Verdict
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.5,
                }}
              >
                {result.verdict}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 7,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                {role && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      fontWeight: 600,
                    }}
                  >
                    {role}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 3,
                    background:
                      result._jobType === "internship"
                        ? "rgba(129,140,248,0.1)"
                        : "rgba(34,197,94,0.08)",
                    color:
                      result._jobType === "internship" ? "#818cf8" : "#22c55e",
                    border:
                      result._jobType === "internship"
                        ? "1px solid rgba(129,140,248,0.2)"
                        : "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  {result._jobType === "internship" ? "Internship" : "Job"}
                </span>
                {expYears !== null && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 3,
                      background:
                        expYears === 0
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(34,197,94,0.08)",
                      color: expYears === 0 ? "#ef4444" : "#22c55e",
                      border:
                        expYears === 0
                          ? "1px solid rgba(239,68,68,0.2)"
                          : "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    {expYears === 0 ? "Fresher" : `${expYears}yr exp`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ATS risk */}
          {result.atsRisk && (
            <div
              style={{
                padding: "9px 16px",
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "rgba(255,255,255,0.3)",
                  marginRight: 10,
                }}
              >
                ATS Risk
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.6,
                }}
              >
                {result.atsRisk}
              </span>
            </div>
          )}

          {/* Section breakdown */}
          <Divider label="Section Scores" />
          {result.sectionScores && (
            <SectionBreakdown
              sections={result.sectionScores}
              jobType={result._jobType}
            />
          )}

          {/* Missing sections banner */}
          {result.missingSections?.length > 0 && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "rgba(239,68,68,0.05)",
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#ef4444",
                  marginBottom: 8,
                }}
              >
                Scored sections not found in resume
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.missingSections.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontWeight: 600,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                    }}
                  >
                    ✕ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Critical gaps */}
          {result.criticalGaps?.length > 0 && (
            <>
              <Divider label="Critical Gaps" />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {result.criticalGaps.map((gap, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      padding: "10px 14px",
                      background: "rgba(239,68,68,0.03)",
                      border: "1px solid rgba(239,68,68,0.1)",
                      borderRadius: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#ef4444",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.65,
                      }}
                    >
                      {gap}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Keywords */}
          <Divider label="Keyword Coverage" />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 8,
                }}
              >
                Missing
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(result.missingKeywords || []).map((kw, i) => (
                  <Tag key={i} text={kw} variant="miss" />
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 8,
                }}
              >
                Matched
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(result.matchedKeywords || []).map((kw, i) => (
                  <Tag key={i} text={kw} variant="hit" />
                ))}
              </div>
            </div>
          </div>

          {/* One thing to fix */}
          {result.oneThingToFix && (
            <>
              <Divider label="Top Priority Fix" />
              <div
                style={{
                  padding: "14px 18px",
                  background: "rgba(129,140,248,0.05)",
                  border: "1px solid rgba(129,140,248,0.18)",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "rgba(129,140,248,0.7)",
                    marginBottom: 7,
                  }}
                >
                  Do this before applying
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.7,
                    fontWeight: 500,
                  }}
                >
                  {result.oneThingToFix}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
      />
    </div>
  );
}
