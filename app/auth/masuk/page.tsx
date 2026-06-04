"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { requestOtp } from "@/lib/actions/auth";

export default function MasukPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 13) {
      setError("Nomor HP tidak valid");
      return;
    }
    setError("");
    setLoading(true);
    const result = await requestOtp(digits);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Gagal mengirim OTP");
      return;
    }
    router.push(`/auth/otp?phone=${digits}&mode=login`);
  }

  return (
    <div className="pwa-shell">
      <AppBar title="" />

      <div style={{ flex: 1, padding: "8px 24px 0", display: "flex", flexDirection: "column" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: "var(--primary-50)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--primary)", marginBottom: 18,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: "var(--text-1)" }}>Masuk ke Sediaaku</h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 28, lineHeight: 1.6 }}>
          Masukkan nomor HP kamu. Kami akan kirim kode OTP untuk verifikasi.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-label">Nomor HP</div>
          <div style={{
            display: "flex", alignItems: "center",
            border: `1.5px solid ${error ? "var(--danger)" : "var(--border)"}`,
            borderRadius: 14, overflow: "hidden",
            background: error ? "var(--danger-bg)" : "var(--surface)",
            transition: "border-color 0.15s",
          }}>
            <span style={{
              padding: "14px 12px 14px 16px", fontSize: 15, fontWeight: 600,
              color: "var(--text-2)", borderRight: "1.5px solid var(--border)",
              flexShrink: 0,
            }}>🇮🇩 +62</span>
            <input
              style={{
                flex: 1, border: "none", outline: "none", padding: "14px 16px",
                fontSize: 15, fontWeight: 500, fontFamily: "inherit",
                color: "var(--text-1)", background: "transparent",
              }}
              type="tel"
              placeholder="812 3456 7890"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(""); }}
              autoComplete="tel"
              inputMode="numeric"
              autoFocus
            />
          </div>
          {error && <div className="input-error" style={{ marginTop: 8 }}>⚠ {error}</div>}
        </form>
      </div>

      <div style={{ padding: "16px 24px 32px" }}>
        <button className="btn-primary" onClick={handleSubmit as any} disabled={loading}>
          {loading ? "Mengirim..." : "Kirim Kode OTP"}
        </button>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-2)", marginTop: 16 }}>
          Belum punya akun?{" "}
          <span
            onClick={() => router.push("/auth")}
            style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}
          >
            Daftar sekarang
          </span>
        </p>
      </div>
    </div>
  );
}
