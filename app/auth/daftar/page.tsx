"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { requestOtp } from "@/lib/actions/auth";
import { Suspense } from "react";
import { BANDUNG_AREAS } from "@/lib/constants/areas";

function DaftarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") ?? "user";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nama lengkap wajib diisi";
    else if (name.trim().length < 2) e.name = "Nama minimal 2 karakter";

    const digits = phone.replace(/\D/g, "");
    if (!phone.trim()) e.phone = "Nomor HP wajib diisi";
    else if (digits.length < 9 || digits.length > 13) e.phone = "Nomor HP tidak valid";

    if (!city) e.city = "Kota / Kabupaten wajib dipilih";

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Format email tidak valid";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const digits = phone.replace(/\D/g, "");
    const result = await requestOtp(digits);
    setLoading(false);

    if (!result.ok) {
      setErrors({ phone: result.error ?? "Gagal mengirim OTP" });
      return;
    }

    const sp = new URLSearchParams({
      phone: digits,
      name: name.trim(),
      city: city.trim(),
      email: email.trim(),
      role,
    });
    router.push(`/auth/otp?${sp.toString()}`);
  }

  return (
    <div className="pwa-shell">
      <AppBar title="Buat akun" />

      <form onSubmit={handleSubmit} style={{ flex: 1, padding: "4px 20px 0", overflow: "auto" }} noValidate>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: "var(--text-1)" }}>Halo! 👋</h2>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>
          Isi data dulu, ya. Cuma butuh 1 menit.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nama */}
          <div>
            <div className="input-label">Nama lengkap *</div>
            <input
              className={`input-field${errors.name ? " error" : ""}`}
              type="text"
              placeholder="Nama sesuai KTP"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
              autoComplete="name"
            />
            {errors.name && <div className="input-error">⚠ {errors.name}</div>}
          </div>

          {/* Phone */}
          <div>
            <div className="input-label">Nomor HP *</div>
            <div style={{ position: "relative" }}>
              <div style={{
                display: "flex", alignItems: "center",
                border: `1.5px solid ${errors.phone ? "var(--danger)" : "var(--border)"}`,
                borderRadius: 14, overflow: "hidden",
                background: errors.phone ? "var(--danger-bg)" : "var(--surface)",
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
                  onChange={(e) => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: "" })); }}
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
            </div>
            {errors.phone && <div className="input-error">⚠ {errors.phone}</div>}
          </div>

          {/* City */}
          <div>
            <div className="input-label">Kota / Kabupaten *</div>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                pointerEvents: "none", zIndex: 1,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <select
                className={`input-field${errors.city ? " error" : ""}`}
                style={{ paddingLeft: 38, appearance: "none", cursor: "pointer" }}
                value={city}
                onChange={(e) => { setCity(e.target.value); setErrors(p => ({ ...p, city: "" })); }}
              >
                <option value="">Pilih kota / kabupaten...</option>
                {BANDUNG_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
              Saat ini Sediaaku tersedia di area Bandung Raya
            </div>
            {errors.city && <div className="input-error">⚠ {errors.city}</div>}
          </div>

          {/* Email */}
          <div>
            <div className="input-label">
              Email <span style={{ color: "var(--text-3)", fontWeight: 500 }}>(opsional)</span>
            </div>
            <input
              className={`input-field${errors.email ? " error" : ""}`}
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
              autoComplete="email"
              inputMode="email"
            />
            {errors.email && <div className="input-error">⚠ {errors.email}</div>}
          </div>
        </div>

        {/* Privacy notice */}
        <div style={{
          marginTop: 20, padding: 14, background: "var(--primary-50)", borderRadius: 14,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
          </svg>
          <p style={{ fontSize: 12, color: "var(--primary-700)", flex: 1, lineHeight: 1.5 }}>
            Data pribadi kamu terlindungi dan hanya digunakan untuk keperluan layanan.
          </p>
        </div>
      </form>

      <div style={{ padding: "16px 20px 32px" }}>
        <button className="btn-primary" onClick={handleSubmit as any} disabled={loading}>
          {loading ? "Mengirim..." : "Kirim Kode OTP"}
        </button>
      </div>
    </div>
  );
}

export default function DaftarPage() {
  return (
    <Suspense>
      <DaftarForm />
    </Suspense>
  );
}
