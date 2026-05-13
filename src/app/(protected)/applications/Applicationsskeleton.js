"use client";

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

export default function ApplicationsSkeleton() {
  const COLS = ["Company", "Role", "Type", "Platform", "Applied", "Response", "Priority", "Next Action", "Status", "Actions"];

  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Quick Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: "1 1 90px",
              minWidth: 80,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Bone w={40} h={22} radius={6} />
            <Bone w="70%" h={9} />
          </div>
        ))}
        <div
          style={{
            flex: "2 1 160px",
            minWidth: 140,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Bone w={24} h={18} radius={4} />
          <Bone w={90} h={15} radius={6} />
          <Bone w="80%" h={9} />
        </div>
      </div>

      {/* Filters bar */}
      <div className="filters-bar" style={{ marginBottom: 10 }}>
        <Bone w={200} h={34} radius={8} />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Bone key={i} w={110} h={34} radius={8} />
        ))}
      </div>

      {/* Result count */}
      <div style={{ marginBottom: 10 }}>
        <Bone w={80} h={10} />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="jobs-table">
          <thead>
            <tr>
              {COLS.map((col) => (
                <th key={col}>
                  <Bone w="70%" h={9} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }).map((_, i) => (
              <tr key={i}>
                <td className="company-cell">
                  <Bone w="80%" h={11} style={{ marginBottom: 6 }} />
                  <Bone w="50%" h={9} />
                </td>
                <td><Bone w="85%" h={11} /></td>
                <td><Bone w={56} h={20} radius={20} /></td>
                <td><Bone w={70} h={11} /></td>
                <td>
                  <Bone w={60} h={11} style={{ marginBottom: 5 }} />
                  <Bone w={45} h={9} />
                </td>
                <td><Bone w={40} h={11} /></td>
                <td><Bone w={52} h={20} radius={20} /></td>
                <td><Bone w={65} h={11} /></td>
                <td><Bone w={72} h={26} radius={20} /></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Bone w={40} h={28} radius={8} />
                    <Bone w={28} h={28} radius={8} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}