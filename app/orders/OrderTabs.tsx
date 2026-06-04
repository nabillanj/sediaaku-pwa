"use client";

import { useRouter, usePathname } from "next/navigation";

const TABS = [
  { id: "semua", label: "Semua" },
  { id: "aktif", label: "Aktif" },
  { id: "selesai", label: "Selesai" },
  { id: "dibatalkan", label: "Dibatalkan" },
];

export default function OrderTabs({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div style={{
      display: "flex", gap: 6, overflowX: "auto",
      padding: "2px 22px 12px", margin: "0 -22px",
      scrollbarWidth: "none",
    }}>
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => router.push(`${pathname}?tab=${t.id}`)}
            style={{
              flexShrink: 0, height: 34, padding: "0 14px",
              borderRadius: 999, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700,
              background: isActive ? "var(--primary)" : "var(--surface)",
              color: isActive ? "#fff" : "var(--text-2)",
              boxShadow: isActive ? "none" : "0 0 0 1.5px var(--border)",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
