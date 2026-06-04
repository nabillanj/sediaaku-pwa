"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PilihRolePage() {
  const [role, setRole] = useState<"user" | "partner">("user");
  const router = useRouter();

  function handleLanjut() {
    if (role === "user") {
      router.push("/auth/daftar?role=user");
    } else {
      router.push("/auth/daftar?role=partner");
    }
  }

  return (
    <div className="pwa-shell">
      {/* Header */}
      <div style={{ padding: "18px 24px 0" }}>
        <div style={{ fontSize: 14, color: "var(--primary)", fontWeight: 700, marginBottom: 4 }}>Sediaaku</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, marginBottom: 6, color: "var(--text-1)" }}>
          Mau jadi apa kamu<br />di Sediaaku?
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24 }}>
          Pilih peran kamu — bisa diubah kapan saja dari profil.
        </p>
      </div>

      <div style={{ flex: 1, padding: "0 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Pengguna card */}
        <button
          onClick={() => setRole("user")}
          className="card"
          style={{
            padding: 18, textAlign: "left", cursor: "pointer",
            border: role === "user" ? "2px solid var(--primary)" : "1px solid var(--border-soft)",
            background: role === "user" ? "linear-gradient(135deg, #F3FAF8 0%, #E6F4F0 100%)" : "var(--surface)",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--primary)", boxShadow: "0 1px 3px rgba(15,31,29,0.08)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "var(--text-1)" }}>Saya butuh bantuan</div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>Pesan layanan harian dari Teman Sedia terverifikasi.</div>
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: 11, flexShrink: 0,
              background: role === "user" ? "var(--primary)" : "transparent",
              border: role === "user" ? "none" : "1.5px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {role === "user" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        </button>

        {/* Mitra card */}
        <button
          onClick={() => setRole("partner")}
          className="card"
          style={{
            padding: 18, textAlign: "left", cursor: "pointer",
            border: role === "partner" ? "2px solid var(--primary)" : "1px solid var(--border-soft)",
            background: role === "partner" ? "linear-gradient(135deg, #F3FAF8 0%, #E6F4F0 100%)" : "var(--surface)",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "var(--primary-50)", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--primary)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "var(--text-1)" }}>Saya Teman Sedia</div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>Tawarkan jasa, atur jadwal sendiri, dapat penghasilan.</div>
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: 11, flexShrink: 0,
              background: role === "partner" ? "var(--primary)" : "transparent",
              border: role === "partner" ? "none" : "1.5px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {role === "partner" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        </button>

        <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "8px 8px 0", lineHeight: 1.6 }}>
          Dengan melanjutkan kamu setuju dengan{" "}
          <span style={{ color: "var(--primary)", fontWeight: 600 }}>Syarat & Ketentuan</span>{" "}
          dan{" "}
          <span style={{ color: "var(--primary)", fontWeight: 600 }}>Kebijakan Privasi</span>.
        </p>
      </div>

      <div style={{ padding: "16px 18px 32px" }}>
        <button className="btn-primary" onClick={handleLanjut}>Lanjut</button>
      </div>
    </div>
  );
}
