"use client";

export function EarningsChart({
  months,
}: {
  months: { label: string; total: number; isCurrent: boolean }[];
}) {
  const max = Math.max(...months.map((m) => m.total), 1);
  const BAR_W = 36;
  const GAP = 10;
  const MAX_H = 80;
  const N = months.length;
  const svgW = N * BAR_W + (N - 1) * GAP;
  const currentIdx = months.findIndex((m) => m.isCurrent);
  const currentMonth = months[currentIdx];
  const prevMonth = currentIdx > 0 ? months[currentIdx - 1] : null;

  const pctChange =
    prevMonth && prevMonth.total > 0
      ? Math.round(((currentMonth.total - prevMonth.total) / prevMonth.total) * 100)
      : null;

  function rp(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}jt`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
    return `${n}`;
  }

  return (
    <div style={{ padding: "16px 16px 12px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 2 }}>Pendapatan bulan ini</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)" }}>
            Rp {currentMonth?.total.toLocaleString("id-ID") ?? "0"}
          </div>
        </div>
        {pctChange !== null && (
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: pctChange >= 0 ? "#16a34a" : "#dc2626",
            background: pctChange >= 0 ? "#dcfce7" : "#fee2e2",
            borderRadius: 20, padding: "3px 10px", marginTop: 4,
          }}>
            {pctChange >= 0 ? "↑" : "↓"} {Math.abs(pctChange)}% vs bulan lalu
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: GAP, marginTop: 16 }}>
        {months.map((m, i) => {
          const h = max === 0 ? 6 : Math.max(6, Math.round((m.total / max) * MAX_H));
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              {m.isCurrent && m.total > 0 && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "var(--primary)",
                  marginBottom: 4, whiteSpace: "nowrap",
                }}>
                  {rp(m.total)}
                </div>
              )}
              {!(m.isCurrent && m.total > 0) && <div style={{ marginBottom: 4, height: 16 }} />}
              <div style={{
                width: "100%", height: h, borderRadius: 8,
                background: m.isCurrent ? "var(--primary)" : "var(--primary-50, #b2ddd7)",
                opacity: m.isCurrent ? 1 : m.total === 0 ? 0.25 : 0.45,
                transition: "height 0.3s ease",
              }} />
              <div style={{
                fontSize: 10, fontWeight: 600,
                color: m.isCurrent ? "var(--primary)" : "var(--text-3)",
                marginTop: 6, whiteSpace: "nowrap",
              }}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
