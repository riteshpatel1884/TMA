// ── Skeleton ──────────────────────────────────────────────────────────────────
function Bone({ w = "100%", h = 12, radius = 6, style = {} }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: "var(--bg-hover)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
          animation: "skeletonShimmer 1.6s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function ChartCardSkeleton({ h = 260 }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "20px",
        marginBottom: 16,
      }}
    >
      <Bone w={140} h={10} style={{ marginBottom: 20 }} />
      <Bone w="100%" h={h} radius={8} />
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Time filter buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[80, 90, 65].map((w, i) => (
          <Bone key={i} w={w} h={32} radius={8} />
        ))}
      </div>

      {/* Insights box */}
      <div
        style={{
          background: "rgba(108,99,255,0.07)",
          border: "1px solid rgba(108,99,255,0.2)",
          borderRadius: "var(--radius)",
          padding: "16px 20px",
          marginBottom: 20,
        }}
      >
        <Bone w={70} h={10} style={{ marginBottom: 14 }} />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              paddingLeft: 14,
              borderLeft: "2px solid rgba(108,99,255,0.3)",
              marginBottom: i < 3 ? 10 : 0,
            }}
          >
            <Bone w={`${60 + i * 10}%`} h={10} />
          </div>
        ))}
      </div>

      {/* KPI cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="stat-card"
          >
            <Bone w={90} h={10} style={{ marginBottom: 10 }} />
            <Bone w={60} h={28} radius={6} style={{ marginBottom: 8 }} />
            <Bone w={70} h={9} />
          </div>
        ))}
      </div>

      {/* Funnel */}
      <ChartCardSkeleton h={80} />

      {/* Status Donut + Work Type Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCardSkeleton h={220} />
        <ChartCardSkeleton h={220} />
      </div>

      {/* Radar */}
      <ChartCardSkeleton h={200} />

      {/* Weekly Trend */}
      <ChartCardSkeleton h={200} />

      {/* Daily Velocity */}
      <ChartCardSkeleton h={100} />

      {/* Platform Bar + Scatter */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartCardSkeleton h={180} />
        <ChartCardSkeleton h={180} />
      </div>

      {/* Tags */}
      <ChartCardSkeleton h={180} />

      {/* Conversion Line */}
      <ChartCardSkeleton h={180} />

      {/* Response Time */}
      <ChartCardSkeleton h={140} />
    </>
  );
}