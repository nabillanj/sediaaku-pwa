"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";

export type VoucherRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minTransactionAmount: number;
  minHours: number | null;
  validUntil: string;
};

export type HistoryRow = {
  code: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  usedAt: string;
};

function discountLabel(v: { discountType: string; discountValue: number; maxDiscount: number | null }) {
  if (v.discountType === "percent") {
    const suffix = v.maxDiscount ? ` (maks Rp ${v.maxDiscount.toLocaleString("id-ID")})` : "";
    return `Diskon ${v.discountValue}%${suffix}`;
  }
  return `Diskon Rp ${v.discountValue.toLocaleString("id-ID")}`;
}

function validUntilLabel(dateStr: string) {
  const d = new Date(dateStr);
  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `Sampai ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function usedAtLabel(dateStr: string) {
  const d = new Date(dateStr);
  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `Dipakai ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function getIneligibleReason(
  v: VoucherRow,
  serviceAmount: number,
  durationHours: number,
  categoryId: string | null
): string | null {
  if (v.minTransactionAmount > 0 && serviceAmount < v.minTransactionAmount)
    return `Min. transaksi Rp ${v.minTransactionAmount.toLocaleString("id-ID")}`;
  if (v.minHours && durationHours < v.minHours)
    return `Min. ${v.minHours} jam`;
  if (v.categoryId && v.categoryId !== categoryId)
    return "Tidak berlaku untuk kategori ini";
  return null;
}

const ACCENT_COLORS = [
  "linear-gradient(180deg, #0E7C71 0%, #14A89A 100%)",
  "linear-gradient(180deg, #14A89A 0%, #66c6bd 100%)",
  "linear-gradient(180deg, #085E55 0%, #0E7C71 100%)",
  "linear-gradient(180deg, #0b6d63 0%, #14A89A 100%)",
];

export default function VoucherClient({
  available,
  history,
  fromBooking = false,
  serviceAmount = 0,
  durationHours = 0,
  categoryId = null,
  partnerUid = null,
}: {
  available: VoucherRow[];
  history: HistoryRow[];
  fromBooking?: boolean;
  serviceAmount?: number;
  durationHours?: number;
  categoryId?: string | null;
  partnerUid?: string | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"tersedia" | "riwayat">("tersedia");

  function handlePilih(v: VoucherRow) {
    // Hitung diskon
    let discountAmount = 0;
    if (v.discountType === "flat") {
      discountAmount = Math.min(v.discountValue, serviceAmount);
    } else if (v.discountType === "percent") {
      discountAmount = Math.round((serviceAmount * v.discountValue) / 100);
      if (v.maxDiscount) discountAmount = Math.min(discountAmount, v.maxDiscount);
    }

    sessionStorage.setItem("selectedVoucher", JSON.stringify({
      voucherId: v.id,
      code: v.code,
      title: v.title,
      discountType: v.discountType,
      discountValue: v.discountValue,
      maxDiscount: v.maxDiscount,
      discountAmount,
    }));

    router.back();
  }

  return (
    <div className="pwa-shell">
      <AppBar title={fromBooking ? "Pilih Voucher" : "Voucher Saya"} />

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 24 }}>

        {/* Tabs */}
        <div style={{ background: "var(--surface)", display: "flex", borderBottom: "1px solid var(--border)" }}>
          {(["tersedia", "riwayat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "13px 0",
                fontSize: 14, fontWeight: 600,
                fontFamily: "inherit", border: "none",
                background: "transparent", cursor: "pointer",
                color: tab === t ? "var(--primary)" : "var(--text-2)",
                borderBottom: tab === t ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {t === "tersedia" ? "Tersedia" : "Riwayat"}
              {t === "tersedia" && available.length > 0 && (
                <span style={{
                  background: tab === "tersedia" ? "var(--primary)" : "var(--primary-100)",
                  color: tab === "tersedia" ? "#fff" : "var(--primary)",
                  fontSize: 11, fontWeight: 700,
                  borderRadius: 999, padding: "1px 7px",
                }}>
                  {available.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Tersedia */}
        {tab === "tersedia" && (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {available.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-3)" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "var(--primary-50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--primary)", margin: "0 auto 16px",
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>Belum ada voucher</div>
                <div style={{ fontSize: 13 }}>Voucher aktif akan muncul di sini</div>
              </div>
            ) : available.map((v, i) => {
              const ineligibleReason = fromBooking
                ? getIneligibleReason(v, serviceAmount, durationHours, categoryId)
                : null;
              const eligible = !ineligibleReason;

              return (
                <div
                  key={v.id}
                  className="card"
                  style={{
                    padding: 0, overflow: "hidden", display: "flex",
                    opacity: fromBooking && !eligible ? 0.5 : 1,
                  }}
                >
                  <div style={{ width: 5, flexShrink: 0, background: eligible ? ACCENT_COLORS[i % ACCENT_COLORS.length] : "var(--border)" }} />
                  <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                          color: eligible ? "var(--primary)" : "var(--text-3)",
                          background: eligible ? "var(--primary-50)" : "var(--surface-2)",
                          border: `1px solid ${eligible ? "var(--primary-100)" : "var(--border)"}`,
                          borderRadius: 6, padding: "2px 7px", display: "inline-block",
                        }}>
                          {v.code}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginTop: 4 }}>
                          {discountLabel(v)}
                        </div>
                        {v.description && (
                          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{v.description}</div>
                        )}
                      </div>

                      {fromBooking && (
                        <button
                          onClick={() => eligible && handlePilih(v)}
                          disabled={!eligible}
                          style={{
                            padding: "7px 16px", borderRadius: 10, flexShrink: 0,
                            border: eligible ? "none" : "1.5px solid var(--border)",
                            background: eligible ? "var(--primary)" : "transparent",
                            color: eligible ? "#fff" : "var(--text-3)",
                            fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                            cursor: eligible ? "pointer" : "not-allowed",
                          }}
                        >
                          Pakai
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {v.minTransactionAmount > 0 && (
                        <span style={{ fontSize: 11, color: "var(--text-2)", background: "var(--surface-2)", borderRadius: 999, padding: "3px 9px" }}>
                          Min. Rp {v.minTransactionAmount.toLocaleString("id-ID")}
                        </span>
                      )}
                      {v.minHours && (
                        <span style={{ fontSize: 11, color: "var(--text-2)", background: "var(--surface-2)", borderRadius: 999, padding: "3px 9px" }}>
                          Min. {v.minHours} jam
                        </span>
                      )}
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-3)", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--warn)", fontWeight: 600 }}>
                        {validUntilLabel(v.validUntil)}
                      </span>
                    </div>

                    {fromBooking && ineligibleReason && (
                      <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>
                        {ineligibleReason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Riwayat */}
        {tab === "riwayat" && (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-3)" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "var(--primary-50)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--primary)", margin: "0 auto 16px",
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>Belum ada riwayat</div>
                <div style={{ fontSize: 13 }}>Voucher yang sudah kamu pakai akan muncul di sini</div>
              </div>
            ) : history.map((v, i) => (
              <div key={i} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", opacity: 0.65 }}>
                <div style={{ width: 5, flexShrink: 0, background: "linear-gradient(180deg, #54655F 0%, #94A29D 100%)" }} />
                <div style={{ flex: 1, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                      color: "var(--text-3)", background: "var(--surface-2)",
                      border: "1px solid var(--border)", borderRadius: 6,
                      padding: "2px 7px", display: "inline-block",
                    }}>
                      {v.code}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", background: "var(--surface-2)", borderRadius: 999, padding: "2px 9px" }}>
                      Sudah dipakai
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)", marginTop: 4 }}>{discountLabel(v)}</div>
                  {v.description && <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{v.description}</div>}
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>{usedAtLabel(v.usedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
