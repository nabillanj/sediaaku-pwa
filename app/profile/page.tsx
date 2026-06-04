import { redirect } from "next/navigation";
import { getSession, logout } from "@/lib/actions/auth";
import { TabBar } from "@/components/TabBar";
import pool from "@/lib/db";
import Link from "next/link";

async function getUserStats(uid: string) {
  try {
    const [ordersRes, reportsRes, walletRes] = await Promise.all([
      pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE order_status NOT IN ('completed','cancelled')) AS active_orders,
          COUNT(*) AS total_orders
         FROM orders WHERE user_uid = $1`,
        [uid]
      ),
      pool.query(
        `SELECT COUNT(*) AS pending_reports
         FROM reports r
         JOIN orders o ON o.id = r.order_id
         WHERE o.user_uid = $1 AND r.reporter_type = 'user' AND r.status != 'resolved'`,
        [uid]
      ),
      pool.query(`SELECT wallet_balance FROM users WHERE uid = $1`, [uid]),
    ]);
    return {
      totalOrders: Number(ordersRes.rows[0]?.total_orders ?? 0),
      activeOrders: Number(ordersRes.rows[0]?.active_orders ?? 0),
      pendingReports: Number(reportsRes.rows[0]?.pending_reports ?? 0),
      walletBalance: Number(walletRes.rows[0]?.wallet_balance ?? 0),
    };
  } catch {
    return { totalOrders: 0, activeOrders: 0, pendingReports: 0, walletBalance: 0 };
  }
}

function Avatar({ name, photoUrl, size = 60 }: { name: string; photoUrl?: string; size?: number }) {
  if (photoUrl) {
    return (
      <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
    );
  }
  const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const stats = await getUserStats(session.uid);
  const profile = await (async () => {
    const { rows } = await pool.query(
      `SELECT photo_url FROM ${session.role === "partner" ? "partners" : "users"} WHERE uid=$1`,
      [session.uid]
    );
    return rows[0];
  })();

  const memberSince = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(new Date());

  const menuSections = [
    {
      title: "Akun",
      items: [
        {
          label: "Edit profil", href: "/profile/edit", sub: null,
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a6 6 0 0116 0v1"/></svg>,
        },
        {
          label: "Alamat tersimpan", href: "/profile/addresses", sub: null,
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.5s-7-4.5-7-10A4.5 4.5 0 0112 6.5a4.5 4.5 0 017 4c0 5.5-7 10-7 10z"/><circle cx="12" cy="10" r="1.6" fill="currentColor"/></svg>,
        },
        ...(session.role === "partner" ? [{
          label: "Riwayat pesanan", href: "/orders",
          sub: stats.activeOrders > 0 ? `${stats.activeOrders} aktif` : null,
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" rx="2" width="14" height="20"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>,
        }] : []),
        {
          label: "Dompet Sediaaku", href: "/wallet", sub: null,
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a1 1 0 100 2 1 1 0 000-2z" fill="currentColor"/><path d="M2 10h20"/></svg>,
        },
        {
          label: "Promo & voucher", href: "/vouchers", sub: null,
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 8.3A2 2 0 0022 6.5V4a2 2 0 00-2-2H4a2 2 0 00-2 2v2.5a2 2 0 001.4 1.9A2 2 0 014 10.2V20a2 2 0 002 2h12a2 2 0 002-2v-9.8a2 2 0 00-.4-1.9z"/><path d="M12 7v10M9 10l3-3 3 3"/></svg>,
        },
      ],
    },
    {
      title: "Bantuan",
      items: [
        {
          label: "Laporan saya",
          href: "/my-reports",
          sub: stats.pendingReports > 0 ? `${stats.pendingReports} sedang diproses` : null,
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
        },
        {
          label: "Pusat bantuan", href: "/help", sub: null,
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>,
        },
      ],
    },
  ];

  return (
    <div className="pwa-shell">
      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Header — teal gradient */}
        <div style={{
          background: "var(--grad-hero)",
          padding: "48px 20px 20px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 180, height: 180, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 60%)",
            top: -50, right: -50, pointerEvents: "none",
          }} />

          {/* Avatar + info */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <Avatar name={session.name} photoUrl={profile?.photo_url} size={56} />
              <Link href="/profile/edit" style={{
                position: "absolute", bottom: -2, right: -2,
                width: 20, height: 20, borderRadius: 999,
                background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </Link>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{session.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{session.phone}</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Order stats */}
            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)",
              borderRadius: 14, padding: "12px 0",
            }}>
              {[
                { label: "Total order", value: stats.totalOrders },
                { label: "Order aktif", value: stats.activeOrders },
              ].map((stat, i) => (
                <div key={stat.label} style={{
                  flex: 1, textAlign: "center",
                  borderRight: i === 0 ? "1px solid rgba(255,255,255,0.2)" : "none",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{stat.label}</div>
                </div>
              ))}
            </div>
            {/* Saldo */}
            <Link href="/wallet" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)",
                borderRadius: 14, padding: "12px 16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12a1 1 0 100 2 1 1 0 000-2z" fill="rgba(255,255,255,0.8)"/><path d="M2 10h20"/>
                  </svg>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Saldo dompet</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                    {"Rp " + stats.walletBalance.toLocaleString("id-ID")}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Menu sections */}
        <div style={{ padding: "14px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {menuSections.map((section) => (
            <div key={section.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6 }}>
                {section.title}
              </div>
              <div className="card" style={{ overflow: "hidden", padding: 0 }}>
                {section.items.map((item, i) => (
                  <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px",
                      borderBottom: i < section.items.length - 1 ? "1px solid var(--border-soft)" : "none",
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: "var(--primary-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--primary)", flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{item.label}</div>
                        {item.sub && (
                          <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 500, marginTop: 1 }}>{item.sub}</div>
                        )}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Logout */}
          <form action={async () => {
            "use server";
            await logout();
            redirect("/");
          }}>
            <button type="submit" style={{
              width: "100%", padding: "14px", borderRadius: 14,
              background: "var(--danger-bg)", border: "none",
              color: "var(--danger)", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Keluar dari akun
            </button>
          </form>
        </div>
      </div>

      <TabBar active="profile" />
    </div>
  );
}
