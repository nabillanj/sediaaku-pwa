import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { AppBar } from "@/components/AppBar";
import { TabBar } from "@/components/TabBar";
import pool from "@/lib/db";

async function getCategory(id: string) {
  try {
    const { rows } = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function getPartnersByCategory(categoryId: string) {
  try {
    const { rows } = await pool.query(`
      SELECT p.uid, p.name, p.city, p.rating, p.total_jobs, p.photo_url,
             ps.rate_per_hour
      FROM partners p
      JOIN partner_services ps ON ps.partner_uid = p.uid AND ps.category_id = $1 AND ps.is_active = true
      WHERE p.verify_status = 'verified' AND p.is_active = true
      ORDER BY p.rating DESC NULLS LAST, p.total_jobs DESC
    `, [categoryId]);
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

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/auth");

  const { id } = await params;
  const [category, partners] = await Promise.all([getCategory(id), getPartnersByCategory(id)]);

  if (!category) notFound();

  return (
    <div className="pwa-shell">
      <AppBar title={`${category.emoji ?? ""} ${category.name}`} />

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }}>
        {/* Category hero */}
        <div style={{ padding: "0 22px 20px" }}>
          <div className="card" style={{
            padding: 20, background: "var(--primary-50)",
            border: "none", display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, boxShadow: "0 2px 8px rgba(14,124,113,0.12)",
            }}>
              {category.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", marginBottom: 4 }}>{category.name}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{category.description}</div>
            </div>
          </div>
        </div>

        {/* Partners list */}
        <div style={{ padding: "0 22px 4px", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
            Teman Sedia tersedia
            {partners.length > 0 && (
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginLeft: 6 }}>({partners.length})</span>
            )}
          </div>
        </div>

        {partners.length === 0 ? (
          <div style={{ padding: "48px 22px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "var(--primary-50)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--primary)", margin: "0 auto 16px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>Belum ada Teman Sedia</div>
            <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
              Belum ada mitra yang tersedia untuk kategori ini di kotamu.
            </div>
          </div>
        ) : (
          <div style={{ padding: "0 22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {partners.map((p) => (
              <div key={p.uid} className="card" style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <Avatar name={p.name} photoUrl={p.photo_url} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
                      </svg>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)" }}>
                      <span style={{ fontSize: 11 }}>⭐</span>
                      <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{p.rating?.toFixed(1) ?? "Baru"}</span>
                      <span>·</span>
                      <span>{p.total_jobs} job</span>
                      {p.city && <><span>·</span><span>{p.city}</span></>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)" }}>{rp(p.rate_per_hour)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>/jam</div>
                  </div>
                </div>
                <a href={`/partner/${p.uid}`} style={{ textDecoration: "none" }}>
                  <button className="btn-primary" style={{ fontSize: 13, padding: "11px" }}>
                    Pesan Sekarang
                  </button>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <TabBar active="home" />
    </div>
  );
}
