"use client";

import { useRouter } from "next/navigation";

interface AppBarProps {
  title?: string;
  onBack?: () => void;
  fallback?: string;
  transparent?: boolean;
}

export function AppBar({ title, onBack, fallback = "/home", transparent }: AppBarProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) { onBack(); return; }
    router.back();
  }

  return (
    <div className={`appbar ${transparent ? "absolute top-0 left-0 right-0 z-10" : ""}`}>
      <button
        className="back-btn"
        style={transparent ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : {}}
        onClick={handleBack}
        aria-label="Kembali"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>
      {title && <span className="appbar-title">{title}</span>}
    </div>
  );
}
