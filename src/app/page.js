"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useTheme } from "../utils/themeProvider/Themeprovider"; // adjust path

/* ─── Static demo data shown in the mock dashboard ─── */
const FUNNEL = [
  { label: "Applied", value: 24, color: "#60a5fa" },
  { label: "Interview", value: 8, color: "#f59e0b" },
  { label: "Offer", value: 2, color: "#34d399" },
];

/* Weekly trend data — applied & interviews over 8 weeks */
const TREND_DATA = [
  { label: "Mar 16", applied: 1, interviews: 0 },
  { label: "Mar 23", applied: 1, interviews: 0 },
  { label: "Mar 30", applied: 2, interviews: 0 },
  { label: "Apr 6",  applied: 2, interviews: 1 },
  { label: "Apr 13", applied: 3, interviews: 1 },
  { label: "Apr 27", applied: 4, interviews: 1 },
  { label: "May 4",  applied: 5, interviews: 2 },
  { label: "May 11", applied: 7, interviews: 2 },
];

const FEATURES = [
  {
    icon: "📊",
    title: "Visual Analytics",
    desc: "Track your application funnel, conversion rate, and success metrics in real time.",
  },
  {
    icon: "🗓️",
    title: "Timeline View",
    desc: "See applications over time and spot the best windows to apply for maximum response.",
  },
  {
    icon: "🤝",
    title: "Resume Matcher",
    desc: "Match your resume to job descriptions and boost your interview call-back rate.",
  },
  {
    icon: "🎯",
    title: "Prep Tracker",
    desc: "Log interview rounds, notes, and prep tasks so you walk in fully confident.",
  },
  {
    icon: "🔔",
    title: "Smart Reminders",
    desc: "Never let a follow-up slip. Get nudged at the right time for every application.",
  },
  {
    icon: "🌗",
    title: "Light & Dark Mode",
    desc: "Pristine in daylight, easy on the eyes at midnight. Your tracker, your vibe.",
  },
];

