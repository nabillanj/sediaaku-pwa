"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";

const APP_FEE = 5000;
const BANK_NAME = "BCA";
const BANK_ACCOUNT = "123 456 7890";
const BANK_HOLDER = "Sediaaku Indonesia";

function rp(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

export default function BookingBayarClient({
  partnerUid,
  walletBalance,
}: {
  partnerUid: string;
  walletBalance: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    voucherId: string; code: string; title: string;
    discountType: string; discountValue: number; maxDiscount: number | null; discountAmount: number;
  } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("bookingDraft");
    if (!raw) { router.replace(`/booking/${partnerUid}`); return; }
    setDraft(JSON.parse(raw));

    // auto-apply voucher yang dipilih dari halaman voucher
    const savedVoucher = sessionStorage.getItem("selectedVoucher");
    if (savedVoucher) {
      setAppliedVoucher(JSON.parse(savedVoucher));
      sessionStorage.removeItem("selectedVoucher");
    }
  }, [partnerUid, router]);

  if (!draft) return null;

  const serviceAmount = draft.serviceAmount as number;
  const discountAmount = appliedVoucher?.discountAmount ?? 0;
  const totalAmount = serviceAmount + APP_FEE - discountAmount;
  const canUseWallet = walletBalance >= totalAmount;

  const schedDate = draft.scheduledDate as string;
  const dateLabel = new Date(schedDate).toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short",
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProofFile(f);
    setProofPreview(URL.createObjectURL(f));
  }

  function copyAccount() {
    navigator.clipboard.writeText(BANK_ACCOUNT.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function applyVoucher() {
    if (!voucherCode.trim() || !draft) return;
    setVoucherError(null);
    setVoucherLoading(true);
    try {
      const res = await fetch("/api/voucher/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCode.trim(),
          serviceAmount,
          durationHours: draft.durationHours,
          categoryId: draft.categoryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setVoucherError(data.error); return; }
      setAppliedVoucher({ ...data, code: voucherCode.trim().toUpperCase() });
      setVoucherCode("");
    } catch {
      setVoucherError("Gagal memvalidasi voucher");
    } finally {
      setVoucherLoading(false);
    }
  }

  async function handleSubmit() {
    if (!draft) return;
    setError(null);
    if (!canUseWallet && !proofFile) {
      setError("Upload bukti transfer terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      let proofUrl: string | null = null;
      if (!canUseWallet && proofFile) {
        const form = new FormData();
        form.append("file", proofFile);
        form.append("folder", "payment-proofs");
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload gagal");
        const data = await res.json();
        proofUrl = data.url;
      }

      const payload = {
        partnerUid: draft.partnerUid,
        categoryId: draft.categoryId,
        scheduledDate: draft.scheduledDate,
        startTime: draft.startTime,
        endTime: draft.endTime,
        durationHours: draft.durationHours,
        address: draft.address,
        addressKabupaten: draft.addressKabupaten,
        addressLat: draft.addressLat ?? null,
        addressLng: draft.addressLng ?? null,
        landmark: draft.landmark,
        careSubjects: draft.careSubjects,
        userNote: draft.userNote,
        serviceAmount,
        appFee: APP_FEE,
        discountAmount,
        totalAmount,
        voucherCode: appliedVoucher?.code ?? null,
        voucherId: appliedVoucher?.voucherId ?? null,
        paymentMethod: canUseWallet ? "wallet" : "transfer",
        proofUrl,
      };

      const res = await fetch("/api/booking", {
        method: "POST", body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Gagal membuat pesanan");
      }
      const { orderId } = await res.json();
      sessionStorage.removeItem("bookingDraft");
      router.push(`/booking/${partnerUid}/menunggu?orderId=${orderId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 100 }}>

        {/* AppBar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", position: "sticky", top: 0,
          background: "var(--bg)", zIndex: 10,
          borderBottom: "1px solid var(--border-soft)",
        }}>
          <BackButton fallback={`/booking/${partnerUid}/alamat`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Ringkasan & Pembayaran</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>3 dari 3</div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Provider summary card */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 20, overflow: "hidden",
          }}>
            {/* Partner row */}
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border-soft)" }}>
              {draft.partnerPhoto ? (
                <img src={draft.partnerPhoto as string} alt={draft.partnerName as string}
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div className="avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                  {(draft.partnerName as string).split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{draft.partnerName as string}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{draft.categoryName as string}</div>
              </div>
            </div>

            {/* Detail rows */}
            {[
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                label: `${dateLabel} · ${draft.startTime as string}–${draft.endTime as string}`,
                sub: `${draft.durationHours as number} jam`,
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-7 8-13a8 8 0 10-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg>,
                label: draft.address as string,
                sub: null,
              },
              ...((draft.careSubjects as string[]).length > 0 ? [{
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
                label: (draft.careSubjects as string[]).join(", "),
                sub: null,
              }] : []),
            ].map((row, i, arr) => (
              <div key={i} style={{
                padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
                borderBottom: i < arr.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: "var(--primary-50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {row.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500, lineHeight: 1.4 }}>{row.label}</div>
                  {row.sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{row.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 20, padding: "16px",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>Rincian biaya</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text-2)" }}>
                  Jasa {draft.categoryName as string} ({draft.durationHours as number} × {rp(draft.ratePerHour as number)})
                </span>
                <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{rp(serviceAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text-2)" }}>Biaya aplikasi</span>
                <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{rp(APP_FEE)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text-2)" }}>Asuransi sesi</span>
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>Gratis</span>
              </div>
              {appliedVoucher && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--primary-700)" }}>Voucher ({appliedVoucher.code})</span>
                  <span style={{ color: "var(--primary-700)", fontWeight: 700 }}>−{rp(appliedVoucher.discountAmount)}</span>
                </div>
              )}
              <div style={{ height: 1, background: "var(--border-soft)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>Total</span>
                <div style={{ textAlign: "right" }}>
                  {appliedVoucher && (
                    <div style={{ fontSize: 12, color: "var(--text-3)", textDecoration: "line-through" }}>
                      {rp(serviceAmount + APP_FEE)}
                    </div>
                  )}
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{rp(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Voucher */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 20, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>
              Kode voucher
            </div>

            {appliedVoucher ? (
              <div style={{
                background: "var(--primary-50)", border: "1.5px solid var(--primary)",
                borderRadius: 14, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-700)" }}>
                    {appliedVoucher.code}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--primary-700)", marginTop: 1 }}>
                    {appliedVoucher.title} · hemat {rp(appliedVoucher.discountAmount)}
                  </div>
                </div>
                <button
                  onClick={() => setAppliedVoucher(null)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--primary)", fontSize: 18, fontWeight: 700, padding: "0 4px",
                  }}
                >×</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(null); }}
                  onKeyDown={e => e.key === "Enter" && applyVoucher()}
                  placeholder="Masukkan kode voucher"
                  style={{
                    flex: 1, borderRadius: 12, border: "1px solid var(--border)",
                    padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                    background: "var(--surface)", color: "var(--text-1)",
                    letterSpacing: 1, textTransform: "uppercase",
                  }}
                />
                <button
                  onClick={applyVoucher}
                  disabled={voucherLoading || !voucherCode.trim()}
                  style={{
                    padding: "10px 16px", borderRadius: 12,
                    border: "none", background: "var(--primary)",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    opacity: (!voucherCode.trim() || voucherLoading) ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  {voucherLoading ? "..." : "Pakai"}
                </button>
              </div>
            )}

            {voucherError && (
              <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 8, fontWeight: 600 }}>
                {voucherError}
              </div>
            )}

            {!appliedVoucher && draft && (
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    from: "booking",
                    serviceAmount: String(serviceAmount),
                    durationHours: String(draft.durationHours as number),
                    categoryId: String(draft.categoryId),
                    partnerUid,
                  });
                  router.push(`/vouchers?${params.toString()}`);
                }}
                style={{
                  marginTop: 10, width: "100%", padding: "10px",
                  borderRadius: 12, border: "1.5px dashed var(--primary-200)",
                  background: "var(--primary-50)", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "var(--primary)",
                  fontFamily: "inherit", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                Lihat voucher tersedia
              </button>
            )}
          </div>

          {/* Wallet pay */}
          {canUseWallet ? (
            <div style={{
              background: "var(--primary-50)", border: "2px solid var(--primary)",
              borderRadius: 20, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M2 10h20"/>
                  <circle cx="16" cy="15" r="1" fill="#fff" stroke="none"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-700)" }}>
                  Bayar dengan Dompet Sediaaku
                </div>
                <div style={{ fontSize: 12, color: "var(--primary-700)", marginTop: 2 }}>
                  Saldo: <strong>{rp(walletBalance)}</strong>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          ) : (
            <>
              {/* Transfer info */}
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border-soft)",
                borderRadius: 20, overflow: "hidden",
              }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-soft)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>Transfer ke rekening</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>Wajib sesuai nominal di bawah</div>
                </div>

                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Bank row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: "var(--surface-2)", border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2"/>
                        <path d="M2 10h20"/>
                        <circle cx="16" cy="15" r="1" fill="var(--text-2)" stroke="none"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{BANK_NAME}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>a.n {BANK_HOLDER}</div>
                    </div>
                  </div>

                  {/* Account number */}
                  <div style={{
                    background: "var(--surface-2)", borderRadius: 14, padding: "12px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", letterSpacing: 1 }}>
                      {BANK_ACCOUNT}
                    </span>
                    <button
                      onClick={copyAccount}
                      style={{
                        padding: "7px 16px", borderRadius: 10,
                        border: `1.5px solid ${copied ? "var(--primary)" : "var(--primary)"}`,
                        background: copied ? "var(--primary)" : "transparent",
                        color: copied ? "#fff" : "var(--primary)",
                        fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {copied ? "✓ Tersalin" : "Salin"}
                    </button>
                  </div>

                  {/* Amount chip */}
                  <div style={{
                    background: "var(--primary-50)", border: "1px solid var(--primary-200)",
                    borderRadius: 12, padding: "10px 14px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--primary-700)", fontWeight: 600 }}>Transfer sebesar</span>
                    <div style={{ textAlign: "right" }}>
                      {appliedVoucher && (
                        <div style={{ fontSize: 11, color: "var(--text-3)", textDecoration: "line-through" }}>
                          {rp(serviceAmount + APP_FEE)}
                        </div>
                      )}
                      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--primary)" }}>{rp(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload proof */}
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border-soft)",
                borderRadius: 20, overflow: "hidden",
              }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-soft)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>
                    Upload bukti transfer
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    Admin verifikasi maks. 15 menit setelah upload
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                  {proofPreview ? (
                    <div style={{ position: "relative" }}>
                      <img src={proofPreview} alt="Bukti transfer"
                        style={{ width: "100%", borderRadius: 12, objectFit: "cover", maxHeight: 220 }} />
                      <button
                        onClick={() => { setProofFile(null); setProofPreview(null); }}
                        style={{
                          position: "absolute", top: 8, right: 8,
                          width: 28, height: 28, borderRadius: 999,
                          background: "rgba(0,0,0,0.55)", border: "none",
                          color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >×</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{
                        width: "100%", padding: "28px 20px", borderRadius: 14,
                        border: "1.5px dashed var(--border)",
                        background: "var(--surface-2)", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                      }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: "var(--primary-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                          Tap untuk upload foto
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                          JPG, PNG · Maks 10MB
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {error && (
            <div style={{
              background: "var(--danger-bg)", borderRadius: 12, padding: "12px 14px",
              fontSize: 13, color: "var(--danger)", fontWeight: 600,
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "sticky", bottom: 0, zIndex: 20,
        background: "var(--surface)", borderTop: "1px solid var(--border-soft)",
        padding: "14px 20px 28px",
        boxShadow: "0 -4px 20px rgba(15,31,29,0.07)",
      }}>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ fontSize: 15, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Memproses..." : canUseWallet ? "Bayar dengan Dompet" : "Kirim & verifikasi"}
        </button>
      </div>
    </div>
  );
}
