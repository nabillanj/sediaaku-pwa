import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { listCategories } from "@/lib/actions/partner";
import { getUnreadCount } from "@/lib/actions/announcements";
import { TabBar } from "@/components/TabBar";
import Link from "next/link";
import pool from "@/lib/db";

async function getFeaturedPartners() {
  try {
    const { rows } = await pool.query(`
      SELECT p.uid, p.name, p.city, p.rating, p.total_jobs, p.photo_url,
             MIN(ps.rate_per_hour) AS rate_per_hour,
             MAX(c.name) AS category_name,
             MAX(c.emoji) AS category_emoji,
             CASE WHEN EXISTS (
                    SELECT 1 FROM availability a
                    JOIN availability_active_days aad ON aad.availability_id = a.id
                    WHERE a.partner_uid = p.uid
                      AND aad.day_of_week = LOWER(TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'fmDay'))
                      AND (NOW() AT TIME ZONE 'Asia/Jakarta')::time BETWEEN aad.start_time::time AND aad.end_time::time
                  ) THEN true
                  ELSE false
             END AS is_online
      FROM partners p
      JOIN partner_services ps ON ps.partner_uid = p.uid AND ps.is_active = true
      JOIN categories c ON c.id = ps.category_id
      WHERE p.is_active = true
      GROUP BY p.uid, p.name, p.city, p.rating, p.total_jobs, p.photo_url
      ORDER BY p.rating DESC NULLS LAST, p.total_jobs DESC
      LIMIT 6
    `);
    return rows;
  } catch {
    return [];
  }
}

function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl?: string; size?: number }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />;
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function rp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const FALLBACK_CATEGORIES = [
  { id: "jagain", name: "Jagain", emoji: "🏠", description: "Jaga rumah, anak, atau lansia" },
  { id: "asuhin", name: "Asuhin", emoji: "💊", description: "Asuh & temani yang butuh perawatan" },
  { id: "bantuin", name: "Bantuin", emoji: "🤝", description: "Bantu pekerjaan ringan sehari-hari" },
  { id: "anterin", name: "Anterin", emoji: "🛵", description: "Antar jemput barang atau dokumen" },
];

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const [categories, partners, unreadCount, userRow] = await Promise.all([
    listCategories(),
    getFeaturedPartners(),
    getUnreadCount(session.uid, "user"),
    pool.query(`SELECT photo_url FROM users WHERE uid=$1`, [session.uid]).then(r => r.rows[0]),
  ]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Selamat pagi" :
    hour < 15 ? "Selamat siang" :
    hour < 18 ? "Selamat sore" : "Selamat malam";

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <div className="pwa-shell">
      {/* Sticky header */}
      <div style={{
        padding: "14px 22px 18px", flexShrink: 0,
        position: "sticky", top: 0, zIndex: 10, background: "var(--bg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Sediaaku" style={{ height: 36, objectFit: "contain", display: "block" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/notifications" style={{ textDecoration: "none" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12, background: "var(--surface)",
                border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 4, background: "var(--danger)", border: "1.5px solid var(--bg)" }} />}
              </div>
            </Link>
            <Link href="/profile/edit" style={{ textDecoration: "none" }}>
              <Avatar name={session.name} photoUrl={userRow?.photo_url} size={38} />
            </Link>
          </div>
        </div>

        {/* Search tap target */}
        <Link href="/search" style={{ textDecoration: "none", display: "block" }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 18, padding: "13px 16px",
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 1px 2px rgba(15,31,29,0.03)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <span style={{ color: "var(--text-3)", fontSize: 14, flex: 1 }}>Cari layanan atau Teman Sedia</span>
            <div style={{
              background: "var(--primary-50)", color: "var(--primary)",
              padding: "5px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              {session.city ?? "Lokasi"}
            </div>
          </div>
        </Link>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }}>

        {/* Greeting */}
        <div style={{ padding: "4px 22px 18px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, color: "var(--text-1)" }}>
            {greeting}, {session.name.split(" ")[0]},<br />
            <span style={{ color: "var(--primary)" }}>tenang aja —</span><br />
            kami siap bantu.
          </h1>
        </div>

        {/* Categories header */}
        <div style={{ padding: "0 22px", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Pilih kebutuhanmu</div>
          <Link href="/categories" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Semua</Link>
        </div>

        {/* Categories grid */}
        <div style={{ padding: "0 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {displayCategories.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                borderRadius: 18, padding: 14, minHeight: 124,
                background: "var(--primary-50)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: "#fff", boxShadow: "0 1px 3px rgba(15,31,29,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {cat.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.4 }}>{cat.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Ajak teman banner */}
        <div style={{ padding: "16px 22px 0" }}>
          <Link href="/referral" style={{ textDecoration: "none" }}>
            <div style={{
              borderRadius: 18, padding: 16, background: "var(--grad-hero)", color: "#fff",
              display: "flex", alignItems: "center", gap: 14,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", width: 140, height: 140, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 60%)",
                top: -50, right: -40, pointerEvents: "none",
              }} />
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>Ajak teman, dapat saldo!</div>
                <div style={{ fontSize: 11, opacity: 0.92, lineHeight: 1.4 }}>
                  Kamu &amp; temanmu sama-sama dapat hingga <strong>Rp 50.000</strong>.
                </div>
              </div>
              <div style={{
                background: "#fff", color: "var(--primary-700)", borderRadius: 999,
                padding: "7px 11px", fontSize: 11, fontWeight: 800, position: "relative", flexShrink: 0,
              }}>Ajak →</div>
            </div>
          </Link>
        </div>

        {/* Promo banner */}
        <div style={{ padding: "12px 22px 0" }}>
          <div className="card" style={{
            padding: 14, background: "linear-gradient(120deg, #FBF1DE 0%, #F5E5C5 100%)",
            border: "none", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#5C3F0A", marginBottom: 1 }}>Promo perdana</div>
              <div style={{ fontSize: 12, color: "#7A5616" }}>Diskon Rp 20.000 untuk booking pertama</div>
            </div>
            <Link href="/vouchers" style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", borderRadius: 999, padding: "6px 11px", fontSize: 10, fontWeight: 800, color: "#7A5616" }}>PAKAI</div>
            </Link>
          </div>
        </div>

        {/* Featured partners */}
        {partners.length > 0 && (
          <div>
            <div style={{ padding: "20px 22px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Teman Sedia terdekat</div>
              <Link href="/partners" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Semua</Link>
            </div>
            <div style={{ padding: "0 22px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {partners.slice(0, 4).map((p) => (
                <Link key={p.uid} href={`/partner/${p.uid}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar name={p.name} photoUrl={p.photo_url} size={44} />
                      <span style={{
                        position: "absolute", bottom: 1, right: 1,
                        width: 11, height: 11, borderRadius: 999,
                        background: p.is_online ? "#22C55E" : "#CBD5E1",
                        border: "2px solid var(--surface)",
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
                        </svg>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)" }}>
                        <span style={{ fontSize: 11 }}>⭐</span>
                        <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{p.rating?.toFixed(1) ?? "Baru"}</span>
                        <span>·</span>
                        <span>{p.total_jobs} job</span>
                        <span>·</span>
                        <span>{p.category_emoji} {p.category_name}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>{rp(p.rate_per_hour)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>/jam</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      <TabBar active="home" />
    </div>
  );
}
