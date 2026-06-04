"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "@/components/TabBar";

const QUICK_SEARCHES = [
  { label: "Jagain anak", emoji: "🛡️" },
  { label: "Bantuin beberes", emoji: "🤝" },
  { label: "Anterin dokumen", emoji: "📦" },
  { label: "Asuhin lansia", emoji: "💚" },
  { label: "Temenin aktivitas", emoji: "👥" },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  function doSearch(q: string) {
    if (!q.trim()) return;
    startTransition(() => {
      router.push(`/partners?q=${encodeURIComponent(q.trim())}`);
    });
  }

  return (
    <div className="pwa-shell">
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Search header */}
        <div style={{
          padding: "14px 22px 16px",
          position: "sticky", top: 0, zIndex: 10,
          background: "var(--bg)",
          borderBottom: "1px solid var(--border-soft)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => router.back()}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: "var(--surface-2)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>

            <div style={{
              flex: 1, background: "var(--surface)", border: "1.5px solid var(--primary)",
              borderRadius: 14, padding: "11px 14px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
                placeholder="Cari layanan atau Teman Sedia..."
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontSize: 14, fontFamily: "inherit", color: "var(--text-1)",
                }}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", lineHeight: 1, padding: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {query && (
              <button
                onClick={() => doSearch(query)}
                style={{
                  padding: "10px 14px", borderRadius: 12,
                  background: "var(--primary)", border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  fontFamily: "inherit", cursor: "pointer", flexShrink: 0,
                }}
              >
                Cari
              </button>
            )}
          </div>
        </div>

        {/* Quick search suggestions */}
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Pencarian populer
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {QUICK_SEARCHES.map((item) => (
              <button
                key={item.label}
                onClick={() => doSearch(item.label)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 16px", borderRadius: 14,
                  background: "var(--surface)", border: "1px solid var(--border-soft)",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  boxShadow: "0 1px 3px rgba(15,31,29,0.04)",
                }}
              >
                <span style={{ fontSize: 20 }}>{item.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{item.label}</span>
                <svg style={{ marginLeft: "auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      <TabBar active="home" />
    </div>
  );
}
