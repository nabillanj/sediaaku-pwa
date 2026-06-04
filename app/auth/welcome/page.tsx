import Link from "next/link";
import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function WelcomePage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const steps = [
    { label: "Pilih layanan yang kamu butuhkan", icon: "🔍" },
    { label: "Pilih Teman Sedia favoritmu", icon: "👥" },
    { label: "Atur jadwal & konfirmasi pesanan", icon: "📅" },
  ];

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "40px 24px 0", alignItems: "center", textAlign: "center" }}>
        {/* Success icon */}
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "var(--grad-hero)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", marginBottom: 22,
          boxShadow: "0 16px 40px rgba(14,124,113,0.32)",
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--text-1)" }}>
          Akun siap dipakai!
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", maxWidth: 260, marginBottom: 28, lineHeight: 1.6 }}>
          Halo, <strong style={{ color: "var(--text-1)" }}>{session.name.split(" ")[0]}</strong>! Yuk pesan bantuan pertamamu.
        </p>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((s) => (
            <div key={s.label} style={{
              background: "var(--surface-2)", borderRadius: 14,
              display: "flex", alignItems: "center", gap: 12, padding: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12, background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", textAlign: "left" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 24px 32px" }}>
        <Link href="/home" style={{ display: "block" }}>
          <button className="btn-primary">Cari layanan</button>
        </Link>
      </div>
    </div>
  );
}
