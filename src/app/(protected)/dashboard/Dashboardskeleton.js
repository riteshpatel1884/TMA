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

export default function DashboardSkeleton() {
  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Streak row — 3 cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="card" style={{ gap: 0 }}>
            <Bone w={70} h={10} style={{ marginBottom: 10 }} />
            <Bone w={90} h={30} radius={8} style={{ marginBottom: 10 }} />
            <Bone w="60%" h={9} />
          </div>
        ))}
      </div>

      {/* Today's Plan */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <Bone w={100} h={12} style={{ marginBottom: 6 }} />
            <Bone w={70} h={9} />
          </div>
          <Bone w={70} h={28} radius={8} />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              marginBottom: 6,
            }}
          >
            <Bone w={16} h={16} radius={4} style={{ flexShrink: 0 }} />
            <Bone w={`${55 + i * 10}%`} h={10} />
          </div>
        ))}
      </div>

      

      {/* Activity Timeline */}
      <div className="card" style={{ marginBottom: 20 }}>
        <Bone w={130} h={12} style={{ marginBottom: 16 }} />
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 1, background: "var(--border)" }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", gap: 16, paddingBottom: i < 5 ? 16 : 0 }}>
              <Bone w={14} h={14} radius={99} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <Bone w={`${40 + i * 8}%`} h={10} />
                  <Bone w={50} h={9} />
                </div>
                <Bone w="55%" h={9} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Bone w={150} h={12} />
          <Bone w={55} h={26} radius={8} />
        </div>
        <div className="table-wrapper" style={{ border: "none" }}>
          <table className="jobs-table">
            <thead>
              <tr>
                {["Company", "Role", "Platform", "Applied", "Status"].map((col) => (
                  <th key={col}><Bone w="70%" h={9} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td><Bone w="80%" h={10} /></td>
                  <td><Bone w="90%" h={10} /></td>
                  <td><Bone w="60%" h={10} /></td>
                  <td><Bone w={50} h={10} /></td>
                  <td><Bone w={60} h={22} radius={20} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}