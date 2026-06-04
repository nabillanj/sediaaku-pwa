import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { TabBar } from "@/components/TabBar";
import pool from "@/lib/db";
import Link from "next/link";
import OrderTabs from "./OrderTabs";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function statusLabel(status: string, paymentStatus?: string) {
  if (status === "pending_payment" && paymentStatus === "failed") {
    return { text: "Pembayaran Ditolak", color: "var(--danger)", bg: "var(--danger-bg)" };
  }
  const map: Record<string, { text: string; color: string; bg: string }> = {
    pending_payment: { text: "Menunggu Verifikasi Pembayaran", color: "var(--warn)", bg: "var(--warn-bg)" },
    confirmed:       { text: "Dikonfirmasi",        color: "var(--info)",       bg: "var(--info-bg)" },
    accepted:        { text: "Jadwal Dikonfirmasi", color: "var(--info)",       bg: "var(--info-bg)" },
    on_the_way:      { text: "Dalam Perjalanan", color: "var(--primary)", bg: "var(--primary-50)" },
    arrived:         { text: "Sudah Tiba",     color: "var(--primary)", bg: "var(--primary-50)" },
    in_progress:     { text: "Berlangsung",    color: "var(--primary-700)", bg: "var(--primary-100)" },
    completed:       { text: "Selesai",        color: "var(--text-2)", bg: "var(--border-soft)" },
    cancelled:       { text: "Dibatalkan",     color: "var(--danger)", bg: "var(--danger-bg)" },
  };
  return map[status] ?? { text: status, color: "var(--text-2)", bg: "var(--border-soft)" };
}

function isActive(status: string) {
  return ["confirmed", "on_the_way", "arrived", "in_progress"].includes(status);
}

function rp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function shortId(uuid: string) {
  return uuid.slice(-4).toUpperCase();
}

async function getOrders(uid: string, tab: string) {
  let where = "o.user_uid = $1";
  if (tab === "aktif") where += " AND o.order_status IN ('confirmed','on_the_way','arrived','in_progress')";
  else if (tab === "selesai") where += " AND o.order_status = 'completed'";
  else if (tab === "dibatalkan") where += " AND o.order_status = 'cancelled'";

  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.order_status, o.payment_status, o.total_amount, o.scheduled_date,
              o.start_time, o.end_time, o.created_at,
              p.name AS partner_name,
              c.name AS category_name, c.emoji AS category_emoji
       FROM orders o
       JOIN partners p ON p.uid = o.partner_uid
       JOIN categories c ON c.id = o.category_id
       WHERE ${where}
       ORDER BY o.created_at DESC`,
      [uid]
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { tab = "semua" } = await searchParams;
  const orders = await getOrders(session.uid, tab);

  return (
    <div className="pwa-shell">
      {/* Header */}
      <div style={{
        padding: "14px 22px 0", flexShrink: 0,
        position: "sticky", top: 0, zIndex: 10, background: "var(--bg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)" }}>Pesanan</div>
        </div>

        {/* Tabs */}
        <OrderTabs active={tab} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px 16px" }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "var(--primary-50)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--primary)", margin: "0 auto 16px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
              Belum ada pesanan
            </div>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>
              Yuk temukan Teman Sedia yang tepat untukmu
            </div>
            <Link href="/home" style={{ textDecoration: "none" }}>
              <div style={{
                display: "inline-block", background: "var(--primary)", color: "#fff",
                borderRadius: 12, padding: "10px 22px", fontSize: 14, fontWeight: 700,
              }}>Cari layanan</div>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.map((o) => {
              const st = statusLabel(o.order_status, o.payment_status);
              const active = isActive(o.order_status);
              return (
                <Link key={o.id} href={`/orders/${o.id}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: 14 }}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "var(--primary-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, flexShrink: 0,
                      }}>
                        {o.category_emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                          {o.category_name}
                          <span style={{ fontWeight: 400, color: "var(--text-3)" }}> · </span>
                          {o.partner_name}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: st.color, background: st.bg,
                            borderRadius: 999, padding: "2px 8px",
                          }}>
                            {st.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: "1px solid var(--border-soft)", margin: "10px 0" }} />

                    {/* Details row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                        {formatDate(o.scheduled_date)} · {o.start_time.slice(0, 5)}–{o.end_time.slice(0, 5)}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)" }}>
                        #{shortId(o.id)}
                      </span>
                    </div>

                    {/* Bottom row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>
                        {rp(o.total_amount)}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {o.order_status === "in_progress" && (
                          <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: "var(--surface-2)", border: "1px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 4v-4H6a2 2 0 01-2-2V6z" />
                            </svg>
                          </div>
                        )}
                        <div style={{
                          height: 34, borderRadius: 10, padding: "0 14px",
                          background: active ? "var(--primary)" : "var(--surface-2)",
                          border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                          display: "flex", alignItems: "center",
                          fontSize: 13, fontWeight: 700,
                          color: active ? "#fff" : "var(--text-1)",
                        }}>
                          {active ? "Lacak" : "Pesan lagi"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <TabBar active="orders" />
    </div>
  );
}
