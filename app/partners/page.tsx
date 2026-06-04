import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { AppBar } from "@/components/AppBar";
import { TabBar } from "@/components/TabBar";
import pool from "@/lib/db";

async function getAllPartners(search?: string) {
  try {
    const searchParam = search ? `%${search}%` : "%";
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
        AND (p.name ILIKE $1 OR c.name ILIKE $1 OR p.city ILIKE $1)
      GROUP BY p.uid, p.name, p.city, p.rating, p.total_jobs, p.photo_url
      ORDER BY is_online DESC, p.rating DESC NULLS LAST, p.total_jobs DESC
    `, [searchParam]);
    return rows;
  } catch {
    return [];
  }
}

function Avatar({ name, photoUrl, size = 44 }: { name: string; photoUrl?: string; size?: number }) {
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />;
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

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { q } = await searchParams;
  const partners = await getAllPartners(q);

  return (
    <div className="pwa-shell">
      <AppBar title="Teman Sedia" />

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }}>
        {/* Search bar */}
        <form method="GET" style={{ padding: "4px 22px 16px" }}>
          <div style={{
            background: "var(--surface)", border: "1.5px solid var(--border)",
            borderRadius: 14, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Cari nama, layanan, atau kota..."
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontSize: 14, fontFamily: "inherit", color: "var(--text-1)",
              }}
              autoComplete="off"
            />
            {q && (
              <a href="/partners" style={{ color: "var(--text-3)", lineHeight: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </a>
            )}
          </div>
        </form>

        {/* Count */}
        <div style={{ padding: "0 22px 10px" }}>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>
            {partners.length} Teman Sedia ditemukan
            {q && <> untuk &ldquo;<strong style={{ color: "var(--text-1)" }}>{q}</strong>&rdquo;</>}
          </span>
        </div>

        {/* Partner list */}
        {partners.length === 0 ? (
          <div style={{ padding: "48px 22px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>Tidak ditemukan</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Coba kata kunci lain</div>
          </div>
        ) : (
          <div style={{ padding: "0 22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {partners.map((p) => (
              <a key={p.uid} href={`/partner/${p.uid}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar name={p.name} photoUrl={p.photo_url} size={48} />
                    <span style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 12, height: 12, borderRadius: 999,
                      background: p.is_online ? "#22C55E" : "#CBD5E1",
                      border: "2px solid var(--surface)",
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
                      </svg>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)", flexWrap: "wrap" }}>
                      <span>⭐</span>
                      <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{p.rating?.toFixed(1) ?? "Baru"}</span>
                      <span>·</span>
                      <span>{p.total_jobs} job</span>
                      <span>·</span>
                      <span>{p.category_emoji} {p.category_name}</span>
                      {p.city && <><span>·</span><span>{p.city}</span></>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)" }}>{rp(p.rate_per_hour)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>/jam</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <TabBar active="home" />
    </div>
  );
}
