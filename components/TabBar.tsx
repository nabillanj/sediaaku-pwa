"use client";

import Link from "next/link";

type Tab = "home" | "orders" | "chat" | "profile";

const TABS = [
  {
    id: "home" as Tab,
    label: "Beranda",
    href: "/home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: "orders" as Tab,
    label: "Pesanan",
    href: "/orders",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: "chat" as Tab,
    label: "Chat",
    href: "/chat",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    id: "profile" as Tab,
    label: "Profil",
    href: "/profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

interface TabBarProps {
  active: Tab;
}

export function TabBar({ active }: TabBarProps) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`tabbar-item ${active === t.id ? "active" : ""}`}
          style={{ textDecoration: "none", color: active === t.id ? "var(--primary)" : "var(--text-3)" }}
        >
          {t.icon}
          <span className="tabbar-label">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
