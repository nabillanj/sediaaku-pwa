"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REASONS = [
  {
    id: "profile_mismatch",
    label: "Mitra tidak sesuai profil",
    sub: "Foto, identitas, atau keahlian tidak cocok",
  },
  {
    id: "late",
    label: "Datang sangat terlambat",
    sub: "Atau tidak datang sama sekali",
  },
  {
    id: "unsatisfactory",
    label: "Pelayanan tidak memuaskan",
    sub: "Tidak sesuai catatan/instruksi yang diberikan",
  },
  {
    id: "safety",
    label: "Masalah keamanan",
    sub: "Ada potensi bahaya atau pelecehan",
  },
  {
    id: "property_damage",
    label: "Barang/properti rusak",
    sub: "Kerusakan saat sesi berlangsung",
  },
  {
    id: "other",
    label: "Lainnya",
    sub: "",
  },
];

type Props = {
  orderId: string;
  orderShortId: string;
  partnerFirstName: string;
  categoryEmoji: string;
  categoryName: string;
  scheduledDate: string;
};

export default function ReportForm({
  orderId,
  orderShortId,
  partnerFirstName,
  categoryEmoji,
  categoryName,
  scheduledDate,
}: Props) {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: selectedReason, detail }),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--primary-50)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, marginBottom: 20,
        }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", marginBottom: 8 }}>Laporan terkirim</div>
        <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 32 }}>
          Tim Sediaaku akan menindaklanjuti laporanmu dalam{" "}
          <span style={{ fontWeight: 700, color: "var(--text-1)" }}>1×24 jam</span>.
          Identitasmu dirahasiakan.
        </div>
        <button
          onClick={() => router.push("/my-reports")}
          className="btn-primary"
          style={{ maxWidth: 280 }}
        >
          Kembali ke Pusat Bantuan
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      {/* Info banner */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{
          background: "var(--surface-2)", borderRadius: 14,
          padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: "var(--primary-50)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>
            {categoryEmoji}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              Pesanan #{orderShortId}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>
              {partnerFirstName} · {scheduledDate} · {categoryName}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>Pilih alasan</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {REASONS.map((reason) => {
            const selected = selectedReason === reason.id;
            return (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "14px 16px",
                  background: selected ? "var(--primary-50)" : "var(--surface)",
                  border: selected ? "1.5px solid var(--primary)" : "1px solid var(--border-soft)",
                  borderRadius: 14,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  border: selected ? "2px solid var(--primary)" : "2px solid var(--border)",
                  background: selected ? "var(--primary)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5 9-11"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: selected ? "var(--primary-700)" : "var(--text-1)" }}>
                    {reason.label}
                  </div>
                  {reason.sub && (
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{reason.sub}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>
          Detail <span style={{ fontWeight: 400, color: "var(--text-3)" }}>(opsional)</span>
        </div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Ceritakan masalahmu secara singkat..."
          rows={4}
          style={{
            width: "100%", borderRadius: 14, border: "1px solid var(--border-soft)",
            background: "var(--surface)", padding: "12px 14px",
            fontSize: 14, color: "var(--text-1)", fontFamily: "inherit",
            resize: "none", outline: "none", boxSizing: "border-box",
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* Note */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{
          background: "var(--surface-2)", borderRadius: 12,
          padding: "10px 14px",
          fontSize: 12, color: "var(--text-3)", lineHeight: 1.6,
        }}>
          Laporan kamu langsung masuk ke tim Sediaaku & ditangani dalam{" "}
          <span style={{ fontWeight: 700, color: "var(--text-1)" }}>1×24 jam</span>.
          Identitasmu dirahasiakan.
        </div>
      </div>

      {/* Submit */}
      <div style={{ padding: "16px 16px 32px" }}>
        <button
          onClick={handleSubmit}
          disabled={!selectedReason || submitting}
          className="btn-primary"
        >
          {submitting ? "Mengirim..." : "Kirim laporan"}
        </button>
      </div>
    </div>
  );
}
