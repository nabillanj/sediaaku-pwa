"use client";

import { AppBar } from "@/components/AppBar";
import { TabBar } from "@/components/TabBar";
import { useState } from "react";

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = "SEDIA50";

  function handleCopy() {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="pwa-shell">
      <AppBar title="Ajak Teman" />

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }}>
        {/* Hero banner */}
        <div style={{ padding: "8px 22px 20px" }}>
          <div style={{
            borderRadius: 24, padding: "32px 24px",
            background: "var(--grad-hero)", color: "#fff",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 60%)",
              top: -60, right: -60, pointerEvents: "none",
            }} />
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, position: "relative" }}>
              Ajak teman, dapat saldo!
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, position: "relative" }}>
              Kamu & temanmu sama-sama dapat hingga{" "}
              <strong>Rp 50.000</strong> saat teman pertama kali booking.
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding: "0 22px 20px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>Cara kerja</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { num: "1", text: "Bagikan kode referralmu ke teman" },
              { num: "2", text: "Teman daftar pakai kodemu" },
              { num: "3", text: "Teman selesaikan booking pertama" },
              { num: "4", text: "Kalian berdua dapat saldo Rp 50.000!" },
            ].map((step) => (
              <div key={step.num} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.4 }}>{step.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral code */}
        <div style={{ padding: "0 22px 20px" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 8, fontWeight: 600 }}>Kode referralmu</div>
          <div className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, fontSize: 24, fontWeight: 800, color: "var(--primary)", letterSpacing: 3 }}>
              {referralCode}
            </div>
            <button onClick={handleCopy} style={{
              padding: "9px 16px", borderRadius: 10,
              background: copied ? "var(--primary-100)" : "var(--primary)",
              color: copied ? "var(--primary)" : "#fff",
              border: "none", fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer", flexShrink: 0,
              transition: "all 0.2s",
            }}>
              {copied ? "Disalin!" : "Salin"}
            </button>
          </div>
        </div>

        {/* Share button */}
        <div style={{ padding: "0 22px" }}>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "Sediaaku — Semua Bantuan dalam Genggaman",
                  text: `Coba Sediaaku! Pakai kode ${referralCode} saat daftar dan kita berdua dapat saldo Rp 50.000.`,
                });
              }
            }}
            className="btn-primary"
          >
            Bagikan ke Teman
          </button>
        </div>
      </div>

      <TabBar active="profile" />
    </div>
  );
}
