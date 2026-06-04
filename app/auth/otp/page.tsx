"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { verifyAndCreateUser, verifyOtpForMitra, loginUser } from "@/lib/actions/auth";

function OtpForm() {
  const router = useRouter();
  const params = useSearchParams();

  const phone = params.get("phone") ?? "";
  const name = params.get("name") ?? "";
  const city = params.get("city") ?? "";
  const email = params.get("email") ?? "";
  const role = params.get("role") ?? "user";
  const mode = params.get("mode") ?? "register";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [needRoleSelect, setNeedRoleSelect] = useState(false);
  const [pendingCode, setPendingCode] = useState("");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  function handleDigit(i: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setError("");
    if (char && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      inputsRef.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length < 6) { setError("Masukkan 6 digit kode OTP"); return; }
    setLoading(true);
    setError("");

    if (mode === "login") {
      const res = await loginUser({ phone, code });
      setLoading(false);
      if (!res.ok) {
        if (res.needRoleSelect) {
          setPendingCode(code);
          setNeedRoleSelect(true);
          return;
        }
        if (res.notFound) {
          setError("Nomor HP belum terdaftar. Silakan buat akun dulu.");
        } else {
          setError(res.error ?? "Kode salah");
        }
        return;
      }
      router.push((res as { role?: string }).role === "partner" ? "/mitra/home" : "/home");
    } else if (role === "partner") {
      const res = await verifyOtpForMitra(phone, code);
      setLoading(false);
      if (!res.ok) { setError(res.error ?? "Kode salah"); return; }
      const sp = new URLSearchParams({ phone, name, city, email });
      router.push(`/mitra/daftar?${sp.toString()}`);
    } else {
      const res = await verifyAndCreateUser({ phone, code, name, city, email });
      setLoading(false);
      if (!res.ok) { setError(res.error ?? "Kode salah"); return; }
      router.push("/auth/welcome");
    }
  }

  async function handleRoleSelect(selectedRole: "user" | "partner") {
    setLoading(true);
    const res = await loginUser({ phone, code: pendingCode, role: selectedRole });
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Gagal masuk"); return; }
    router.push(selectedRole === "partner" ? "/mitra/home" : "/home");
  }

  const phoneFormatted = phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3");

  if (needRoleSelect) {
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
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: "var(--text-1)" }}>Kamu mau masuk sebagai?</h1>
          <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 28, lineHeight: 1.6 }}>
            Nomor ini terdaftar sebagai pengguna dan Teman Sedia.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button className="card" onClick={() => handleRoleSelect("user")} disabled={loading} style={{ padding: 18, textAlign: "left", cursor: "pointer", width: "100%" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Pengguna</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>Pesan layanan harian</div>
            </button>
            <button className="card" onClick={() => handleRoleSelect("partner")} disabled={loading} style={{ padding: 18, textAlign: "left", cursor: "pointer", width: "100%" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Teman Sedia</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>Kelola jadwal & pesanan</div>
            </button>
          </div>
          {error && <div className="input-error" style={{ marginTop: 16 }}>⚠ {error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="pwa-shell">
      <AppBar title="" />

      <div style={{ flex: 1, padding: "8px 24px 0", display: "flex", flexDirection: "column" }}>
        {/* Lock icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: "var(--primary-50)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--primary)", marginBottom: 18,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: "var(--text-1)" }}>Cek SMS kamu</h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 28, lineHeight: 1.6 }}>
          Kode 6 digit dikirim ke<br />
          <span style={{ color: "var(--text-1)", fontWeight: 700 }}>+62 {phoneFormatted}</span>
        </p>

        {/* OTP inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 20 }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: "100%", height: 52,
                border: d ? "2px solid var(--primary)" : (error ? "1.5px solid var(--danger)" : "1.5px solid var(--border)"),
                borderRadius: 12,
                background: d ? "var(--primary-50)" : "var(--surface)",
                textAlign: "center",
                fontSize: 20, fontWeight: 700,
                color: d ? "var(--primary-700)" : "var(--text-1)",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
            />
          ))}
        </div>

        {error && (
          <div className="input-error" style={{ marginBottom: 12 }}>⚠ {error}</div>
        )}

        {/* Resend */}
        <div style={{ textAlign: "center", marginBottom: "auto" }}>
          <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 4 }}>Tidak menerima kode?</p>
          {countdown > 0 ? (
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)" }}>
              Kirim ulang dalam{" "}
              <span style={{ color: "var(--primary)" }}>00:{String(countdown).padStart(2, "0")}</span>
            </p>
          ) : (
            <button
              style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => setCountdown(60)}
            >
              Kirim ulang kode
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "14px 24px 32px" }}>
        <button className="btn-primary" onClick={handleVerify} disabled={loading || digits.join("").length < 6}>
          {loading ? "Memverifikasi..." : "Verifikasi"}
        </button>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  );
}
