"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Done loading
      setWidth(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // Start progress when link is clicked
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      setWidth(30);
      timerRef.current = setTimeout(() => setWidth(70), 200);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999,
      height: 3,
      background: `linear-gradient(to right, var(--primary, #00897b) ${width}%, transparent ${width}%)`,
      transition: "width 0.3s ease",
      boxShadow: "0 0 8px var(--primary, #00897b)",
    }} />
  );
}
