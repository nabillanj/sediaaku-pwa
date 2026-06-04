"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";

function rp(n: number) { return "Rp " + Number(n).toLocaleString("id-ID"); }

interface Job {
  id: string;
  order_status: string;
  partner_earning: number;
  duration_hours: number;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  user_name: string;
}

export default function SelesaiClient({ job }: { job: Job }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const firstName = job.user_name.split(" ")[0];

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPhotos = Array.from(files).slice(0, 4 - photos.length).map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (photos.length === 0) {
      setError("Upload minimal 1 foto bukti");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // upload semua foto
      const urls: string[] = [];
      for (const p of photos) {
        const form = new FormData();
        form.append("file", p.file);
        form.append("folder", "job-proofs");
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload foto gagal");
        const data = await res.json();
        urls.push(data.url);
      }

      // complete order
      const res = await fetch(`/api/mitra/job/${job.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrls: urls, completionNote: note.trim() || null }),
      });
      if (!res.ok) throw new Error("Gagal menyelesaikan sesi");

      router.replace(`/mitra/job/${job.id}`);
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
          <BackButton fallback={`/mitra/job/${job.id}`} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
            Sesi hampir selesai ✨
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
            Sebelum tutup sesi, upload bukti kondisi terakhir.
          </div>

          {/* Photo upload */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 20, overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-soft)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>
                Foto bukti kondisi
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                Foto kondisi rumah/anak yang dijaga, atau selfie bersama · Maks 4 foto
              </div>
            </div>

            <div style={{ padding: "14px 16px" }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleFiles(e.target.files)}
                style={{ display: "none" }}
              />

              {photos.length > 0 && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: 8, marginBottom: 10,
                }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "4/3" }}>
                      <img src={p.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => removePhoto(i)}
                        style={{
                          position: "absolute", top: 6, right: 6,
                          width: 24, height: 24, borderRadius: 999,
                          background: "rgba(0,0,0,0.55)", border: "none",
                          color: "#fff", fontSize: 14, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 4 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: "100%", padding: "20px", borderRadius: 14,
                    border: "1.5px dashed var(--border)",
                    background: "var(--surface-2)", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "var(--primary-50)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                    {photos.length === 0 ? "Ambil foto bukti" : "Tambah foto"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {4 - photos.length} slot tersisa
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Completion note */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border-soft)",
            borderRadius: 20, padding: "14px 16px",
          }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", display: "block", marginBottom: 10 }}>
              Catatan untuk {firstName} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-3)" }}>(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={`Cth: Anak makan & tidur siang sesuai jadwal. Susu habis 1 botol. Semua aman 🙏`}
              rows={4}
              style={{
                width: "100%", borderRadius: 12, border: "1px solid var(--border)",
                padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                background: "var(--surface-2)", color: "var(--text-1)",
                resize: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Earning summary */}
          <div style={{
            background: "var(--primary-50)", border: "1px solid var(--primary-200)",
            borderRadius: 20, padding: "16px",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Ringkasan sesi</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)", marginBottom: 6 }}>
              Kamu terima {rp(job.partner_earning)}
            </div>
            <div style={{ fontSize: 12, color: "var(--primary-700)", lineHeight: 1.6 }}>
              Saldo akan masuk dalam maks 1 hari kerja. Bisa dicairkan kapan saja.
            </div>
          </div>

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
          {loading ? "Menyimpan..." : "Tutup sesi"}
        </button>
      </div>
    </div>
  );
}
