"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import type { UserAddress } from "@/lib/actions/addresses";

const CARE_OPTIONS = [
  { key: "anak", label: "Anak" },
  { key: "lansia", label: "Lansia" },
  { key: "hewan", label: "Hewan" },
  { key: "rumah", label: "Rumah" },
  { key: "lainnya", label: "Lainnya" },
] as const;

export default function BookingAlamatClient({
  partnerUid,
  savedAddresses,
}: {
  partnerUid: string;
  savedAddresses: UserAddress[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("bookingDraft");
    if (!raw) { router.replace(`/booking/${partnerUid}`); return; }
    setDraft(JSON.parse(raw));
  }, [partnerUid, router]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    savedAddresses.find(a => a.is_default)?.id ?? savedAddresses[0]?.id ?? null
  );
  const [manualAddress, setManualAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [careSubjects, setCareSubjects] = useState<string[]>([]);
  const [userNote, setUserNote] = useState("");
  const [useManual, setUseManual] = useState(savedAddresses.length === 0);

  const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
  const finalAddress = useManual ? manualAddress : (selectedAddr?.address ?? "");
  const canContinue = finalAddress.trim().length > 0;

  function toggleCare(key: string) {
    setCareSubjects(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function handleContinue() {
    if (!draft || !canContinue) return;
    const updated = {
      ...draft,
      address: finalAddress,
      addressKabupaten: useManual ? "" : (selectedAddr?.kabupaten ?? ""),
      addressLat: useManual ? null : (selectedAddr?.latitude ?? null),
      addressLng: useManual ? null : (selectedAddr?.longitude ?? null),
      landmark: landmark.trim() || null,
      careSubjects,
      userNote: userNote.trim() || null,
    };
    sessionStorage.setItem("bookingDraft", JSON.stringify(updated));
    router.push(`/booking/${partnerUid}/bayar`);
  }

  if (!draft) return null;

  const schedDate = draft.scheduledDate as string;
  const dateLabel = new Date(schedDate).toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short",
  });

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 96 }}>

        {/* AppBar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", position: "sticky", top: 0,
          background: "var(--bg)", zIndex: 10,
          borderBottom: "1px solid var(--border-soft)",
        }}>
          <BackButton fallback={`/booking/${partnerUid}`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Detail Booking</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>2 dari 3</div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Schedule summary chip */}
          <div style={{
            background: "var(--primary-50)", border: "1px solid var(--primary-200)",
            borderRadius: 14, padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 600, color: "var(--primary-700)",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {dateLabel} · {draft.startTime as string} – {draft.endTime as string} · {draft.durationHours as number} jam
          </div>

          {/* Alamat section */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 12 }}>
              Alamat layanan
            </div>

            {/* Saved addresses */}
            {savedAddresses.length > 0 && !useManual && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {savedAddresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    style={{
                      textAlign: "left", padding: "12px 14px", borderRadius: 14,
                      border: `1.5px solid ${selectedAddressId === addr.id ? "var(--primary)" : "var(--border)"}`,
                      background: selectedAddressId === addr.id ? "var(--primary-50)" : "var(--surface)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: selectedAddressId === addr.id ? "var(--primary)" : "var(--surface-2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke={selectedAddressId === addr.id ? "#fff" : "var(--text-3)"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>
                          {addr.label}
                          {addr.is_default && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: "var(--primary)",
                              background: "var(--primary-50)", borderRadius: 999,
                              padding: "1px 7px", marginLeft: 6,
                            }}>Utama</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.4 }}>{addr.address}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{addr.kabupaten}</div>
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setUseManual(true)}
                  style={{
                    padding: "12px 14px", borderRadius: 14,
                    border: "1.5px dashed var(--primary-200)",
                    background: "var(--primary-50)",
                    color: "var(--primary)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Masukkan alamat lain
                </button>
              </div>
            )}

            {/* Manual input */}
            {useManual && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {savedAddresses.length > 0 && (
                  <button
                    onClick={() => setUseManual(false)}
                    style={{
                      fontSize: 12, color: "var(--primary)", fontWeight: 600,
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left", padding: 0, marginBottom: 4,
                    }}
                  >
                    ← Pilih dari tersimpan
                  </button>
                )}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                    Alamat lengkap *
                  </label>
                  <textarea
                    value={manualAddress}
                    onChange={e => setManualAddress(e.target.value)}
                    placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan, Kecamatan"
                    rows={3}
                    style={{
                      width: "100%", borderRadius: 12, border: "1px solid var(--border)",
                      padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                      background: "var(--surface)", color: "var(--text-1)",
                      resize: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Landmark */}
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                Patokan (opsional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="Cth: Sebelah Indomaret, pagar hitam"
                style={{
                  width: "100%", borderRadius: 12, border: "1px solid var(--border)",
                  padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                  background: "var(--surface)", color: "var(--text-1)", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Care subjects */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
              Yang dijaga / dibantu
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
              Pilih satu atau lebih (opsional)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CARE_OPTIONS.map(opt => {
                const active = careSubjects.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleCare(opt.key)}
                    style={{
                      padding: "7px 16px", borderRadius: 999,
                      border: `1.5px solid ${active ? "var(--primary)" : "var(--border)"}`,
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#fff" : "var(--text-2)",
                      cursor: "pointer",
                      fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", display: "block", marginBottom: 6 }}>
              Catatan untuk mitra
            </label>
            <textarea
              value={userNote}
              onChange={e => setUserNote(e.target.value)}
              placeholder={`Cth: Anak suka main di luar, susu di kulkas bawah, dll.`}
              rows={4}
              style={{
                width: "100%", borderRadius: 12, border: "1px solid var(--border)",
                padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                background: "var(--surface)", color: "var(--text-1)",
                resize: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Insurance note */}
          <div style={{
            background: "var(--surface-2)", borderRadius: 12, padding: "12px 14px",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
              Semua sesi tercatat & terlindungi asuransi Sediaaku
            </div>
          </div>
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
          onClick={handleContinue}
          disabled={!canContinue}
          style={{ fontSize: 15, opacity: canContinue ? 1 : 0.5 }}
        >
          Lanjut ke ringkasan
        </button>
      </div>
    </div>
  );
}
