import { redirect } from "next/navigation";
import { getSession, logout } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";

async function getMitraStats(uid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT rating, total_reviews, total_jobs, balance, verify_status, photo_url
       FROM partners WHERE uid = $1`,
      [uid]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function Avatar({ name, photoUrl, size = 64 }: { name: string; photoUrl?: string; size?: number }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />;
  }
  const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function rp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default async function MitraProfilPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "partner") redirect("/home");

  const stats = await getMitraStats(session.uid);

  const menuSections = [
    {
      title: "Akun",
      items: [
        {
          label: "Edit profil", href: "/mitra/profil/edit",
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a6 6 0 0116 0v1"/></svg>,
        },
        {
          label: "Rekening bank", href: "/mitra/profil/bank",
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" rx="2" width="18" height="12"/><path d="M3 11h18"/><circle cx="16" cy="15" r="1" fill="currentColor"/></svg>,
        },
      ],
    },
    {
      title: "Bantuan",
      items: [
        {
          label: "Pusat bantuan", href: "/help",
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>,
        },
      ],
    },
  ];

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 90 }}>

        {/* Header */}
        <div style={{
          background: "var(--grad-hero)",
          padding: "24px 20px 24px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 60%)",
            top: -60, right: -60, pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", marginBottom: 20 }}>
            <div style={{ position: "relative" }}>
              <Avatar name={session.name} photoUrl={stats?.photo_url} size={64} />
              {stats?.verify_status === "verified" && (
                <div style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#4ade80",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid white",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{session.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{session.phone}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
                {session.city}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            background: "rgba(255,255,255,0.18)", borderRadius: 14, overflow: "hidden",
          }}>
            {[
              { label: "Rating", value: stats?.rating ? stats.rating.toFixed(1) : "—" },
              { label: "Total job", value: stats?.total_jobs ?? 0 },
              { label: "Saldo", value: stats ? rp(stats.balance) : "—" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "12px 8px", textAlign: "center",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 18 }}>
          {stats?.verify_status !== "verified" ? (
            /* Rejected: only edit profil */
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <Link href="/mitra/profil/edit" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-50)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a6 6 0 0116 0v1"/></svg>
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Edit profil</div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
            </div>
          ) : (
            menuSections.map((section) => (
              <div key={section.title}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "var(--text-3)",
                  textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8,
                }}>
                  {section.title}
                </div>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {section.items.map((item, i) => (
                    <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                        borderBottom: i < section.items.length - 1 ? "1px solid var(--border-soft)" : "none",
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 11,
                          background: "var(--primary-50)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "var(--primary)", flexShrink: 0,
                        }}>
                          {item.icon}
                        </div>
                        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                          {item.label}
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Logout */}
          <form action={async () => {
            "use server";
            await logout();
            redirect("/");
          }}>
            <button type="submit" style={{
              width: "100%", padding: "14px",
              borderRadius: 14, border: "none",
              background: "var(--danger-bg)", color: "var(--danger)",
              fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Keluar dari akun
            </button>
          </form>

          <div style={{ height: 8 }} />
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
            href: "/mitra/profil", label: "Profil", active: true,
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