/* ─── Donut chart (SVG) — larger, gap-separated segments ─── */
function DonutChart() {
  const data = [
    { pct: 0.48, color: "#60a5fa", label: "Applied" },
    { pct: 0.16, color: "#f59e0b", label: "Interview" },
    { pct: 0.08, color: "#34d399", label: "Offer" },
    { pct: 0.28, color: "#f87171", label: "Rejected" },
  ];
  const r = 40;
  const cx = 56;
  const cy = 56;
  const circ = 2 * Math.PI * r;
  const GAP = 3; // gap between segments in px
  let cumAngle = -90; // start at top
  const segments = data.map((d) => {
    const angle = d.pct * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { ...d, startAngle, angle };
  });
  function polarToXY(angleDeg, radius) {
    const rad = (angleDeg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }
  function segmentPath(startAngle, angle, r, gapDeg = 2) {
    const s = startAngle + gapDeg / 2;
    const e = startAngle + angle - gapDeg / 2;
    const innerR = r - 14;
    const [x1, y1] = polarToXY(s, r);
    const [x2, y2] = polarToXY(e, r);
    const [x3, y3] = polarToXY(e, innerR);
    const [x4, y4] = polarToXY(s, innerR);
    const large = angle - gapDeg > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} L${x3},${y3} A${innerR},${innerR},0,${large},0,${x4},${y4} Z`;
  }
  return (
    <svg viewBox="0 0 112 112" style={{ width: 100, height: 100 }}>
      {segments.map((seg, i) => (
        <path
          key={i}
          d={segmentPath(seg.startAngle, seg.angle, r)}
          fill={seg.color}
          opacity="0.92"
        />
      ))}
      {/* center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="800" fontFamily="Syne, sans-serif">24</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="7" fontFamily="DM Sans, sans-serif">total</text>
    </svg>
  );
}

/* ─── Mini area/line trend chart (pure SVG, no deps) ─── */
function MiniTrendChart() {
  const W = 280, H = 90;
  const PAD = { top: 8, right: 8, bottom: 22, left: 20 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...TREND_DATA.map((d) => d.applied));
  const n = TREND_DATA.length;

  const xOf = (i) => PAD.left + (i / (n - 1)) * innerW;
  const yOf = (v) => PAD.top + innerH - (v / maxVal) * innerH;

  // smooth cubic bezier path helper
  function smoothPath(points) {
    if (points.length < 2) return "";
    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      const cpX = (x0 + x1) / 2;
      d += ` C${cpX},${y0} ${cpX},${y1} ${x1},${y1}`;
    }
    return d;
  }

  const appliedPts  = TREND_DATA.map((d, i) => [xOf(i), yOf(d.applied)]);
  const interviewPts = TREND_DATA.map((d, i) => [xOf(i), yOf(d.interviews)]);

  const appliedLine   = smoothPath(appliedPts);
  const interviewLine = smoothPath(interviewPts);

  // area fill: line path + close along bottom
  const appliedArea = appliedLine
    + ` L${xOf(n - 1)},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z`;

  // x-axis labels — show 3 evenly spaced
  const labelIdxs = [0, 3, 7];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      <defs>
        {/* blue area gradient */}
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.02" />
        </linearGradient>
        {/* subtle grid line */}
      </defs>

      {/* grid lines */}
      {[0, 0.5, 1].map((t, i) => {
        const y = PAD.top + t * innerH;
        return (
          <line key={i} x1={PAD.left} x2={PAD.left + innerW}
            y1={y} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            strokeDasharray="3 4"
          />
        );
      })}

      {/* y-axis value labels */}
      {[0, Math.round(maxVal / 2), maxVal].map((v, i) => (
        <text key={i}
          x={PAD.left - 4}
          y={yOf(v) + 3}
          textAnchor="end"
          fontSize="5.5"
          fill="rgba(138,158,150,0.7)"
          fontFamily="DM Sans, sans-serif"
        >{v}</text>
      ))}

      {/* filled area under applied */}
      <path d={appliedArea} fill="url(#areaGrad)" />

      {/* applied line */}
      <path d={appliedLine} fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* interviews line */}
      <path d={interviewLine} fill="none" stroke="#f59e0b" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />

      {/* dots on last point */}
      <circle cx={appliedPts[n-1][0]} cy={appliedPts[n-1][1]} r="3" fill="#60a5fa" stroke="var(--bg)" strokeWidth="1.2" />
      <circle cx={interviewPts[n-1][0]} cy={interviewPts[n-1][1]} r="3" fill="#f59e0b" stroke="var(--bg)" strokeWidth="1.2" />

      {/* tooltip callout on last point */}
      <rect
        x={appliedPts[n-1][0] - 38} y={PAD.top - 2}
        width="36" height="20" rx="3"
        fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.8"
      />
      <text x={appliedPts[n-1][0] - 20} y={PAD.top + 7} textAnchor="middle"
        fontSize="5" fontWeight="700" fill="var(--text-primary)" fontFamily="Syne, sans-serif">
        May 11
      </text>
      <text x={appliedPts[n-1][0] - 20} y={PAD.top + 14} textAnchor="middle"
        fontSize="4.5" fill="var(--text-muted)" fontFamily="DM Sans, sans-serif">
        Applied: <tspan fill="#60a5fa" fontWeight="700">7</tspan>
        {"  "}Int: <tspan fill="#f59e0b" fontWeight="700">2</tspan>
      </text>

      {/* x-axis labels */}
      {labelIdxs.map((idx) => (
        <text key={idx}
          x={xOf(idx)} y={H - 4}
          textAnchor="middle" fontSize="5.5"
          fill="rgba(138,158,150,0.7)"
          fontFamily="DM Sans, sans-serif"
        >{TREND_DATA[idx].label}</text>
      ))}
    </svg>
  );
}

/* ─── Animated counter ─── */
function Counter({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        let start = 0;
        const step = Math.ceil(target / 40);
        const t = setInterval(() => {
          start = Math.min(start + step, target);
          setVal(start);
          if (start >= target) clearInterval(t);
        }, 30);
      },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ─── Main Page ─── */
export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Redirect signed-in users straight to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) return null; // avoid flash

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .ll-page { min-height: 100vh; background: var(--bg); color: var(--text-primary); font-family: 'DM Sans', sans-serif; }

        /* ── NAV ── */
        .ll-nav {
          position: sticky; top: 0; z-index: 80;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 60px;
          background: var(--bg-card); border-bottom: 1px solid var(--border);
          backdrop-filter: blur(12px);
        }
        .ll-nav-logo { font-family: sans-serif; font-size: 18px; font-weight: 800; color: var(--text-primary); }
        .ll-nav-logo span { color: var(--accent); }
        .ll-nav-right { display: flex; align-items: center; gap: 10px; }

        /* ── THEME TOGGLE ── */
        .theme-toggle {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 20px; width: 42px; height: 24px;
          cursor: pointer; position: relative; transition: background 0.2s;
          flex-shrink: 0;
        }
        .theme-toggle-thumb {
          position: absolute; top: 3px; width: 18px; height: 18px;
          border-radius: 50%; background: var(--accent); transition: left 0.2s;
        }
        .theme-toggle-thumb.dark { left: 3px; }
        .theme-toggle-thumb.light { left: 21px; }

        /* ── HERO ── */
        .ll-hero {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 40px; align-items: center;
          max-width: 1200px; margin: 0 auto;
          padding: 40px 40px 60px;
        }
        .ll-hero-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          border-radius: 20px; padding: 4px 14px;
          font-size: 12px; font-weight: 600; color: var(--accent);
          margin-bottom: 20px;
        }
        .ll-hero h1 {
          font-family: sans-serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 800; line-height: 1.1;
          color: var(--text-primary); margin-bottom: 18px;
          letter-spacing: -1px;
        }
        .ll-hero h1 em { color: var(--accent); font-style: normal; }
        .ll-hero-desc {
          font-size: 15px; color: var(--text-secondary);
          line-height: 1.7; max-width: 440px; margin-bottom: 32px;
        }
        .ll-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }

        .btn-cta-primary {
          background: var(--accent); color: #050f0c;
          border: none; padding: 12px 28px;
          border-radius: 8px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background 0.15s, transform 0.1s;
          text-decoration: none; display: inline-flex; align-items: center; gap: 7px;
        }
        .btn-cta-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }

        .btn-cta-ghost {
          background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); padding: 12px 22px;
          border-radius: 8px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.15s; text-decoration: none;
          display: inline-flex; align-items: center; gap: 7px;
        }
        .btn-cta-ghost:hover { border-color: var(--accent); color: var(--accent); }

        /* ── MOCK DASHBOARD WRAPPER (tilted) ── */
        .mock-dashboard-wrap {
          position: relative; perspective: 1000px;
        }
        .mock-dashboard-wrap::before {
          content: ''; position: absolute; inset: 30px -10px -20px;
          background: var(--accent); opacity: 0.07;
          border-radius: 20px; filter: blur(40px); z-index: 0;
        }
        .mock-dashboard {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px var(--border);
          animation: floatTilt 5s ease-in-out infinite;
          position: relative; z-index: 1;
          transform: perspective(900px) rotateY(-6deg) rotateX(3deg);
        }
        @keyframes floatTilt {
          0%, 100% { transform: perspective(900px) rotateY(-6deg) rotateX(3deg) translateY(0); }
          50%       { transform: perspective(900px) rotateY(-6deg) rotateX(3deg) translateY(-10px); }
        }
        .mock-topbar {
          background: var(--bg); border-bottom: 1px solid var(--border);
          padding: 11px 16px; display: flex; align-items: center;
          justify-content: space-between;
        }
        .mock-topbar-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; }
        .mock-topbar-sub { font-size: 10px; color: var(--text-muted); }
        .mock-add-btn {
          background: var(--accent); color: #050f0c;
          border: none; padding: 5px 12px; border-radius: 6px;
          font-size: 10px; font-weight: 700; cursor: default; white-space: nowrap;
        }
        .mock-body { padding: 12px; }

        .mock-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 10px; }
        .mock-stat {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 8px; padding: 9px 10px;
        }
        .mock-stat-label { font-size: 8px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 3px; }
        .mock-stat-value { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; line-height: 1; }

        .mock-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .mock-chart-card {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 11px;
        }
        .mock-chart-title {
          font-size: 8px; color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.7px; margin-bottom: 9px; font-weight: 600;
        }

        /* funnel */
        .mock-funnel { display: flex; align-items: center; gap: 4px; }
        .funnel-box {
          border-radius: 7px; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          font-family: sans-serif; font-weight: 800;
          font-size: 14px; color: #050f0c;
          padding: 9px 5px; flex: 1; gap: 1px;
        }
        .funnel-label { font-size: 7px; font-weight: 600; font-family: 'DM Sans', sans-serif; color: rgba(0,0,0,0.65); }
        .funnel-arrow { color: var(--text-muted); font-size: 11px; flex-shrink: 0; }
        .funnel-rejected { font-size: 7px; color: var(--red); margin-top: 5px; text-align: right; }

        /* donut + legend */
        .mock-donut-row { display: flex; align-items: center; gap: 10px; }
        .mock-donut-legend { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .legend-item {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 9px; color: var(--text-secondary);
        }
        .legend-left { display: flex; align-items: center; gap: 5px; }
        .legend-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .legend-val { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 9px; color: var(--text-primary); }

        /* trend chart card */
        .trend-chart-wrap { width: 100%; }
        .trend-legend { display: flex; gap: 10px; margin-top: 6px; justify-content: center; }
        .trend-legend-item { display: flex; align-items: center; gap: 4px; font-size: 7.5px; color: var(--text-muted); }
        .trend-legend-dot { width: 5px; height: 5px; border-radius: 50%; }
        .trend-legend-dash { width: 10px; height: 1.5px; background: #f59e0b; border-radius: 2px; opacity: 0.8; }

        /* ── STATS STRIP ── */
        .ll-stats-strip {
          border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
          background: var(--bg-card);
        }
        .ll-stats-strip-inner {
          max-width: 1200px; margin: 0 auto; padding: 40px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
        }
        .strip-stat { text-align: center; padding: 0 20px; position: relative; }
        .strip-stat + .strip-stat::before {
          content: ''; position: absolute; left: 0; top: 10%; height: 80%;
          width: 1px; background: var(--border);
        }
        .strip-stat-value {
          font-family: 'Syne', sans-serif; font-size: 42px; font-weight: 800;
          color: var(--accent); line-height: 1;
        }
        .strip-stat-label { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

        /* ── FEATURES ── */
        .ll-features { max-width: 1200px; margin: 0 auto; padding: 80px 40px; }
        .ll-section-eyebrow {
          font-size: 12px; font-weight: 600; color: var(--accent);
          text-transform: uppercase; letter-spacing: 1.5px;
          margin-bottom: 10px; text-align: center;
        }
        .ll-section-title {
          font-family: sans-serif; font-size: clamp(26px, 3vw, 38px);
          font-weight: 800; color: var(--text-primary);
          text-align: center; margin-bottom: 48px; letter-spacing: -0.5px;
        }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .feature-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 12px; padding: 24px;
          transition: border-color 0.15s, transform 0.15s;
        }
        .feature-card:hover { border-color: var(--accent-border); transform: translateY(-3px); }
        .feature-icon { font-size: 28px; margin-bottom: 12px; }
        .feature-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
        .feature-desc { font-size: 13px; color: var(--text-muted); line-height: 1.65; }

        /* ── CTA BANNER ── */
        .ll-cta-banner {
          max-width: 1200px; margin: 0 auto 80px; padding: 0 40px;
        }
        .cta-inner {
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          border-radius: 16px; padding: 56px 40px;
          text-align: center;
        }
        .cta-inner h2 { font-family: sans-serif; font-size: clamp(24px, 3vw, 36px); font-weight: 800; color: var(--text-primary); margin-bottom: 12px; }
        .cta-inner p { font-size: 15px; color: var(--text-secondary); margin-bottom: 28px; }

        /* ── FOOTER ── */
        .ll-footer {
          border-top: 1px solid var(--border);
          padding: 24px 40px;
          display: flex; align-items: center; justify-content: space-between;
          max-width: 1200px; margin: 0 auto;
        }
        .ll-footer-logo { font-family: sans-serif; font-size: 14px; font-weight: 800; color: var(--text-muted); }
        .ll-footer-logo span { color: var(--accent); }
        .ll-footer-copy { font-size: 12px; color: var(--text-muted); }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .ll-hero { grid-template-columns: 1fr; padding: 48px 24px 40px; }
          .mock-stats { grid-template-columns: repeat(2, 1fr); }
          .mock-charts { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .ll-stats-strip-inner { grid-template-columns: 1fr; gap: 24px; }
          .strip-stat + .strip-stat::before { display: none; }
          .ll-nav { padding: 0 20px; }
          .ll-footer { flex-direction: column; gap: 8px; text-align: center; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          .ll-hero h1 { font-size: 28px; }
          .ll-features, .ll-cta-banner { padding: 48px 20px; }
        }
      `}</style>

      <div className="ll-page">
        {/* NAV */}
        <nav className="ll-nav">
          <div className="ll-nav-logo">
            Leader<span>Lab.</span>
          </div>
          <div className="ll-nav-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <div className={`theme-toggle-thumb ${theme}`} />
            </button>
            <SignInButton mode="modal">
              <button className="btn-cta-ghost" style={{ padding: "7px 16px", fontSize: 13 }}>
                Sign in
              </button>
            </SignInButton>
           
          </div>
        </nav>

        {/* HERO */}
        <section className="ll-hero">
          <div>
           
            <h1>
              Your Job Search,<br />
              Finally <em>Under Control</em>
            </h1>
            <p className="ll-hero-desc">
              LeaderLab is a placement tracker that turns scattered applications into a clean, visual command centre — so you always know where you stand and what to do next.
            </p>
            <div className="ll-hero-ctas">
              <SignUpButton mode="modal">
                <button className="btn-cta-primary">
                  Start Tracking Free
                </button>
              </SignUpButton>
             
            </div>
          </div>

          {/* MOCK DASHBOARD PREVIEW — tilted */}
          <div className="mock-dashboard-wrap">
            <div className="mock-dashboard">
              <div className="mock-topbar">
                <div>
                  <div className="mock-topbar-title">Analytics</div>
                  <div className="mock-topbar-sub">Total 24 applications tracked</div>
                </div>
                <div className="mock-add-btn">+ Add Application</div>
              </div>
              <div className="mock-body">
                {/* stat row */}
                <div className="mock-stats">
                  <div className="mock-stat">
                    <div className="mock-stat-label">Total Applied</div>
                    <div className="mock-stat-value" style={{ color: "var(--accent)" }}>24</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-label">Interviews</div>
                    <div className="mock-stat-value" style={{ color: "var(--yellow)" }}>8</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-label">Offers</div>
                    <div className="mock-stat-value" style={{ color: "var(--green)" }}>2</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-label">Success Rate</div>
                    <div className="mock-stat-value" style={{ color: "var(--green)", fontSize: 16 }}>8.3%</div>
                  </div>
                </div>

                {/* charts */}
                <div className="mock-charts">
                  {/* funnel — fixed: key on outer element, no bare fragment */}
                  <div className="mock-chart-card">
                    <div className="mock-chart-title">Application Funnel · 8.3% rate</div>
                    <div className="mock-funnel">
                      {FUNNEL.map((f, i) => (
                        <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                          <div
                            className="funnel-box"
                            style={{ background: f.color, flex: 1 }}
                          >
                            {f.value}
                            <div className="funnel-label">{f.label}</div>
                          </div>
                          {i < FUNNEL.length - 1 && (
                            <div className="funnel-arrow">→</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="funnel-rejected">Rejected: 14</div>
                  </div>

                  {/* donut with improved legend */}
                  <div className="mock-chart-card">
                    <div className="mock-chart-title">Status Distribution</div>
                    <div className="mock-donut-row">
                      <DonutChart />
                      <div className="mock-donut-legend">
                        {[
                          { label: "Applied", color: "#60a5fa", val: "48%" },
                          { label: "Interview", color: "#f59e0b", val: "16%" },
                          { label: "Offer", color: "#34d399", val: "8%" },
                          { label: "Rejected", color: "#f87171", val: "28%" },
                        ].map((l) => (
                          <div className="legend-item" key={l.label}>
                            <div className="legend-left">
                              <div className="legend-dot" style={{ background: l.color }} />
                              <span>{l.label}</span>
                            </div>
                            <span className="legend-val">{l.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* weekly trend chart — full width */}
                  <div className="mock-chart-card" style={{ gridColumn: "1 / -1" }}>
                    <div className="mock-chart-title">Weekly Application Trend</div>
                    <div className="trend-chart-wrap">
                      <MiniTrendChart />
                      <div className="trend-legend">
                        <div className="trend-legend-item">
                          <div className="trend-legend-dot" style={{ background: "#60a5fa" }} />
                          Applied
                        </div>
                        <div className="trend-legend-item">
                          <div className="trend-legend-dash" />
                          Interviews
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <div className="ll-stats-strip">
          <div className="ll-stats-strip-inner">
            <div className="strip-stat">
              <div className="strip-stat-value">
                <Counter target={2400} suffix="+" />
              </div>
              <div className="strip-stat-label">Applications Tracked</div>
            </div>
            <div className="strip-stat">
              <div className="strip-stat-value">
                <Counter target={89} suffix="%" />
              </div>
              <div className="strip-stat-label">Users land interviews faster</div>
            </div>
            <div className="strip-stat">
              <div className="strip-stat-value">
                <Counter target={100} suffix="%" />
              </div>
              <div className="strip-stat-label">Free to get started</div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <section className="ll-features">
          <p className="ll-section-eyebrow">Everything you need</p>
          <h2 className="ll-section-title">Built for serious job seekers</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BANNER */}
        <div className="ll-cta-banner">
          <div className="cta-inner">
            <h2>Ready to take control of your job search?</h2>
            <p>Join hundreds of candidates who track smarter and land faster with LeaderLab.</p>
            <SignUpButton mode="modal">
              <button className="btn-cta-primary" style={{ margin: "0 auto", fontSize: 15, padding: "14px 36px" }}>
               Create Free Account
              </button>
            </SignUpButton>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid var(--border)" }}>
          <div className="ll-footer">
            <div className="ll-nav-logo">Leader<span>Lab.</span></div>
            <div className="ll-footer-copy">© {new Date().getFullYear()} LeaderLab. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </>
  );
}