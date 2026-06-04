"use client";

import { useState } from "react";
import Link from "next/link";

type Bank = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

interface Props {
  balance: number;
  bank: Bank | null;
  hasPending: boolean;
  onConfirm: (amount: number) => Promise<{ ok: boolean; error?: string }>;
}

const MIN_WITHDRAW = 100000;

function rp(n: number) {
  return "Rp " + Math.abs(n).toLocaleString("id-ID");
}

function maskNumber(n: string) {
  if (n.length <= 4) return n;
  return "•••• " + n.slice(-4);
}

function BankLogo({ name }: { name: string }) {
  const colors: Record<string, string> = {
    BCA: "#003087", BRI: "#003f8a", BNI: "#ff6600",
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

export default function CairkanSheet({ balance, bank, hasPending, onConfirm }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [rawAmount, setRawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = Number(rawAmount.replace(/\D/g, "")) || 0;
  const transferFee = bank && bank.bankName !== "BCA" ? 7500 : 0;
  const adminFee = transferFee;
  const netAmount = amount - adminFee;
  const canProceed = bank && amount >= MIN_WITHDRAW && amount <= balance;

  function handleOpen() {
    setStep(1);
    setRawAmount("");
    setError("");
    setOpen(true);
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
  }

  function handleAmountChange(val: string) {
    const digits = val.replace(/\D/g, "");
    setRawAmount(digits);
    setError("");
  }

  function handleNext() {
    if (!bank) return;
    if (amount < MIN_WITHDRAW) {
      setError(`Minimum pencairan ${rp(MIN_WITHDRAW)}`);
      return;
    }
    if (amount > balance) {
      setError("Melebihi saldo aktif kamu");
      return;
    }
    setError("");
    setStep(2);
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    const res = await onConfirm(amount);
    setLoading(false);
    if (res.ok) {
      setOpen(false);
    } else {
      setError(res.error ?? "Gagal mengajukan pencairan.");
    }
  }

  const canWithdraw = balance >= MIN_WITHDRAW && !hasPending && !loading;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={canWithdraw ? handleOpen : undefined}
        disabled={!canWithdraw}
        style={{
          padding: "13px", borderRadius: 13, border: "none",
          background: canWithdraw ? "#fff" : "rgba(255,255,255,0.3)",
          color: canWithdraw ? "var(--primary)" : "rgba(255,255,255,0.6)",
          fontSize: 15, fontWeight: 700, fontFamily: "inherit",
          cursor: canWithdraw ? "pointer" : "not-allowed",
          width: "100%",
        }}
      >
        Cairkan
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.45)",
          }}
        />
      )}

      {/* Bottom sheet */}
      <div style={{
        position: "fixed", left: "50%", bottom: 0, zIndex: 50,
        width: "100%", maxWidth: 430,
        background: "var(--surface)",
        borderRadius: "20px 20px 0 0",
        padding: "0 0 env(safe-area-inset-bottom)",
        transform: open ? "translateX(-50%)" : "translateX(-50%) translateY(110%)",
        transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setError(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", lineHeight: 1 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
              {step === 1 ? "Cairkan saldo" : "Konfirmasi pencairan"}
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-3)", lineHeight: 1 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "0 20px 28px" }}>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              {/* Saldo tersedia */}
              <div style={{
                background: "var(--primary-50)", borderRadius: 14,
                padding: "14px 16px", marginBottom: 20,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>Saldo aktif</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--primary)" }}>{rp(balance)}</span>
              </div>

              {/* Rekening tujuan */}
              <div style={{ marginBottom: 20 }}>
                <div className="input-label" style={{ marginBottom: 8 }}>Rekening tujuan</div>
                {bank ? (
                  <div className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <BankLogo name={bank.bankName} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                        {bank.bankName} — {maskNumber(bank.accountNumber)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                        a/n {bank.accountHolder}
                      </div>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <Link href="/mitra/profil/bank" style={{ textDecoration: "none" }}>
                    <div style={{
                      border: "1.5px dashed var(--border)", borderRadius: 14,
                      padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
                      background: "var(--surface-2)",
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="7" rx="2" width="18" height="12"/><path d="M3 11h18"/><circle cx="16" cy="15" r="1" fill="currentColor"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Tambah rekening bank</div>
                        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Wajib diisi sebelum cairkan</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                )}
              </div>

              {/* Nominal */}
              <div style={{ marginBottom: 8 }}>
                <div className="input-label" style={{ marginBottom: 8 }}>Jumlah pencairan</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  border: "1.5px solid var(--border)", borderRadius: 12,
                  padding: "10px 14px", background: bank ? "var(--surface)" : "var(--surface-2)",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)" }}>Rp</span>
                  <input
                    type="tel"
                    value={rawAmount ? Number(rawAmount).toLocaleString("id-ID") : ""}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    disabled={!bank}
                    style={{
                      flex: 1, border: "none", outline: "none", background: "transparent",
                      fontSize: 18, fontWeight: 700, fontFamily: "inherit",
                      color: bank ? "var(--text-1)" : "var(--text-3)",
                    }}
                  />
                  {bank && amount < balance && (
                    <button
                      onClick={() => setRawAmount(String(balance))}
                      style={{
                        background: "var(--primary-50)", border: "none",
                        color: "var(--primary)", fontSize: 11, fontWeight: 700,
                        padding: "4px 10px", borderRadius: 99,
                        cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                      }}
                    >
                      Semua
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
                  Minimum {rp(MIN_WITHDRAW)}{transferFee > 0 ? " · Biaya transfer Rp 7.500 (non-BCA)" : ""}
                </div>
              </div>

              {/* Preview net */}
              {amount >= MIN_WITHDRAW && amount <= balance && (
                <div style={{
                  borderRadius: 12, background: "var(--surface-2)",
                  padding: "12px 14px", marginTop: 12,
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  {[
                    { label: "Jumlah cairkan", val: rp(amount) },
                    ...(transferFee > 0 ? [{ label: "Biaya transfer (non-BCA)", val: `–${rp(transferFee)}` }] : []),
                    { label: "Diterima", val: rp(netAmount), bold: true },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--text-3)" }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: row.bold ? "var(--primary)" : "var(--text-2)" }}>
                        {row.val}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div style={{ fontSize: 13, color: "var(--danger)", marginTop: 10 }}>{error}</div>
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed}
                style={{
                  marginTop: 20, width: "100%", padding: "14px",
                  borderRadius: 14, border: "none",
                  background: canProceed ? "var(--primary)" : "var(--border)",
                  color: canProceed ? "#fff" : "var(--text-3)",
                  fontSize: 15, fontWeight: 700, fontFamily: "inherit",
                  cursor: canProceed ? "pointer" : "not-allowed",
                }}
              >
                Lanjut
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && bank && (
            <>
              {/* Ringkasan */}
              <div style={{
                borderRadius: 16, background: "var(--primary-50)",
                border: "1.5px solid var(--primary-100, var(--primary-50))",
                padding: "20px", marginBottom: 20, textAlign: "center",
              }}>
                <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>Kamu akan menerima</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "var(--primary)", letterSpacing: "-1px" }}>
                  {rp(netAmount)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                  dari {rp(amount)}{adminFee > 0 ? ` · biaya transfer ${rp(adminFee)}` : ""}
                </div>
              </div>

              {/* Rekening tujuan */}
              <div style={{ marginBottom: 20 }}>
                <div className="input-label" style={{ marginBottom: 8 }}>Rekening tujuan</div>
                <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <BankLogo name={bank.bankName} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                      {bank.bankName} — {maskNumber(bank.accountNumber)}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>
                      a/n {bank.accountHolder}
                    </div>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div style={{
                padding: "12px 14px", borderRadius: 12,
                background: "var(--warning-bg, #fffbeb)",
                border: "1px solid var(--warning-border, #fcd34d)",
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, color: "var(--warning-text, #92400e)", lineHeight: 1.6 }}>
                  ⚠️ Proses pencairan 1–3 hari kerja. Pastikan rekening aktif dan data sudah benar.
                </div>
              </div>

              {error && (
                <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 12 }}>{error}</div>
              )}

              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  borderRadius: 14, border: "none",
                  background: loading ? "var(--border)" : "var(--primary)",
                  color: loading ? "var(--text-3)" : "#fff",
                  fontSize: 15, fontWeight: 700, fontFamily: "inherit",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Mengajukan..." : "Konfirmasi cairkan"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
