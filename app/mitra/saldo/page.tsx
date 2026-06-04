import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";
import { requestWithdrawal } from "@/lib/actions/withdrawal";
import { EarningsChart } from "./EarningsChart";
import { SaldoBackButton } from "./SaldoBackButton";
import CairkanSheet from "./CairkanSheet";

async function getMitraSaldo(uid: string) {
  const { rows } = await pool.query(
    `SELECT balance FROM partners WHERE uid = $1`,
    [uid]
  );
  return rows[0] ?? null;
}

async function getWeekEarnings(uid: string) {
  const now = new Date();
  const dow = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((dow + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(partner_earning),0) AS total FROM orders
     WHERE partner_uid=$1 AND order_status='completed' AND scheduled_date >= $2`,
    [uid, weekStart.toISOString().slice(0, 10)]
  );
  return Number(rows[0]?.total ?? 0);
}

async function getMonthlyEarnings(uid: string) {
  // Last 6 months including current
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      isCurrent: i === 0,
    });
  }

  const { rows } = await pool.query(
    `SELECT
       EXTRACT(YEAR FROM scheduled_date)::int AS yr,
       EXTRACT(MONTH FROM scheduled_date)::int AS mo,
       COALESCE(SUM(partner_earning), 0) AS total
     FROM orders
     WHERE partner_uid=$1 AND order_status='completed'
       AND scheduled_date >= $2
     GROUP BY yr, mo`,
    [uid, new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10)]
  );

  return months.map((m) => {
    const row = rows.find((r) => Number(r.yr) === m.year && Number(r.mo) === m.month);
    return { label: m.label, total: Number(row?.total ?? 0), isCurrent: m.isCurrent };
  });
}

async function getPendingWithdrawal(uid: string) {
  const { rows } = await pool.query(
    `SELECT id FROM withdrawal_requests WHERE partner_uid=$1 AND status='pending' LIMIT 1`,
    [uid]
  );
  return rows[0] ?? null;
}

async function getRejectedWithdrawal(uid: string) {
  const { rows } = await pool.query(
    `SELECT id, amount, net_amount, bank_name, account_number, rejected_reason, created_at
     FROM withdrawal_requests
     WHERE partner_uid=$1
     ORDER BY created_at DESC LIMIT 1`,
    [uid]
  );
  const latest = rows[0];
  if (!latest || latest.status !== "rejected") return null;
  return latest;
}

async function getBankAccount(uid: string) {
  const { rows } = await pool.query(
    `SELECT bank_name AS "bankName", account_number AS "accountNumber", account_holder AS "accountHolder"
     FROM partner_bank_accounts WHERE partner_uid=$1 LIMIT 1`,
    [uid]
  );
  return rows[0] ?? null;
}

async function getRiwayatTransaksi(uid: string) {
  const { rows } = await pool.query(
    `(
      SELECT
        'order' AS type, o.id,
        u.name AS label,
        c.name AS sublabel,
        c.emoji AS emoji,
        o.scheduled_date::text AS tanggal,
        o.partner_earning AS amount
      FROM orders o
      JOIN users u ON u.uid = o.user_uid
      JOIN categories c ON c.id = o.category_id
      WHERE o.partner_uid=$1 AND o.order_status='completed'
    )
    UNION ALL
    (
      SELECT
        'withdrawal' AS type, wr.id,
        CONCAT('Cairkan ke ', COALESCE(wr.bank_name, 'Bank')) AS label,
        NULL AS sublabel, NULL AS emoji,
        wr.created_at::text AS tanggal,
        -wr.amount AS amount
      FROM withdrawal_requests wr
      WHERE wr.partner_uid=$1
    )
    ORDER BY tanggal DESC LIMIT 15`,
    [uid]
  );
  return rows;
}

function rp(n: number) {
  return "Rp " + Math.abs(Number(n)).toLocaleString("id-ID");
}

function formatTanggal(str: string) {
  return new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default async function MitraSaldoPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "partner") redirect("/home");

  const [saldo, weekEarnings, monthlyData, pending, rejected, bank, transaksi] = await Promise.all([
    getMitraSaldo(session.uid),
    getWeekEarnings(session.uid),
    getMonthlyEarnings(session.uid),
    getPendingWithdrawal(session.uid),
    getRejectedWithdrawal(session.uid),
    getBankAccount(session.uid),
    getRiwayatTransaksi(session.uid),
  ]);

  const balance: number = saldo?.balance ?? 0;
  const minWithdraw = 100000;
  const canWithdraw = balance >= minWithdraw && !pending;

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 90 }}>

        {/* Header */}
        <div style={{
          background: "var(--grad-hero)",
          padding: "20px 20px 28px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 240, height: 240, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1), transparent 60%)",
            top: -90, right: -70, pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, position: "relative" }}>
            <SaldoBackButton />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Saldo</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6, position: "relative" }}>Saldo aktif</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-1px", position: "relative", marginBottom: 6 }}>
            {rp(balance)}
          </div>

          {weekEarnings > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>+ {rp(weekEarnings)} minggu ini</span>
            </div>
          )}
          {weekEarnings === 0 && <div style={{ marginBottom: 20 }} />}

          {/* Action buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, position: "relative" }}>
            <CairkanSheet
              balance={balance}
              bank={bank}
              hasPending={!!pending}
              onConfirm={requestWithdrawal}
            />
            <Link href="/mitra/saldo/riwayat" style={{ textDecoration: "none" }}>
              <button style={{
                width: "100%", padding: "13px", borderRadius: 13,
                border: "1.5px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.15)", color: "#fff",
                fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
              }}>
                Riwayat
              </button>
            </Link>
          </div>

          {pending && (
            <div style={{
              marginTop: 10, position: "relative",
              background: "rgba(255,255,255,0.15)", borderRadius: 10,
              padding: "8px 12px", fontSize: 12, color: "rgba(255,255,255,0.85)",
            }}>
              Ada permintaan pencairan yang sedang diproses
            </div>
          )}
          {!pending && balance < minWithdraw && (
            <div style={{ marginTop: 10, position: "relative", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Minimum cairkan {rp(minWithdraw)}
            </div>
          )}
        </div>

        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Rejected withdrawal banner — hanya tampil kalau tidak ada pending */}
          {rejected && !pending && (
            <div style={{
              borderRadius: 14, padding: "14px 16px",
              background: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>❌</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}>
                  Pencairan ditolak
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 4 }}>
                  {rejected.rejected_reason ?? "Permintaan pencairanmu ditolak oleh tim Sediaaku."}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {rp(Number(rejected.amount))} · {rejected.bank_name} •••• {String(rejected.account_number ?? "").slice(-4)}
                </div>
              </div>
            </div>
          )}

          {/* Performa chart */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
              Performa
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <EarningsChart months={monthlyData} />
            </div>
          </div>

          {/* Riwayat Transaksi */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
              Riwayat Transaksi
            </div>

            {transaksi.length === 0 ? (
              <div className="card" style={{ padding: "24px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--text-3)" }}>Belum ada transaksi</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {transaksi.map((t) => {
                  const isWithdrawal = t.type === "withdrawal";
                  const amount = Number(t.amount);
                  return (
                    <div key={t.id} className="card" style={{
                      padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 14,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: isWithdrawal ? "#f3f4f6" : "var(--primary-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>
                        {isWithdrawal ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" rx="2" width="22" height="16"/><path d="M1 10h22"/>
                          </svg>
                        ) : (
                          <span>{t.emoji ?? "🛠"}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                          {t.sublabel ? `${t.sublabel} · ` : ""}{formatTanggal(t.tanggal)}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 700, flexShrink: 0,
                        color: isWithdrawal ? "var(--text-2)" : "var(--primary)",
                      }}>
                        {isWithdrawal ? `–${rp(amount)}` : `+${rp(amount)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <nav className="tabbar">
        {[
          {
            href: "/mitra/home", label: "Job", active: false,
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
          },
          {
            href: "/mitra/jadwal", label: "Jadwal", active: false,
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
          },
          {
            href: "/mitra/chat", label: "Chat", active: false,
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
          },
          {
            href: "/mitra/profil", label: "Profil", active: false,
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
          },
        ].map((t) => (
          <Link key={t.label} href={t.href}
            className={`tabbar-item${t.active ? " active" : ""}`}
            style={{ textDecoration: "none", color: t.active ? "var(--primary)" : "var(--text-3)" }}>
            {t.icon}
            <span className="tabbar-label">{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
