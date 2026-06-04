"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 1 }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24"
            fill={s <= (hovered || value) ? "#F59E0B" : "none"}
            stroke="#F59E0B" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

const LABELS = ["", "Buruk", "Kurang baik", "Cukup", "Bagus", "Sangat bagus!"];

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!rating) { setError("Pilih bintang dulu"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan ulasan");
      setLoading(false);
      return;
    }
    router.replace(`/orders/${id}`);
  }

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* AppBar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px", position: "sticky", top: 0,
          background: "var(--bg)", zIndex: 10,
        }}>
          <Link href={`/orders/${id}`} style={{ textDecoration: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11, background: "var(--surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
          </Link>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
            Tulis Ulasan
          </div>
        </div>

        <div style={{ padding: "8px 16px 32px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Star rating */}
          <div className="card" style={{ padding: "24px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>
              Seberapa puas kamu dengan layanannya?
            </div>
            <StarPicker value={rating} onChange={setRating} />
            <div style={{
              fontSize: 14, fontWeight: 700, color: "var(--primary)",
              marginTop: 12, minHeight: 20,
            }}>
              {LABELS[rating]}
            </div>
          </div>

          {/* Comment */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
              Komentar (opsional)
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalamanmu..."
              maxLength={500}
              rows={4}
              style={{
                width: "100%", border: "1.5px solid var(--border)", borderRadius: 12,
                padding: "12px 14px", fontSize: 14, fontFamily: "inherit",
                color: "var(--text-1)", background: "var(--surface)",
                resize: "none", outline: "none", boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, textAlign: "right" }}>
              {comment.length}/500
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--danger)", textAlign: "center" }}>{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!rating || loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: rating && !loading ? "var(--primary)" : "var(--border)",
              color: rating && !loading ? "#fff" : "var(--text-3)",
              fontSize: 15, fontWeight: 700, fontFamily: "inherit",
              cursor: rating && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Menyimpan..." : "Kirim Ulasan"}
          </button>

        </div>
      </div>
    </div>
  );
}
