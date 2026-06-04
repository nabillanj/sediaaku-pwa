import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import { AppBar } from "@/components/AppBar";

async function getUlasan(partnerUid: string) {
  const { rows } = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at,
            u.name AS user_name,
            c.name AS category_name, c.emoji AS category_emoji
     FROM reviews r
     JOIN users u ON u.uid = r.user_uid
     JOIN orders o ON o.id = r.order_id
     JOIN categories c ON c.id = o.category_id
     WHERE r.partner_uid = $1
     ORDER BY r.created_at DESC`,
    [partnerUid]
  );
  return rows;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= rating ? "#F59E0B" : "#E5E7EB"} stroke="none">
          <path d="M12 2l3 7h7l-5.7 4.2L18 21l-6-4-6 4 1.7-7.8L2 9h7z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default async function UlasanMasukPage() {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/");

  const ulasan = await getUlasan(session.uid);

  const avgRating = ulasan.length
    ? (ulasan.reduce((sum, r) => sum + r.rating, 0) / ulasan.length).toFixed(1)
    : null;

  return (
    <div className="pwa-shell">
      <AppBar title="Ulasan masuk" />

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 24 }}>

        {/* Summary card */}
        {ulasan.length > 0 && (
          <div style={{ padding: "0 16px 16px" }}>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>
                    {avgRating}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Stars rating={Math.round(Number(avgRating))} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                    {ulasan.length} ulasan
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ulasan.filter((r) => r.rating === star).length;
                    const pct = ulasan.length ? (count / ulasan.length) * 100 : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--text-3)", width: 8 }}>{star}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "#F59E0B", borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-3)", width: 16, textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review list */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {ulasan.length === 0 ? (
            <div style={{
              borderRadius: 18, padding: "40px 20px", textAlign: "center",
              background: "var(--surface)", border: "1px dashed var(--border)",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "var(--primary-50)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--primary)", margin: "0 auto 12px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>
                Belum ada ulasan
              </div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                Ulasan dari pengguna akan muncul di sini setelah job selesai.
              </div>
            </div>
          ) : (
            ulasan.map((r) => (
              <div key={r.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <Avatar name={r.user_name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{r.user_name}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{formatDate(r.created_at)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Stars rating={r.rating} />
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                        background: "var(--primary-50)", color: "var(--primary-700)",
                      }}>
                        {r.category_emoji} {r.category_name}
                      </span>
                    </div>
                  </div>
                </div>
                {r.comment && (
                  <p style={{
                    fontSize: 13, color: "var(--text-2)", lineHeight: 1.6,
                    background: "var(--surface-2)", borderRadius: 10, padding: "10px 12px", margin: 0,
                  }}>
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
