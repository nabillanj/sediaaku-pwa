import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { AppBar } from "@/components/AppBar";
import { BackButton } from "@/components/BackButton";
import pool from "@/lib/db";

async function getPartner(uid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT p.uid, p.name, p.city, p.rating, p.total_jobs, p.total_reviews,
              p.bio, p.photo_url, p.min_hours,
              MIN(ps.rate_per_hour) AS rate_per_hour,
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
       LEFT JOIN partner_services ps ON ps.partner_uid = p.uid AND ps.is_active = true
       WHERE p.uid = $1 AND p.is_active = true
       GROUP BY p.uid, p.name, p.city, p.rating, p.total_jobs, p.total_reviews,
                p.bio, p.photo_url, p.min_hours`,
      [uid]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function getPartnerSkills(uid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ps.skill_name, c.name AS category_name, c.emoji
       FROM partner_skills ps
       JOIN categories c ON c.id = ps.category_id
       WHERE ps.partner_uid = $1
       ORDER BY c.name, ps.skill_name`,
      [uid]
    );
    return rows as { skill_name: string; category_name: string; emoji: string }[];
  } catch {
    return [];
  }
}

async function getPartnerServices(uid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT ps.rate_per_hour, c.name AS category_name, c.emoji
       FROM partner_services ps
       JOIN categories c ON c.id = ps.category_id
       WHERE ps.partner_uid = $1 AND ps.is_active = true`,
      [uid]
    );
    return rows;
  } catch {
    return [];
  }
}

async function getPartnerReviews(uid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.uid = r.user_uid
       WHERE r.partner_uid = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [uid]
    );
    return rows;
  } catch {
    return [];
  }
}

function Avatar({ name, photoUrl, size = 72 }: { name: string; photoUrl?: string; size?: number }) {
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

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? "#F59E0B" : "none"}
          stroke="#F59E0B" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function timeAgo(date: string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

export default async function PartnerDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { uid } = await params;
  const [partner, skills, services, reviews] = await Promise.all([
    getPartner(uid),
    getPartnerSkills(uid),
    getPartnerServices(uid),
    getPartnerReviews(uid),
  ]);

  if (!partner) notFound();

  return (
    <div className="pwa-shell">
      {/* Scrollable content — leave room for sticky bottom */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 88 }}>
        {/* Hero header — gradient full dari atas termasuk back button */}
        <div style={{
          background: "var(--grad-hero)", padding: "0 22px 28px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.13), transparent 60%)",
            top: -60, right: -60, pointerEvents: "none",
          }} />

          {/* Back button di dalam gradient */}
          <div style={{ paddingTop: 52, paddingBottom: 20, position: "relative", zIndex: 2 }}>
            <BackButton fallback="/partners" />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <Avatar name={partner.name} photoUrl={partner.photo_url} size={72} />
              <span style={{
                position: "absolute", bottom: 3, right: 3,
                width: 14, height: 14, borderRadius: 999,
                background: partner.is_online ? "#22C55E" : "#94A3B8",
                border: "2.5px solid white",
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{partner.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{partner.city}</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                  background: partner.is_online ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.15)",
                  color: partner.is_online ? "#86EFAC" : "rgba(255,255,255,0.65)",
                }}>
                  {partner.is_online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row — hanya data real */}
          <div style={{
            display: "flex", marginTop: 20,
            background: "rgba(255,255,255,0.13)", backdropFilter: "blur(6px)",
            borderRadius: 14, padding: "14px 0",
          }}>
            <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{partner.rating?.toFixed(1) ?? "—"}</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Rating</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{partner.total_jobs}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Selesai</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{partner.total_reviews}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Ulasan</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tentang */}
          {partner.bio && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>Tentang</div>
              <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>{partner.bio}</div>
            </div>
          )}

          {/* Layanan & Tarif */}
          {services.length > 0 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>Layanan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {services.map((s) => (
                  <div key={s.category_name} className="card" style={{
                    padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ fontSize: 22 }}>{s.emoji}</span>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{s.category_name}</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>{rp(s.rate_per_hour)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>/jam</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keahlian */}
          {skills.length > 0 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>Keahlian</div>
              {Object.entries(
                skills.reduce((acc, s) => {
                  const key = `${s.emoji} ${s.category_name}`;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(s.skill_name);
                  return acc;
                }, {} as Record<string, string[]>)
              ).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 6 }}>{cat}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {items.map((skill) => (
                      <span key={skill} style={{
                        padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        background: "var(--primary-50)", color: "var(--primary-700)",
                        border: "1px solid var(--primary-200)",
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ulasan */}
          {reviews.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                  Ulasan
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginLeft: 6 }}>({partner.total_reviews})</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reviews.map((rev, i) => (
                  <div key={i} className="card" style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                        {rev.user_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{rev.user_name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                          <Stars rating={rev.rating} />
                          <span style={{ fontSize: 11, color: "var(--text-3)" }}>{timeAgo(rev.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {rev.comment && (
                      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{rev.comment}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Min hours info */}
          {partner.min_hours && (
            <div style={{
              background: "var(--surface-2)", borderRadius: 12, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, color: "var(--text-2)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
              Minimal pemesanan <strong style={{ color: "var(--text-1)" }}>{partner.min_hours} jam</strong>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom — tarif + pesan */}
      <div style={{
        position: "sticky", bottom: 0, zIndex: 20,
        background: "var(--surface)", borderTop: "1px solid var(--border-soft)",
        padding: "14px 22px 28px",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 -4px 20px rgba(15,31,29,0.07)",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 1 }}>Mulai dari</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)" }}>
            {partner.rate_per_hour ? rp(partner.rate_per_hour) : "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>/jam</div>
        </div>
        <a href={`/booking/${partner.uid}`} style={{ flex: 1, textDecoration: "none" }}>
          <button className="btn-primary" style={{ fontSize: 15 }}>
            Pesan Sekarang
          </button>
        </a>
      </div>
    </div>
  );
}
