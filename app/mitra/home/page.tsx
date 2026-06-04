import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUnreadCount } from "@/lib/actions/announcements";
import pool from "@/lib/db";
import Link from "next/link";

async function getMitraData(uid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT name, photo_url, rating, total_reviews, total_jobs, balance, verify_status,
              CASE WHEN EXISTS (
                     SELECT 1 FROM availability a
                     JOIN availability_active_days aad ON aad.availability_id = a.id
                     WHERE a.partner_uid = p.uid
                       AND aad.day_of_week = LOWER(TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'fmDay'))
                       AND (NOW() AT TIME ZONE 'Asia/Jakarta')::time
                           BETWEEN COALESCE(aad.start_time, '08:00')::time
                               AND COALESCE(aad.end_time, '17:00')::time
                   ) THEN true
                   ELSE false
              END AS is_online
       FROM partners p WHERE p.uid = $1`,
      [uid]
    );
    return rows[0] ?? null;
  } catch (e) {
    console.error("getMitraData error:", e);
    return null;
  }
}

async function getTodayOrders(partnerUid: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await pool.query(
      `SELECT o.id, o.start_time, o.end_time, o.order_status, o.partner_earning,
              u.name AS user_name,
              c.name AS category_name, c.emoji AS category_emoji
       FROM orders o
       JOIN users u ON u.uid = o.user_uid
       JOIN categories c ON c.id = o.category_id
       WHERE o.partner_uid = $1
         AND o.scheduled_date = $2
         AND o.order_status NOT IN ('cancelled','pending_payment')
       ORDER BY o.start_time ASC`,
      [partnerUid, today]
    );
    return rows;
  } catch (e) {
    console.error("getTodayOrders error:", e);
    return [];
  }
}

async function getMonthStats(partnerUid: string) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const { rows } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE order_status = 'completed') AS completed_this_month
       FROM orders WHERE partner_uid = $1 AND scheduled_date >= $2`,
      [partnerUid, monthStart]
    );
    return rows[0];
  } catch (e) {
    console.error("getMonthStats error:", e);
    return { completed_this_month: 0 };
  }
}

function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl?: string; size?: number }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />;
  }
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

function rp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace(".0", "")}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function rpFull(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi,";
  if (h < 15) return "Selamat siang,";
  if (h < 18) return "Selamat sore,";
  return "Selamat malam,";
}

const ACTIVE_STATUSES = new Set(["on_the_way", "arrived", "in_progress"]);

export default async function MitraHomePage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "partner") redirect("/home");

  const [mitra, todayOrders, stats, unreadCount] = await Promise.all([
    getMitraData(session.uid),
    getTodayOrders(session.uid),
    getMonthStats(session.uid),
    getUnreadCount(session.uid, "partner"),
  ]);

  if (!mitra) redirect("/");
  if (mitra.verify_status === "pending") redirect("/mitra/daftar/pending");
  if (mitra.verify_status === "rejected") redirect("/mitra/daftar/rejected");

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="pwa-shell">

      {/* ── Header gradient ── */}
      <div style={{
        background: "var(--grad-hero)",
        padding: "20px 20px 20px",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* orb */}
        <div style={{
          position: "absolute", width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 60%)",
          top: -80, right: -60, pointerEvents: "none",
        }} />

        {/* Top row: greeting + badge + avatar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, position: "relative" }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sediaaku" style={{ height: 40, objectFit: "contain", display: "block", marginBottom: 8, filter: "brightness(0) invert(1)" }} />
            <div style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.82)", marginBottom: 2 }}>
              {greeting()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{mitra.name}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/notifications" style={{ textDecoration: "none" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: 4, background: "#f87171", border: "1.5px solid rgba(255,255,255,0.3)" }} />}
              </div>
            </Link>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999, padding: "7px 12px",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: mitra.is_online ? "#4ade80" : "rgba(255,255,255,0.5)",
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                {mitra.is_online ? "Online" : "Offline"}
              </span>
            </div>
            <Avatar name={mitra.name} photoUrl={mitra.photo_url} size={36} />
          </div>
        </div>

        {/* Stats 3-col */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          background: "rgba(255,255,255,0.18)",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
        }}>
          {[
            { label: "Job hari ini",       value: String(todayOrders.length) },
            { label: "Selesai bulan ini",  value: String(stats?.completed_this_month ?? 0) },
            { label: "Saldo",              value: rp(mitra.balance ?? 0) },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "12px 8px", textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none",
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 4, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 90 }}>

        {/* Job hari ini */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>Job hari ini</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{todayLabel}</div>
            </div>
            <Link href="/mitra/job" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
              Semua job
            </Link>
          </div>

          {todayOrders.length === 0 ? (
            <div style={{
              borderRadius: 18, padding: "28px 20px", textAlign: "center",
              background: "var(--surface)", border: "1px dashed var(--border)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "var(--primary-50)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--primary)", margin: "0 auto 10px",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Belum ada job hari ini</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Pastikan jadwalmu aktif ya!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todayOrders.map((order) => {
                const isActive = ACTIVE_STATUSES.has(order.order_status);
                return (
                  <Link key={order.id} href={`/mitra/job/${order.id}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Avatar */}
                        <Avatar name={order.user_name} size={42} />

                        {/* Middle info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Name + Aktif badge */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {order.user_name}
                            </div>
                            {isActive && (
                              <span style={{
                                fontSize: 9, fontWeight: 600,
                                color: "var(--primary-700)",
                                background: "var(--primary-50)",
                                borderRadius: 999, padding: "2px 7px",
                                flexShrink: 0,
                              }}>
                                ● Aktif
                              </span>
                            )}
                          </div>
                          {/* Time · Category */}
                          <div style={{ fontSize: 11, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                              {order.start_time} – {order.end_time}
                            </span>
                            <span>·</span>
                            <span>{order.category_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: earning + CTA */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                            {rpFull(order.partner_earning)}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 3 }}>net</span>
                        </div>
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          color: isActive ? "#fff" : "var(--primary)",
                          background: isActive ? "var(--primary)" : "var(--primary-50)",
                          padding: "6px 14px", borderRadius: 999,
                        }}>
                          {isActive ? "Lanjutkan sesi" : "Lihat detail"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ padding: "20px 16px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>Cepat</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {[
              {
                label: "Atur jadwal", href: "/mitra/jadwal/atur",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" rx="2" width="18" height="16"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>,
              },
              {
                label: "Cairkan saldo", href: "/mitra/saldo",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" rx="2" width="18" height="12"/><path d="M3 11h18"/><circle cx="16" cy="15" r="1" fill="currentColor"/></svg>,
              },
              {
                label: "Ulasan masuk", href: "/mitra/ulasan",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3 7h7l-5.7 4.2L18 21l-6-4-6 4 1.7-7.8L2 9h7z"/></svg>,
              },
              {
                label: "Atur tarif", href: "/mitra/tarif",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>,
              },
            ].map((a) => (
              <Link key={a.label} href={a.href} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 18, padding: "18px 14px",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: "var(--primary-50)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--primary)",
                  }}>
                    {a.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3 }}>
                    {a.label}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ── Tab bar ── */}
      <nav className="tabbar">
        {[
          {
            href: "/mitra/home", label: "Job", active: true,
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
