import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";

async function getRiwayatData(uid: string, status: string, q: string) {
  // Stats for current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const { rows: statsRows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE order_status='completed' AND scheduled_date >= $2) AS jobs_month,
       COALESCE(AVG(r.rating) FILTER (WHERE r.rating IS NOT NULL), 0) AS avg_rating,
       COALESCE(SUM(o.partner_earning) FILTER (WHERE o.order_status='completed'), 0) AS total_earning
     FROM orders o
     LEFT JOIN reviews r ON r.order_id = o.id
     WHERE o.partner_uid = $1`,
    [uid, monthStart]
  );
  const stats = statsRows[0];

  // Order list with filter
  const validStatus = ["completed", "cancelled", "rejected", "pending_payment", "confirmed", "ongoing"];
  const params: unknown[] = [uid];
  let statusFilter = "";
  if (status && validStatus.includes(status)) {
    params.push(status);
    statusFilter = `AND o.order_status = $${params.length}`;
  }
  let searchFilter = "";
  if (q) {
    params.push(`%${q}%`);
    searchFilter = `AND (u.name ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
  }

  const { rows: orders } = await pool.query(
    `SELECT
       o.id, o.scheduled_date, o.start_time, o.end_time,
       o.order_status, o.partner_earning,
       u.name AS user_name,
       c.name AS category_name, c.emoji AS category_emoji,
       r.rating, r.comment
     FROM orders o
     JOIN users u ON u.uid = o.user_uid
     JOIN categories c ON c.id = o.category_id
     LEFT JOIN reviews r ON r.order_id = o.id
     WHERE o.partner_uid = $1
       ${statusFilter}
       ${searchFilter}
     ORDER BY o.scheduled_date DESC, o.start_time DESC
     LIMIT 50`,
    params
  );

  return { stats, orders };
}

function rp(n: number) {
  const abs = Number(n);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1).replace(".0", "")}jt`;
  if (abs >= 1_000) return `${Math.round(abs / 1_000)}rb`;
  return `Rp ${abs.toLocaleString("id-ID")}`;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  completed:       { label: "Selesai",          color: "#16a34a", bg: "#dcfce7" },
  cancelled:       { label: "Dibatalkan",        color: "#d97706", bg: "#fef3c7" },
  rejected:        { label: "Ditolak",           color: "#dc2626", bg: "#fee2e2" },
  confirmed:       { label: "Dikonfirmasi",      color: "#2563eb", bg: "#dbeafe" },
  accepted:        { label: "Diterima Mitra",    color: "#0891b2", bg: "#cffafe" },
  ongoing:         { label: "Berlangsung",       color: "#7c3aed", bg: "#ede9fe" },
  pending_payment: { label: "Pending Payment",   color: "#92400e", bg: "#fef3c7" },
};

const TABS = [
  { key: "", label: "Semua" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
  { key: "rejected",  label: "Ditolak" },
];

export default async function RiwayatJobPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "partner") redirect("/home");

  const { status = "", q = "" } = await searchParams;
  const { stats, orders } = await getRiwayatData(session.uid, status, q);

  const avgRating = Number(stats?.avg_rating ?? 0);
  const totalEarning = Number(stats?.total_earning ?? 0);
  const jobsMonth = Number(stats?.jobs_month ?? 0);

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 32 }}>

        {/* AppBar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "var(--surface)", borderBottom: "1px solid var(--border-soft)",
          padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Link href="/mitra/saldo" style={{ textDecoration: "none", display: "inline-flex" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "var(--bg)", border: "1px solid var(--border-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </div>
          </Link>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: "var(--text-1)" }}>Riwayat</span>
          <form method="GET" action="/mitra/saldo/riwayat" style={{ display: "contents" }}>
            {status && <input type="hidden" name="status" value={status} />}
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg)", borderRadius: 10,
              padding: "7px 12px", border: "1px solid var(--border-soft)",
              flex: 1, maxWidth: 180,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari nama, layanan…"
                style={{
                  border: "none", background: "transparent", outline: "none",
                  fontSize: 13, color: "var(--text-1)", fontFamily: "inherit", width: "100%",
                }}
              />
            </label>
          </form>
        </div>

        {/* Stats */}
        <div style={{ padding: "16px 16px 0" }}>
          <div className="card" style={{
            padding: 0, overflow: "hidden",
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          }}>
            {[
              { label: "Job selesai", sub: "bulan ini", value: jobsMonth },
              { label: "Rating", sub: "rata-rata", value: avgRating > 0 ? avgRating.toFixed(1) : "—" },
              {
                label: "Total pendapatan",
                sub: "semua job, sebelum pencairan",
                value: totalEarning >= 1_000_000
                  ? `${(totalEarning / 1_000_000).toFixed(1).replace(".0", "")}jt`
                  : totalEarning >= 1_000
                  ? `${Math.round(totalEarning / 1_000)}rb`
                  : `${totalEarning}`,
              },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "14px 10px", textAlign: "center",
                borderRight: i < 2 ? "1px solid var(--border-soft)" : "none",
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3, lineHeight: 1.4 }}>{s.label}</div>
                <div style={{ fontSize: 9, color: "var(--text-3)", opacity: 0.7, lineHeight: 1.3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 8, padding: "14px 16px 0",
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          {TABS.map((tab) => {
            const isActive = status === tab.key;
            const href = `/mitra/saldo/riwayat${tab.key ? `?status=${tab.key}` : ""}${q ? `${tab.key ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`;
            return (
              <Link key={tab.key} href={href} style={{ textDecoration: "none", flexShrink: 0 }}>
                <div style={{
                  padding: "7px 16px", borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                  background: isActive ? "var(--primary)" : "var(--bg)",
                  color: isActive ? "#fff" : "var(--text-3)",
                  border: isActive ? "none" : "1px solid var(--border-soft)",
                }}>
                  {tab.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Order list */}
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "var(--primary-50)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--primary)", margin: "0 auto 12px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Tidak ada job ditemukan</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Coba ubah filter atau kata pencarian</div>
            </div>
          ) : (
            orders.map((o) => {
              const s = statusMap[o.order_status] ?? { label: o.order_status, color: "#6b7280", bg: "#f3f4f6" };
              const dateStr = new Date(o.scheduled_date).toLocaleDateString("id-ID", {
                day: "numeric", month: "short", year: "numeric",
              });
              return (
                <div key={o.id} className="card" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: "var(--primary-50)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                    }}>
                      {o.category_emoji ?? "🛠"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {o.user_name}
                        </div>
                        {o.order_status === "completed" && (
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                            +Rp {Number(o.partner_earning).toLocaleString("id-ID")}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                        {o.category_name} · {dateStr}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: s.color, background: s.bg,
                          borderRadius: 6, padding: "2px 8px",
                        }}>
                          {s.label}
                        </span>
                        {o.rating != null && (
                          <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 3 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                              <path d="M12 2l3 7h7l-5.7 4.2L18 21l-6-4-6 4 1.7-7.8L2 9h7z"/>
                            </svg>
                            {Number(o.rating).toFixed(1)}
                          </span>
                        )}
                        {o.start_time && o.end_time && (
                          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                            {String(o.start_time).slice(0, 5)}–{String(o.end_time).slice(0, 5)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {o.comment && (
                    <div style={{
                      marginTop: 10, padding: "8px 10px",
                      background: "var(--bg)", borderRadius: 8,
                      fontSize: 12, color: "var(--text-2)", fontStyle: "italic",
                    }}>
                      "{o.comment}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
