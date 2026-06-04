import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import Link from "next/link";

export default async function SplashPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "partner") redirect("/mitra/home");
    else redirect("/home");
  }

  return (
    <div className="pwa-shell" style={{ background: "var(--grad-hero)", minHeight: "100dvh" }}>
      {/* Decorative orbs */}
      <div style={{
        position: "absolute", width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 60%)",
        top: -100, right: -100, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 60%)",
        bottom: -80, left: -80, pointerEvents: "none",
      }} />

      {/* Center: logo + tagline */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 32px", position: "relative", zIndex: 2,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Sediaaku"
          style={{ width: 260, objectFit: "contain", marginBottom: 20, filter: "brightness(0) invert(1)" }}
        />
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.92)", textAlign: "center", maxWidth: 240, lineHeight: 1.6 }}>
          Platform bantuan harian — terhubung dengan Teman Sedia kapan saja, di mana saja.
        </p>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "0 24px 48px", position: "relative", zIndex: 2 }}>
        <Link href="/auth" style={{ display: "block" }}>
          <button className="btn-primary" style={{ background: "#fff", color: "var(--primary)" }}>
            Mulai sekarang
          </button>
        </Link>
        <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 14 }}>
          Sudah punya akun?{" "}
          <Link href="/auth/masuk" style={{ color: "#fff", fontWeight: 700, textDecoration: "underline" }}>
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
