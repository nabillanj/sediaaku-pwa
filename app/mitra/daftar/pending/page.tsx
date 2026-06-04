import Link from "next/link";

const steps = [
  { label: "Data diri lengkap", done: true },
  { label: "Layanan & tarif terpilih", done: true },
  { label: "KTP & selfie dikirim", done: true },
  { label: "Review tim Sediaaku", done: false, meta: "~ 1×24 jam" },
];

export default function PendingPage() {
  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, padding: "20px 24px 0", textAlign: "center", display: "flex", flexDirection: "column" }}>
        {/* Clock icon */}
        <div style={{
          width: 110, height: 110, borderRadius: "50%",
          background: "var(--grad-hero-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--primary)", margin: "12px auto 20px",
        }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: "var(--text-1)" }}>Lagi direview...</h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.6 }}>
          Tim Sediaaku akan kabari kamu via WhatsApp & notifikasi app dalam{" "}
          <strong style={{ color: "var(--text-1)" }}>1×24 jam</strong>.
        </p>

        {/* Progress steps */}
        <div className="card" style={{ padding: 14, textAlign: "left", marginBottom: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
                {i < steps.length - 1 && (
                  <div style={{
                    position: "absolute", left: 10, top: 26, bottom: -12, width: 2,
                    background: s.done ? "var(--primary)" : "var(--border)",
                  }} />
                )}
                {/* dot */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: s.done ? "var(--primary)" : !steps[i - 1]?.done ? "var(--surface-2)" : "var(--primary-50)",
                  border: !s.done && steps[i - 1]?.done ? "2px solid var(--primary)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {s.done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{s.label}</div>
                  {s.meta && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{s.meta}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tip card */}
        <div style={{ background: "var(--primary-50)", borderRadius: 14, padding: 14, textAlign: "left", display: "flex", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-700)", marginBottom: 3 }}>Sambil nunggu...</div>
            <div style={{ fontSize: 12, color: "var(--primary-700)", lineHeight: 1.5 }}>
              Lengkapi foto profil, bio, dan set jadwal kamu biar siap saat terverifikasi.
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px 32px", display: "flex", gap: 10 }}>
        <Link href="/auth/masuk" style={{ flex: 1, display: "block" }}>
          <button className="btn-ghost" style={{ width: "100%" }}>Login pengguna</button>
        </Link>
        <Link href="/mitra/profil" style={{ flex: 1.3, display: "block" }}>
          <button className="btn-primary" style={{ width: "100%" }}>Lengkapi profil</button>
        </Link>
      </div>
    </div>
  );
}
