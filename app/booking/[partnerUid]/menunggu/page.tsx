import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";

async function getOrder(orderId: string, userUid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.total_amount, o.payment_method, o.order_status,
              o.scheduled_date::text AS scheduled_date, o.start_time, o.end_time,
              p.name AS partner_name
       FROM orders o
       JOIN partners p ON p.uid = o.partner_uid
       WHERE o.id = $1 AND o.user_uid = $2`,
      [orderId, userUid]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function rp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default async function BookingMenungguPage({
  params, searchParams,
}: {
  params: Promise<{ partnerUid: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { orderId } = await searchParams;
  if (!orderId) redirect("/orders");

  const order = await getOrder(orderId, session.uid);
  if (!order) redirect("/orders");

  const dateLabel = new Date(order.scheduled_date).toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short",
  });

  const isPaidByWallet = order.payment_method === "wallet";
  const orderCode = `#SDA-${orderId.slice(0, 4).toUpperCase()}`;

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 32 }}>
        <div style={{ padding: "48px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>

          {/* Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: 999,
            background: isPaidByWallet ? "var(--primary-50)" : "var(--primary-50)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "4px solid var(--primary-200)",
          }}>
            {isPaidByWallet ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            )}
          </div>

          {/* Status */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", marginBottom: 8 }}>
              {isPaidByWallet ? "Pesanan dikonfirmasi!" : "Bukti terkirim!"}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
              {isPaidByWallet
                ? "Pembayaran via Dompet Sediaaku berhasil. Mitra akan segera dikonfirmasi."
                : "Admin sedang verifikasi pembayaranmu. Estimasi maks. 15 menit."}
            </div>
          </div>

          {/* Order detail card */}
          <div style={{
            width: "100%", background: "var(--surface)",
            border: "1px solid var(--border-soft)", borderRadius: 20, padding: "16px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>Nomor pesanan</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{orderCode}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>Mitra</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{order.partner_name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>Jadwal</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                {dateLabel} · {order.start_time}–{order.end_time}
              </span>
            </div>
            <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>Total dibayar</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--primary)" }}>{rp(order.total_amount)}</span>
            </div>
          </div>

          {!isPaidByWallet && (
            <div style={{
              width: "100%", background: "var(--surface-2)", borderRadius: 14, padding: "12px 14px",
              fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, textAlign: "center",
            }}>
              Pantau status di tab Pesanan. Notifikasi otomatis ke aplikasi & WhatsApp setelah disetujui.
            </div>
          )}

          {/* Actions */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href={`/orders/${orderId}`} style={{ textDecoration: "none" }}>
              <button className="btn-primary" style={{ fontSize: 15 }}>
                Lihat pesanan
              </button>
            </Link>
            <Link href="/home" style={{ textDecoration: "none" }}>
              <button style={{
                width: "100%", padding: "14px", borderRadius: 14,
                border: "1px solid var(--border)", background: "var(--surface)",
                fontSize: 14, fontWeight: 600, color: "var(--text-1)", cursor: "pointer",
              }}>
                Kembali ke beranda
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
