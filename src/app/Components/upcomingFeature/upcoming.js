"use client";

import { useState, useEffect } from "react";

function useCountdown(target) {
  const calc = () => {
    const diff = Math.max(0, new Date(target) - Date.now());
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

export default function ComingSoon({
  title = "This page is under construction",
  launchDate = "2026-06-20",
  description = null,
}) {
  const { days, hours, minutes, seconds } = useCountdown(launchDate);

  const units = [
    { label: "Days",  value: days },
    { label: "Hours", value: hours },
    { label: "Min",   value: minutes },
    { label: "Sec",   value: seconds },
  ];

  const formattedDate = new Date(launchDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
      padding: "40px 20px",
      textAlign: "center",
    }}>

      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
        textTransform: "uppercase", color: "var(--accent)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Coming Soon
      </span>

      <div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(22px, 4vw, 32px)",
          fontWeight: 800, color: "var(--text-primary)",
          letterSpacing: "-0.4px", margin: 0, lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {description && (
          <p style={{
            fontSize: 13, color: "var(--text-muted)",
            marginTop: 8, fontFamily: "'DM Sans', sans-serif",
            maxWidth: 380, margin: "8px auto 0", lineHeight: 1.6,
          }}>
            {description}
          </p>
        )}
        <p style={{
          fontSize: 13, color: "var(--text-muted)",
          marginTop: 10, fontFamily: "'DM Sans', sans-serif",
        }}>
          Expected release —{" "}
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
            {formattedDate}
          </span>
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {units.map(({ label, value }, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "12px 16px",
              minWidth: 60, textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: 24,
                fontWeight: 800, color: "var(--text-primary)", lineHeight: 1,
              }}>
                {String(value).padStart(2, "0")}
              </div>
              <div style={{
                fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                letterSpacing: "0.8px", marginTop: 5, fontWeight: 600,
              }}>
                {label}
              </div>
            </div>
            {i < units.length - 1 && (
              <span style={{
                color: "var(--border-light)", fontSize: 20,
                fontWeight: 300, lineHeight: 1, marginBottom: 14,
              }}>
                :
              </span>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}