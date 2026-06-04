import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import Link from "next/link";

async function getRejectedPartner(uid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT name, reject_reason, ktp_url, selfie_url, bio, photo_url
       FROM partners WHERE uid = $1`,
      [uid]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function RejectedPage() {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/auth");

  const partner = await getRejectedPartner(session.uid);
  if (!partner) redirect("/auth");

  // Cek apa yang kurang
  const missing = [
    !partner.photo_url && "Foto profil",
    !partner.bio && "Bio / deskripsi diri",
    !partner.ktp_url && "Foto KTP",
    !partner.selfie_url && "Foto selfie dengan KTP",
  ].filter(Boolean) as string[];

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, padding: "20px 24px 0", display: "flex", flexDirection: "column" }}>

        {/* Icon */}
        <div style={{
          width: 110, height: 110, borderRadius: "50%",
          background: "var(--danger-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--danger)", margin: "12px auto 20px",
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: "var(--text-1)", textAlign: "center" }}>
          Pendaftaran ditolak
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>
          Kamu bisa memperbaiki data dan mendaftar ulang.
        </p>

        {/* Alasan penolakan */}
        {partner.reject_reason && (
          <div style={{
            background: "var(--danger-bg)", borderRadius: 14,
            padding: 14, marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
              Alasan penolakan
            </div>
            <div style={{ fontSize: 13, color: "var(--danger)", lineHeight: 1.6 }}>
              {partner.reject_reason}
            </div>
          </div>
        )}

        {/* Data yang kurang */}
        {missing.length > 0 && (
          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
              Data yang perlu dilengkapi
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {missing.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: "var(--warn-bg)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v4M12 17h.01"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {missing.length === 0 && !partner.reject_reason && (
          <div className="card" style={{ padding: 14, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
              Hubungi tim Sediaaku untuk informasi lebih lanjut.
            </div>
          </div>
        )}

      </div>

      <div style={{ padding: "16px 24px 32px", display: "flex", gap: 10 }}>
        <Link href="/auth/masuk" style={{ flex: 1, display: "block" }}>
          <button className="btn-ghost" style={{ width: "100%" }}>Login pengguna</button>
        </Link>
        <Link href="/mitra/profil" style={{ flex: 1.3, display: "block" }}>
          <button className="btn-primary" style={{ width: "100%" }}>Perbarui profil</button>
        </Link>
      </div>
    </div>
  );
}
