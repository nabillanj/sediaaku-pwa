"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";

const BANKS = [
  { value: "BCA",     label: "BCA — Bank Central Asia",       fee: null },
  { value: "BRI",     label: "BRI — Bank Rakyat Indonesia",   fee: 7500 },
  { value: "BNI",     label: "BNI — Bank Negara Indonesia",   fee: 7500 },
];

type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

function BankLogo({ name }: { name: string }) {
  const colors: Record<string, string> = {
    BCA: "#003087", BRI: "#003f8a", BNI: "#ff6600", Mandiri: "#003087",
  };
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: colors[name] ?? "#888",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: 0.5,
    }}>
      {name}
    </div>
  );
}

function maskNumber(n: string) {
  if (n.length <= 4) return n;
  return "•••• " + n.slice(-4);
}

export default function BankForm({ existing: initialExisting }: { existing: BankAccount | null }) {
  const [saved, setSaved] = useState<BankAccount | null>(initialExisting);
  const [mode, setMode] = useState<"view" | "form" | "confirm-delete">(initialExisting ? "view" : "form");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!bankName) {
      setError("Pilih bank terlebih dahulu.");
      return;
    }
    if (!accountNumber.trim()) {
      setError("Nomor rekening wajib diisi.");
      return;
    }
    if (!accountHolder.trim()) {
      setError("Nama pemilik rekening wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/mitra/bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName, accountNumber, accountHolder }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      setSaved({ id: "", bankName, accountNumber, accountHolder });
      setMode("view");
    } else {
      setError(data.error ?? "Gagal menyimpan.");
    }
  }

  async function handleDelete() {
    setLoading(true);
    await fetch("/api/mitra/bank", { method: "DELETE" });
    setLoading(false);
    setSaved(null);
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
    setMode("form");
  }

  return (
    <div className="pwa-shell">
      <AppBar title="Rekening bank" />

      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 100px" }}>

        {/* VIEW: ada rekening */}
        {mode === "view" && saved && (
          <>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5 }}>
              Rekening ini digunakan untuk pencairan saldo kamu.
            </p>

            {/* Bank card */}
            <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <BankLogo name={saved.bankName} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                  {saved.bankName} — {maskNumber(saved.accountNumber)}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>
                  a/n {saved.accountHolder}
                </div>
                {saved.bankName === "Mandiri" && (
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                    Biaya transfer Rp 6.500 per pencairan
                  </div>
                )}
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <button
              onClick={() => setMode("confirm-delete")}
              style={{
                width: "100%", padding: "13px",
                borderRadius: 14, border: "1.5px solid var(--danger)",
                background: "var(--danger-bg)", color: "var(--danger)",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              Hapus & ganti rekening
            </button>
          </>
        )}

        {/* CONFIRM DELETE */}
        {mode === "confirm-delete" && saved && (
          <>
            <div className="card" style={{ padding: 20, marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>
                Hapus rekening ini?
              </div>
              <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
                {saved.bankName} •••• {saved.accountNumber.slice(-4)}<br />
                a/n {saved.accountHolder}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setMode("view")}
                style={{
                  flex: 1, padding: "13px", borderRadius: 14,
                  border: "1.5px solid var(--border)", background: "var(--surface)",
                  color: "var(--text-2)", fontSize: 14, fontWeight: 600,
                  fontFamily: "inherit", cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                  flex: 1, padding: "13px", borderRadius: 14,
                  border: "none", background: "var(--danger)",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  fontFamily: "inherit", cursor: "pointer", opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Menghapus..." : "Ya, hapus"}
              </button>
            </div>
          </>
        )}

        {/* FORM: tambah rekening */}
        {mode === "form" && (
          <>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20, lineHeight: 1.5 }}>
              Masukkan rekening untuk menerima pencairan saldo kamu.
            </p>

            {/* Pilih bank */}
            <div style={{ marginBottom: 16 }}>
              <div className="input-label">Bank</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                {BANKS.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBankName(b.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 14, fontFamily: "inherit",
                      cursor: "pointer", textAlign: "left",
                      border: bankName === b.value
                        ? "2px solid var(--primary)"
                        : "1.5px solid var(--border)",
                      background: bankName === b.value
                        ? "var(--primary-50)"
                        : "var(--surface)",
                    }}
                  >
                    <BankLogo name={b.value} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{b.label}</div>
                      {b.fee && (
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                          + Rp {b.fee.toLocaleString("id-ID")} biaya transfer per pencairan
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      border: bankName === b.value ? "none" : "1.5px solid var(--border)",
                      background: bankName === b.value ? "var(--primary)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {bankName === b.value && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nomor rekening */}
            <div style={{ marginBottom: 16 }}>
              <div className="input-label">Nomor rekening</div>
              <input
                type="tel"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Contoh: 1234567890"
                className="input-field"
                style={{ marginTop: 6 }}
              />
            </div>

            {/* Nama pemilik */}
            <div style={{ marginBottom: 20 }}>
              <div className="input-label">Nama sesuai rekening</div>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Sesuai nama di buku tabungan"
                className="input-field"
                style={{ marginTop: 6 }}
              />
            </div>

            {/* Warning */}
            <div style={{
              padding: "12px 14px", borderRadius: 12,
              background: "var(--warning-bg, #fffbeb)",
              border: "1px solid var(--warning-border, #fcd34d)",
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, color: "var(--warning-text, #92400e)", lineHeight: 1.6 }}>
                ⚠️ Pastikan nomor rekening dan nama pemilik sudah benar. Kesalahan data rekening adalah tanggung jawab mitra dan tidak dapat diklaim ke Sediaaku.
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 12 }}>{error}</div>
            )}
          </>
        )}
      </div>

      {/* Save button — only show on form mode */}
      {mode === "form" && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "12px 16px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border-soft)",
        }}>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan rekening"}
          </button>
        </div>
      )}
    </div>
  );
}
