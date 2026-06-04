export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";

async function getMyReports(userUid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.reason, r.detail, r.status, r.resolve_reason, r.created_at,
              o.id AS order_id, o.scheduled_date,
              p.name AS partner_name,
              c.name AS category_name, c.emoji AS category_emoji
       FROM reports r
       JOIN orders o ON o.id = r.order_id
       LEFT JOIN partners p ON p.uid = o.partner_uid
       LEFT JOIN categories c ON c.id = o.category_id
       WHERE o.user_uid = $1 AND r.reporter_type = 'user'
       ORDER BY r.created_at DESC`,
      [userUid]
    );
    return rows;
  } catch (e) {
    console.error("[my-reports] error:", e);
    return [];
  }
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function shortId(uuid: string) {
  return uuid.slice(-4).toUpperCase();
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: {
    label: "Menunggu tinjauan",
    color: "#B45309",
    bg: "#FEF3C7",
  },
  reviewed: {
    label: "Sedang ditinjau",
    color: "var(--primary-700)",
    bg: "var(--primary-50)",
  },
  resolved: {
    label: "Selesai ditangani",
    color: "#065F46",
    bg: "#D1FAE5",
  },
};

const REASON_LABEL: Record<string, string> = {
  profile_mismatch: "Mitra tidak sesuai profil",
  late: "Datang sangat terlambat",
  unsatisfactory: "Pelayanan tidak memuaskan",
  safety: "Masalah keamanan",
  property_damage: "Barang/properti rusak",
  other: "Lainnya",
};

export default async function MyReportsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const reports = await getMyReports(session.uid);

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <div style={{
          background: "var(--grad-hero)", padding: "52px 22px 28px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.13), transparent 60%)",
            top: -60, right: -60, pointerEvents: "none",
          }} />
          <Link href="/profile" style={{ textDecoration: "none", display: "inline-flex", marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </div>
          </Link>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Laporan saya</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
            {reports.length > 0 ? `${reports.length} laporan dikirim` : "Belum ada laporan"}
          </div>
        </div>

        <div style={{ padding: "16px 16px 32px" }}>
          {reports.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "48px 24px",
              background: "var(--surface)", borderRadius: 18,
              border: "1px solid var(--border-soft)",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "var(--primary-50)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--primary)", margin: "0 auto 12px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>Belum ada laporan</div>
              <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 20 }}>
                Kamu belum pernah melaporkan masalah.
              </div>
              <Link href="/help/report" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "inline-block", padding: "10px 24px",
                  background: "var(--primary)", color: "#fff",
                  borderRadius: 12, fontSize: 14, fontWeight: 700,
                }}>
                  Buat laporan
                </div>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reports.map((report) => {
                const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={report.id} className="card" style={{ padding: 16 }}>
                    {/* Top: order info + status badge */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 11,
                        background: "var(--primary-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, flexShrink: 0,
                      }}>
                        {report.category_emoji ?? "📋"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                          #{shortId(report.order_id)} · {report.category_name ?? "Layanan"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>
                          {report.partner_name?.split(" ")[0] ?? "Mitra"} · {formatDate(report.scheduled_date)}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 999,
                        padding: "3px 9px", flexShrink: 0,
                        background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "var(--border-soft)", marginBottom: 12 }} />

                    {/* Reason */}
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Alasan</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: report.detail ? 8 : 0 }}>
                      {REASON_LABEL[report.reason] ?? report.reason}
                    </div>

                    {/* Detail */}
                    {report.detail && (
                      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                        {report.detail}
                      </div>
                    )}

                    {/* Resolve reason (if resolved) */}
                    {report.status === "resolved" && report.resolve_reason && (
                      <div style={{
                        marginTop: 12,
                        background: "#D1FAE5", borderRadius: 10,
                        padding: "10px 12px",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", marginBottom: 4 }}>
                          TINDAK LANJUT TIM SEDIAAKU
                        </div>
                        <div style={{ fontSize: 13, color: "#065F46", lineHeight: 1.6 }}>
                          {report.resolve_reason}
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 12 }}>
                      Dikirim {new Date(report.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
