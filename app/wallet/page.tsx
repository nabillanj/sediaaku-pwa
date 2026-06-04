import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { TabBar } from "@/components/TabBar";
import pool from "@/lib/db";
import Link from "next/link";

async function getWalletData(uid: string) {
  try {
    const [userRes, txRes, pendingRes] = await Promise.all([
      pool.query(`SELECT wallet_balance FROM users WHERE uid = $1`, [uid]),
      pool.query(
        `SELECT id, amount, type, description, order_id, created_at
         FROM user_wallet_transactions
         WHERE user_uid = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [uid]
      ),
      pool.query(
        `SELECT o.id, o.total_amount, o.created_at, c.name AS category_name
         FROM orders o
         LEFT JOIN categories c ON c.id = o.category_id
         WHERE o.user_uid = $1
           AND o.payment_status = 'pending'
           AND o.order_status = 'pending_payment'
         ORDER BY o.created_at DESC`,
        [uid]
      ),
    ]);
    return {
      balance: Number(userRes.rows[0]?.wallet_balance ?? 0),
      transactions: txRes.rows as {
        id: string;
        amount: number;
        type: string;
        description: string;
        order_id: string | null;
        created_at: string;
      }[],
      pendingOrders: pendingRes.rows as {
        id: string;
        total_amount: number;
        created_at: string;
        category_name: string;
      }[],
    };
  } catch {
    return { balance: 0, transactions: [], pendingOrders: [] };
  }
}

const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  refund:   { label: "Refund",    color: "var(--primary)", sign: "+" },
  cashback: { label: "Cashback",  color: "var(--primary)", sign: "+" },
  topup:    { label: "Top Up",    color: "var(--primary)", sign: "+" },
  payment:  { label: "Pembayaran", color: "var(--danger)",  sign: "−" },
};

function rp(n: number) {
  return "Rp " + Math.abs(n).toLocaleString("id-ID");
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default async function WalletPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { balance, transactions, pendingOrders } = await getWalletData(session.uid);

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* AppBar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", position: "sticky", top: 0,
          background: "var(--bg)", zIndex: 10,
        }}>
          <Link href="/profile" style={{ textDecoration: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: "var(--surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
          </Link>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Dompet Sediaaku</div>
        </div>

        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>

          {/* Balance card */}
          <div style={{
            borderRadius: 20,
            background: "var(--grad-hero)",
            padding: "24px 22px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 60%)",
              top: -80, right: -50, pointerEvents: "none",
            }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
              Saldo Dompet
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
              {rp(balance)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              Bisa dipakai untuk pembayaran pesanan berikutnya
            </div>
          </div>

          {/* Info banner */}
          <div style={{
            background: "var(--primary-50)", borderRadius: 14, padding: "12px 14px",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <div style={{ fontSize: 12, color: "var(--primary-700)", lineHeight: 1.6 }}>
              Saldo masuk dari refund atau cashback. Bisa langsung dipakai saat booking tanpa perlu transfer manual.
            </div>
          </div>

          {/* Pending transfers */}
          {pendingOrders.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>
                Menunggu konfirmasi pembayaran
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {pendingOrders.map((o, i) => {
                  const isFirst = i === 0;
                  const isLast = i === pendingOrders.length - 1;
                  return (
                    <div key={o.id} style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: isFirst && isLast ? 16 : isFirst ? "16px 16px 4px 4px" : isLast ? "4px 4px 16px 16px" : 4,
                      padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: "var(--warning-bg, #FFF8E1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>
                          {o.category_name ?? "Pesanan"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                          {formatDate(o.created_at)} · Menunggu verifikasi admin
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>
                          {rp(o.total_amount)}
                        </div>
                        <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 2 }}>Pending</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction history */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>
              Riwayat transaksi
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "var(--primary-50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--primary)", margin: "0 auto 16px",
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 14a1 1 0 100 2 1 1 0 000-2z" fill="currentColor"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
                  Belum ada transaksi
                </div>
                <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                  Saldo akan bertambah otomatis jika ada refund atau promo
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {transactions.map((tx, i) => {
                  const cfg = TYPE_CONFIG[tx.type] ?? { label: tx.type, color: "var(--text-2)", sign: "" };
                  const isFirst = i === 0;
                  const isLast = i === transactions.length - 1;
                  return (
                    <div key={tx.id} style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: isFirst && isLast ? 16 : isFirst ? "16px 16px 4px 4px" : isLast ? "4px 4px 16px 16px" : 4,
                      padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: tx.type === "payment" ? "var(--danger-bg)" : "var(--primary-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {tx.type === "refund" && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 010 8h-1"/>
                          </svg>
                        )}
                        {tx.type === "cashback" && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3 6.5 7 .5-5 4.5 1.5 7L12 17l-6.5 3.5L7 13.5 2 9l7-.5z"/>
                          </svg>
                        )}
                        {tx.type === "topup" && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12l7-7 7 7"/>
                          </svg>
                        )}
                        {tx.type === "payment" && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19V5M5 12l7 7 7-7"/>
                          </svg>
                        )}
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                          {tx.description}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                          {formatDate(tx.created_at)}
                        </div>
                      </div>

                      {/* Amount */}
                      <div style={{ fontSize: 15, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                        {cfg.sign}{rp(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <TabBar active="profile" />
    </div>
  );
}
