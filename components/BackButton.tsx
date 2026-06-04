"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      style={{
        display: "inline-flex", width: 36, height: 36, borderRadius: 12,
        background: "var(--bg, #f3f4f6)",
        alignItems: "center", justifyContent: "center",
        border: "1px solid var(--border-soft, #e5e7eb)", cursor: "pointer",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-2, #374151)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
    </button>
  );
}
