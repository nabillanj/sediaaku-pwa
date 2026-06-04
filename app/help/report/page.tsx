import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";

async function getUserOrders(userUid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.order_status, o.scheduled_date, o.start_time,
              p.name AS partner_name,
              c.name AS category_name, c.emoji AS category_emoji
       FROM orders o
       JOIN partners p ON p.uid = o.partner_uid
       JOIN categories c ON c.id = o.category_id
       WHERE o.user_uid = $1
         AND o.order_status NOT IN ('pending_payment', 'cancelled')
       ORDER BY o.created_at DESC
       LIMIT 20`,
      [userUid]
    );
    return rows;
  } catch {
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

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Dikonfirmasi",
  on_the_way: "Dalam Perjalanan",
  arrived: "Sudah Tiba",
  in_progress: "Berlangsung",
  completed: "Selesai",
};

export default async function ReportSelectOrderPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const orders = await getUserOrders(session.uid);

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
          <Link href="/help" style={{ textDecoration: "none", display: "inline-flex", marginBottom: 20 }}>
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
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Laporkan masalah</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Pilih pesanan yang ingin dilaporkan</div>
        </div>

        <div style={{ padding: "16px 16px 32px" }}>
          {orders.length === 0 ? (
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
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>Belum ada pesanan</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>Kamu belum punya pesanan yang bisa dilaporkan.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orders.map((order) => {
                const isActive = ["confirmed", "on_the_way", "arrived", "in_progress"].includes(order.order_status);
                return (
                  <Link key={order.id} href={`/help/report/${order.id}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{
                      padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: "var(--primary-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, flexShrink: 0,
                      }}>
                        {order.category_emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>
                          #{shortId(order.id)} · {order.category_name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                          {order.partner_name.split(" ")[0]} · {formatDate(order.scheduled_date)} · {order.start_time?.slice(0, 5)}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, borderRadius: 999,
                          padding: "3px 9px",
                          background: isActive ? "var(--primary-100)" : "var(--surface-2)",
                          color: isActive ? "var(--primary-700)" : "var(--text-3)",
                        }}>
                          {STATUS_LABEL[order.order_status] ?? order.order_status}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
